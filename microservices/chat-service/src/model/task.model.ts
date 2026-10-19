import mongoose, { Schema, type InferSchemaType } from "mongoose";

const userRefSchema = new Schema(
    {
        userId: { type: String, required: true },
        username: { type: String, required: true },
        avatar: { type: String, default: null },
    },
    { _id: false }
);

const repoRefSchema = new Schema(
    {
        owner: { type: String, required: true },
        name: { type: String, required: true },
        fullName: { type: String, required: true },
    },
    { _id: false }
);

/**
 * Durable, database-backed copy of the extension's task board. Scoped by `uid`
 * (the authenticated VS Code user) so a user always sees their tasks again —
 * on any machine, weeks after they were created.
 */
const taskSchema = new Schema(
    {
        id: { type: String, required: true, index: true },
        uid: { type: String, required: true, index: true },
        username: { type: String, default: "" },
        title: { type: String, required: true },
        description: { type: String, default: null },
        status: { type: String, enum: ["todo", "in_progress", "done"], default: "todo" },
        priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
        tags: { type: [String], default: [] },
        assignee: { type: userRefSchema, default: null },
        dueDate: { type: String, default: null },
        repository: { type: repoRefSchema, default: null },
        // `owner/repo` (lowercased) of the workspace the task belongs to, or ""
        // for tasks created outside a repo. A user only ever gets tasks whose
        // repoKey matches the repository they have open.
        repoKey: { type: String, default: "", index: true },
        createdBy: { type: userRefSchema, required: true },
        // ISO strings — mirrors the extension's Task type exactly so a pull
        // round-trips without conversion.
        createdAt: { type: String, required: true },
        updatedAt: { type: String, required: true },
        // Soft delete: keeps a record so other users of the repository get the
        // deletion instead of re-pushing the task from their local store.
        deletedAt: { type: String, default: null },
    },
    { timestamps: false }
);

taskSchema.index({ uid: 1, repoKey: 1, updatedAt: -1 });
taskSchema.index({ id: 1, uid: 1 }, { unique: true });

export type TaskDoc = InferSchemaType<typeof taskSchema> & {
    _id: mongoose.Types.ObjectId;
};

export const TaskModel: mongoose.Model<TaskDoc> =
    (mongoose.models.Task as mongoose.Model<TaskDoc> | undefined) ??
    mongoose.model<TaskDoc>("Task", taskSchema, "tasks");
