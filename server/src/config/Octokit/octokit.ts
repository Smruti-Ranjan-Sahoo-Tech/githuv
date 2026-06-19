import { Octokit } from "octokit";
import type { Request } from "express";
import { User } from "../../models/user.model";

export const createOctokit = (accessToken: string) => {
  return new Octokit({
    auth: accessToken,
  });
};

export async function getAuthenticatedOctokit(req: Request) {
  const firebaseUID = (req as any).user?.firebaseUID;
  if (!firebaseUID) {
    throw new Error("Unauthorized: no firebaseUID in request");
  }
  const user: any = await User.findOne({ firebaseUID }).select("+githubAccessToken");
  if (!user?.githubAccessToken) {
    throw new Error("GitHub access token not found for user");
  }
  return createOctokit(user.githubAccessToken);
}