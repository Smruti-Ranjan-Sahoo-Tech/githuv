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
  if (firebaseUID) {
    const user: any = await User.findOne({ firebaseUID }).select("+githubAccessToken");
    if (user?.githubAccessToken) {
      return createOctokit(user.githubAccessToken);
    }
  }
  const bodyToken = (req as any).body?.githubAccessToken;
  if (bodyToken) {
    return createOctokit(bodyToken);
  }
  const accessToken = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN || "";
  if (!accessToken) {
    throw new Error("Missing GitHub access token. Set GITHUB_ACCESS_TOKEN or GITHUB_TOKEN.");
  }
  return createOctokit(accessToken);
}