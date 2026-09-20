import mongoose, { Schema, type InferSchemaType } from "mongoose";

const MESSAGE_TTL_DELIVERED = 7 * 24 * 60 * 60 * 1000;
const MESSAGE_TTL_UNDELIVERED = 60 * 24 * 60 * 60 * 1000;
const IMAGE_TTL = 7 * 24 * 60 * 60 * 1000;

const messageSchema = new Schema({
    id: { type: String, required: true, unique: true, index: true },
    roomId: { type: String, required: true, index: true },
    sender: { type: String, required: true },
    senderId: { type: String, default: undefined },
    content: { type: String, default: "" },
    type: { type: String, enum: ["user", "system", "assistant"], default: "user" },
    imageUrl: { type: String, default: undefined },
    imagePublicId: { type: String, default: undefined },
    localImagePath: { type: String, default: undefined },
    delivered: { type: Boolean, default: false },
    deliveredAt: { type: Date, default: undefined },
    expireAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

export type ChatMessageDoc = InferSchemaType<typeof messageSchema> & {
    _id: mongoose.Types.ObjectId;
};

export function computeExpireAt(delivered: boolean, base: Date = new Date()): Date {
    return new Date(base.getTime() + (delivered ? MESSAGE_TTL_DELIVERED : MESSAGE_TTL_UNDELIVERED));
}

export const MessageModel: mongoose.Model<ChatMessageDoc> =
    (mongoose.models.Message as mongoose.Model<ChatMessageDoc> | undefined) ??
    mongoose.model<ChatMessageDoc>("Message", messageSchema, "chatmessages");

export { MESSAGE_TTL_DELIVERED, MESSAGE_TTL_UNDELIVERED, IMAGE_TTL };