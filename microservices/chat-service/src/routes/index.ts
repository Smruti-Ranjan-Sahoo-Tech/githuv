import { Router } from "express";
import { upload } from "../config/cloudinary";
import { requireAuth } from "../middleware/auth";
import {
    bulkUpsert,
    deleteMessages,
    getMessagesSince,
    getRoomMessages,
    markDelivered,
    type SyncMessageInput,
} from "../controller/message.controller";
import {
    deleteTask,
    listTasks,
    upsertTasks,
    type TaskInput,
} from "../controller/task.controller";

const router = Router();

router.get("/", (_req, res) => {
    res.json({ success: true, message: "Chat service API" });
});

// Client pushes local-first (RxDB) messages up to MongoDB
router.post("/messages/sync", async (req, res) => {
    try {
        const inputs: SyncMessageInput[] = Array.isArray(req.body?.messages) ? req.body.messages : [];
        const result = await bulkUpsert(inputs);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Sync failed" });
    }
});

// Full history pull for a room (initial load / reinstall)
router.get("/messages/:roomId", async (req, res) => {
    try {
        const messages = await getRoomMessages(req.params.roomId);
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed to load messages" });
    }
});

// Incremental pull: messages created after `since` (ms epoch)
router.get("/messages/:roomId/since", async (req, res) => {
    try {
        const since = Number(req.query.since ?? 0);
        const messages = await getMessagesSince(req.params.roomId, Number.isFinite(since) ? since : 0);
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed to sync messages" });
    }
});

// Mark messages as delivered -> TTL switches from 2 months to 7 days
router.post("/messages/delivered", async (req, res) => {
    try {
        const ids: string[] = Array.isArray(req.body?.messageIds) ? req.body.messageIds : [];
        const result = await markDelivered(ids);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed to mark delivered" });
    }
});

// Delete messages (also removes cloudinary images)
router.delete("/messages/:roomId", async (req, res) => {
    try {
        const ids: string[] = Array.isArray(req.body?.messageIds) ? req.body.messageIds : [];
        const result = await deleteMessages(req.params.roomId, ids);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed to delete messages" });
    }
});

// ── Durable tasks (per user + repository, survives reinstalls / restarts) ──
router.get("/tasks", requireAuth, async (req, res) => {
    try {
        const repoKey = typeof req.query.repoKey === "string" ? req.query.repoKey.toLowerCase() : "";
        const { tasks, deletedIds } = await listTasks(req.user!, repoKey);
        res.json({ success: true, tasks, deletedIds });
    } catch (err) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed to load tasks" });
    }
});

router.post("/tasks/sync", requireAuth, async (req, res) => {
    try {
        const inputs: TaskInput[] = Array.isArray(req.body?.tasks) ? req.body.tasks : [];
        const result = await upsertTasks(req.user!, inputs);
        res.json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Task sync failed" });
    }
});

router.delete("/tasks/:id", requireAuth, async (req, res) => {
    try {
        const id = typeof req.params.id === "string" ? req.params.id : "";
        const repoKey = typeof req.query.repoKey === "string" ? req.query.repoKey.toLowerCase() : "";
        if (!id) {
            res.status(400).json({ success: false, error: "Task id is required" });
            return;
        }
        const deleted = await deleteTask(req.user!, id, repoKey);
        res.json({ success: true, deleted });
    } catch (err) {
        res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed to delete task" });
    }
});

// Temporary image upload -> Cloudinary (auto-deleted after 7 days elsewhere)
router.post("/images/upload", upload.single("image"), (req, res) => {
    const file = (req as any).file as { path?: string; public_id?: string } | undefined;
    if (!file?.path) {
        res.status(400).json({ success: false, error: "No image uploaded" });
        return;
    }
    res.json({
        success: true,
        imageUrl: file.path,
        publicId: file.public_id,
    });
});

export default router;