import { Octokit } from "octokit";

export const createOctokit = (accessToken: string) => {
  return new Octokit({
    auth: accessToken,
  });
};