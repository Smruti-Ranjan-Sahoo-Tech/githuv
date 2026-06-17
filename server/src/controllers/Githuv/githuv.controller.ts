import { createOctokit } from "../../config/Octokit/octokit";
import type { Request, Response } from "express";

const REPO_NAME = "githuv-official-app-for-contribution";
const README_PATH = "README.md";
const GITHUB_API_VERSION = "2022-11-28";

function getGithubAccessToken() {
  const accessToken = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN || "";

  if (!accessToken) {
    throw new Error(
      "Missing GitHub access token. Set GITHUB_ACCESS_TOKEN or GITHUB_TOKEN."
    );
  }

  return accessToken;
}

function buildReadmeContent() {
  return Buffer.from(
    `# Githuv Official App For Contribution

Welcome to Githuv.

This repository was automatically created after your first login.
`
  ).toString("base64");
}

async function upsertReadme(
  octokit: ReturnType<typeof createOctokit>,
  owner: string
) {
  const existingFile = await octokit.request(
    "GET /repos/{owner}/{repo}/contents/{path}",
    {
      owner,
      repo: REPO_NAME,
      path: README_PATH,
      headers: {
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
    }
  ).catch((error: any) => {
    if (error.status === 404) {
      return null;
    }

    throw error;
  }) as
    | null
    | {
        data: {
          sha: string;
        };
      };

  await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo: REPO_NAME,
    path: README_PATH,
    message: existingFile
      ? "Update initial README"
      : "Initial commit from Githuv",
    content: buildReadmeContent(),
    sha: existingFile?.data?.sha,
    headers: {
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
    },
  });
}

export default class githuv {
  static async getGithuvUser(req: Request, res: Response) {
    try {
      const octokit = createOctokit(getGithubAccessToken());
      const { data } = await octokit.request("GET /user");

      return res.json(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch user";

      console.error("ERROR:", message);

      return res.status(500).json({
        message,
      });
    }
  }

  static async createInitialRepo(req: Request, res: Response) {
    try {
      const octokit = createOctokit(getGithubAccessToken());
      const { data: githubUser } = await octokit.request("GET /user");

      try {
        await octokit.request("POST /user/repos", {
          name: REPO_NAME,
          private: true,
          auto_init: false,
          headers: {
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
          },
        });
      } catch (error: any) {
        if (error.status !== 422) {
          throw error;
        }
      }

      await upsertReadme(octokit, githubUser.login);

      return res.status(201).json({
        success: true,
        owner: githubUser.login,
        repository: REPO_NAME,
        private: true,
        message: "Private repository is ready and the initial commit exists",
      });
    } catch (error: any) {
      console.error("GitHub Error:");
      console.error({
        status: error.status,
        message: error.message,
        response: error.response?.data,
      });

      return res.status(error.status || 500).json({
        success: false,
        status: error.status,
        message:
          error instanceof Error ? error.message : "Failed to create repository",
        githubError: error.response?.data,
      });
    }
  }
  
}
