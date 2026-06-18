import { createOctokit, getAuthenticatedOctokit } from "../../config/Octokit/octokit";
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

  static async getDashboardData(req: Request, res: Response) {
    try {
      const octokit = await getAuthenticatedOctokit(req);

      const { data: user } = await octokit.request("GET /user");
      const { data: repos } = await octokit.request("GET /user/repos", {
        per_page: 100,
        sort: "updated",
        direction: "desc",
      });

      const { data: events } = await octokit.request(
        "GET /users/{username}/events",
        {
          username: user.login,
          per_page: 15,
        }
      );

      const totalStars = repos.reduce(
        (sum: number, repo: any) => sum + (repo.stargazers_count || 0),
        0
      );
      const totalForks = repos.reduce(
        (sum: number, repo: any) => sum + (repo.forks_count || 0),
        0
      );

      const languageMap: Record<string, number> = {};
      repos.forEach((repo: any) => {
        if (repo.language) {
          languageMap[repo.language] =
            (languageMap[repo.language] || 0) + 1;
        }
      });

      const topLanguages = Object.entries(languageMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([language, count]) => ({ language, count }));

      const recentRepos = repos.slice(0, 10).map((repo: any) => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        updated_at: repo.updated_at,
        private: repo.private,
        html_url: repo.html_url,
      }));

      return res.json({
        success: true,
        profile: {
          login: user.login,
          name: user.name,
          avatar_url: user.avatar_url,
          bio: user.bio,
          location: user.location,
          company: user.company,
          blog: user.blog,
          email: user.email,
          twitter_username: user.twitter_username,
          followers: user.followers,
          following: user.following,
          public_repos: user.public_repos,
          public_gists: user.public_gists,
          created_at: user.created_at,
        },
        stats: {
          totalRepos: repos.length,
          totalStars,
          totalForks,
          topLanguages,
          totalWatchers: repos.reduce(
            (sum: number, r: any) => sum + (r.watchers_count || 0),
            0
          ),
        },
        recentRepos,
        recentActivity: events.map((event: any) => ({
          id: event.id,
          type: event.type,
          repo: event.repo.name,
          created_at: event.created_at,
          payload: event.payload,
        })),
      });
    } catch (error: any) {
      console.error("Dashboard Data Error:", {
        status: error.status,
        message: error.message,
      });

      return res.status(error.status || 500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch dashboard data",
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
