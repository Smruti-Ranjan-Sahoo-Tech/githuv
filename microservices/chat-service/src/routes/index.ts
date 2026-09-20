import { Router } from "express";
import { upload } from "../config/cloudinary";
import {
    bulkUpsert,
    deleteMessages,
    getMessagesSince,
    getRoomMessages,
    markDelivered,
    type SyncMessageInput,
} from "../controller/message.controller";

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