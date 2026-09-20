import cloudinary from "../config/cloudinary";
import {
    MessageModel,
    type ChatMessageDoc,
    computeExpireAt,
    MESSAGE_TTL_DELIVERED,
    IMAGE_TTL,
} from "../model/message.model";

export type SyncMessageInput = {
    id: string;
    roomId: string;
    sender: string;
    senderId?: string;
    content?: string;
    type?: "user" | "system" | "assistant";
    imageUrl?: string;
    imagePublicId?: string;
    localImagePath?: string;
    delivered?: boolean;
    deliveredAt?: number;
    createdAt?: number;
};

function toDoc(input: SyncMessageInput): Omit<ChatMessageDoc, "_id"> {
    const createdAt = input.createdAt ? new Date(input.createdAt) : new Date();
    const delivered = input.delivered ?? false;
    const deliveredAt = input.deliveredAt ? new Date(input.deliveredAt) : undefined;

    let expireAt: Date;
    if (delivered) {
        const base = deliveredAt && deliveredAt.getTime() > 0 ? deliveredAt : new Date();
        expireAt = new Date(base.getTime() + MESSAGE_TTL_DELIVERED);
    } else {
        expireAt = computeExpireAt(false, createdAt);
    }

    return {
        id: input.id,
        roomId: input.roomId,
        sender: input.sender,
        senderId: input.senderId,
        content: input.content ?? "",
        type: input.type ?? "user",
        imageUrl: input.imageUrl,
        imagePublicId: input.imagePublicId,
        localImagePath: input.localImagePath,
        delivered,
        deliveredAt,
        expireAt,
        createdAt,
    };
}

export async function bulkUpsert(inputs: SyncMessageInput[]) {
    if (!inputs.length) return { upserted: 0 };

    const ops = inputs.map((input) => ({
        updateOne: {
            filter: { id: input.id },
            update: { $set: toDoc(input) },
            upsert: true,
        },
    }));

    const result = await MessageModel.bulkWrite(ops, { ordered: false });
    return { upserted: result.upsertedCount + result.modifiedCount };
}

export async function getRoomMessages(roomId: string, limit = 500) {
    return MessageModel.find({ roomId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .then((docs) => docs.reverse());
}

export async function getMessagesSince(roomId: string, since: number) {
    return MessageModel.find({ roomId, createdAt: { $gt: new Date(since) } })
        .sort({ createdAt: 1 })
        .lean();
}

export async function markDelivered(messageIds: string[]) {
    if (!messageIds.length) return { updated: 0 };

    const result = await MessageModel.updateMany(
        { id: { $in: messageIds }, delivered: { $ne: true } },
        {
            $set: {
                delivered: true,
                deliveredAt: new Date(),
                expireAt: computeExpireAt(true, new Date()),
            },
        }
    );
    return { updated: result.modifiedCount };
}

export async function deleteMessages(roomId: string, messageIds: string[]) {
    if (!messageIds.length) return { deleted: 0 };
    const docs = await MessageModel.find({ roomId, id: { $in: messageIds } }).select("imagePublicId").lean();
    for (const doc of docs) {
        if (doc.imagePublicId) {
            await deleteCloudinaryImage(doc.imagePublicId);
        }
    }
    const result = await MessageModel.deleteMany({ roomId, id: { $in: messageIds } });
    return { deleted: result.deletedCount };
}

async function deleteCloudinaryImage(publicId: string) {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch {
        // image may already be gone
    }
}

/**
 * Deletes Cloudinary-stored images 7 days after upload, regardless of message TTL.
 * Called periodically by the cleanup scheduler. MongoDB TTL removes the docs later.
 */
export async function cleanupExpiredImages(): Promise<number> {
    const docs = await MessageModel.find({
        imagePublicId: { $exists: true, $ne: null },
    })
        .select("id imagePublicId createdAt")
        .lean();

    let cleaned = 0;
    for (const doc of docs) {
        if (!doc.imagePublicId) continue;
        const ttlAt = doc.createdAt.getTime() + IMAGE_TTL;
        if (ttlAt <= Date.now()) {
            await deleteCloudinaryImage(doc.imagePublicId);
            await MessageModel.updateOne(
                { id: doc.id },
                { $unset: { imagePublicId: "", imageUrl: "" } }
            );
            cleaned++;
        }
    }
    return cleaned;
}

export function startCleanupScheduler(intervalMs = 60 * 60 * 1000) {
    const run = async () => {
        try {
            const cleaned = await cleanupExpiredImages();
            if (cleaned > 0) {
                console.log(`🧹 Cleaned ${cleaned} expired cloudinary image(s)`);
            }
        } catch (err) {
            console.error("🧹 Cleanup scheduler error:", err);
        }
    };
    run();
    return setInterval(run, intervalMs);
}