import mongoose, { type Document, Schema } from "mongoose";

export interface IResume extends Document {
  user: mongoose.Types.ObjectId;
  firebaseUID: string;
  threadId: string;
  latexCode: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  version: number;
  name: string;
  isLatest: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    firebaseUID: {
      type: String,
      required: true,
      index: true,
    },
    threadId: {
      type: String,
      default: "",
    },
    latexCode: {
      type: String,
      required: true,
    },
    cloudinaryUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    isLatest: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

resumeSchema.index({ firebaseUID: 1, version: -1 });

export const Resume = mongoose.model<IResume>("Resume", resumeSchema);
