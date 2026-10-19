import { TaskModel, type TaskDoc } from "../model/task.model";
import type { AuthedUser } from "../middleware/auth";
import { notifyTasksChanged } from "../services/taskEvents";

export interface TaskInput {
    id?: unknown;
    title?: unknown;
    description?: unknown;
    status?: unknown;
    priority?: unknown;
    tags?: unknown;
    assignee?: unknown;
    dueDate?: unknown;
    repository?: unknown;
    createdBy?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
}

const STATUSES = ["todo", "in_progress", "done"] as const;
const PRIORITIES = ["low", "medium", "high"] as const;

interface UserRef {
    userId: string;
    username: string;
    avatar: string | null;
}

interface SanitizedTask {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    tags: string[];
    assignee: UserRef | null;
    dueDate: string | null;
    repository: { owner: string; name: string; fullName: string } | null;
    createdBy: UserRef;
    createdAt: string;
    updatedAt: string;
}

function sanitizeString(value: unknown, max = 1000): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function sanitizeUserRef(value: unknown): { userId: string; username: string; avatar: string | null } | null {
    if (!value || typeof value !== "object") return null;
    const raw = value as { userId?: unknown; username?: unknown; avatar?: unknown };
    const userId = sanitizeString(raw.userId, 255);
    const username = sanitizeString(raw.username, 255);
    if (!userId || !username) return null;
    return { userId, username, avatar: sanitizeString(raw.avatar, 2048) };
}

function sanitizeRepoRef(value: unknown): { owner: string; name: string; fullName: string } | null {
    if (!value || typeof value !== "object") return null;
    const raw = value as { owner?: unknown; name?: unknown; fullName?: unknown };
    const owner = sanitizeString(raw.owner, 255);
    const name = sanitizeString(raw.name, 255);
    const fullName = sanitizeString(raw.fullName, 512);
    if (!owner || !name || !fullName) return null;
    return { owner, name, fullName };
}

function sanitizeTags(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    const tags: string[] = [];
    for (const item of value) {
        const tag = sanitizeString(item, 100);
        if (tag && !tags.includes(tag)) tags.push(tag);
    }
    return tags;
}

function sanitizeTask(input: TaskInput, user: AuthedUser): SanitizedTask | null {
    const id = sanitizeString(input.id, 100);
    const title = sanitizeString(input.title, 1000);
    if (!id || !title) return null;

    const status = STATUSES.includes(input.status as (typeof STATUSES)[number])
        ? (input.status as string)
        : "todo";
    const priority = PRIORITIES.includes(input.priority as (typeof PRIORITIES)[number])
        ? (input.priority as string)
        : "medium";

    const now = new Date().toISOString();
    const createdBy = sanitizeUserRef(input.createdBy) ?? {
        userId: user.uid,
        username: user.username ?? user.uid,
        avatar: null,
    };

    return {
        id,
        title,
        description: sanitizeString(input.description, 10000),
        status,
        priority,
        tags: sanitizeTags(input.tags),
        assignee: sanitizeUserRef(input.assignee),
        dueDate: sanitizeString(input.dueDate, 50),
        repository: sanitizeRepoRef(input.repository),
        createdBy,
        createdAt: sanitizeString(input.createdAt, 100) ?? now,
        updatedAt: sanitizeString(input.updatedAt, 100) ?? now,
    };
}

/** `owner/repo` (lowercased) of a task's repository, or "" when it has none. */
function repoKeyOf(task: { repository: { owner: string; name: string } | null }): string {
    if (!task.repository) return "";
    return `${task.repository.owner}/${task.repository.name}`.toLowerCase();
}

/**
 * Tasks visible for a repository. Repo tasks form a shared board: everyone
 * with that repository open sees them (any uid). Tasks without a repository
 * are personal (uid-scoped). `repoKey` "" means "no repository open".
 */
function boardFilter(user: AuthedUser, repoKey: string): Record<string, unknown> {
    const personalUnscoped = { repoKey: "", uid: user.uid };
    if (repoKey) {
        return { $or: [{ repoKey }, personalUnscoped] };
    }
    return personalUnscoped;
}

export interface TaskPullResult {
    tasks: Record<string, unknown>[];
    deletedIds: string[];
}

/**
 * Live tasks of a repository board plus the ids of soft-deleted tasks so the
 * client can drop them locally instead of re-pushing them (resurrection).
 */
export async function listTasks(user: AuthedUser, repoKey: string): Promise<TaskPullResult> {
    const filter = boardFilter(user, repoKey);
    const docs = await TaskModel.find({ ...filter, deletedAt: null }).sort({ createdAt: -1 }).lean();
    const tombstones = await TaskModel.find({ ...filter, deletedAt: { $ne: null } }).select("id").lean();
    return {
        tasks: docs.map((doc) => toClientShape(doc)),
        deletedIds: tombstones.map((doc) => doc.id).filter(Boolean),
    };
}

/** Upserts tasks onto the repository board (or the personal list). */
export async function upsertTasks(
    user: AuthedUser,
    inputs: TaskInput[]
): Promise<{ received: number; saved: number }> {
    let saved = 0;
    const notified = new Set<string>();

    for (const input of inputs) {
        const task = sanitizeTask(input, user);
        if (!task) continue;

        const repoKey = repoKeyOf(task);
        const { createdAt, ...fields } = task;
        await TaskModel.updateOne(
            repoKey ? { id: task.id } : { id: task.id, uid: user.uid },
            {
                $set: {
                    ...fields,
                    repoKey,
                    // An upsert is a live version of the task again.
                    deletedAt: null,
                },
                $setOnInsert: {
                    createdAt,
                    uid: user.uid,
                    username: user.username ?? "",
                },
            },
            { upsert: true }
        );
        saved += 1;
        if (repoKey) notified.add(repoKey);
    }

    for (const key of notified) {
        notifyTasksChanged(key);
    }

    return { received: inputs.length, saved };
}

/**
 * Soft-deletes a task so every user of the repository is told about it; a
 * hard delete would let other clients re-push it from their local store.
 */
export async function deleteTask(user: AuthedUser, id: string, repoKey: string): Promise<boolean> {
    const result = await TaskModel.updateOne(
        repoKey ? { id, $or: [{ uid: user.uid }, { repoKey }] } : { id, uid: user.uid },
        { $set: { deletedAt: new Date().toISOString() } }
    );
    const modified = (result.modifiedCount ?? 0) > 0;
    if (modified && repoKey) {
        notifyTasksChanged(repoKey);
    }
    return modified;
}

function toClientShape(doc: Record<string, unknown>): Record<string, unknown> {
    const { _id: _ignored, uid: _uid, username: _username, __v: _v, deletedAt: _deleted, ...rest } = doc as Record<string, unknown> & {
        _id?: unknown;
        uid?: unknown;
        username?: unknown;
        __v?: unknown;
        deletedAt?: unknown;
    };
    return rest;
}
