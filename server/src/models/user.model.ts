import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    firebaseUID: string;
    githubId: number;
    githubUsername: string;
    githubAccessToken?: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema=new Schema<IUser>({
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    githubId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },

    githubUsername: {
      type: String,
      required: true,
      trim: true,
    },

    githubAccessToken: {
      type: String,
      required: true,
      select: false, // hidden by default in queries
    },
},
  {timestamps:true}
)

export const User = mongoose.model<IUser>("User",userSchema)