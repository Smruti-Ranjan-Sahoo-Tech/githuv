import { createOctokit, getAuthenticatedOctokit } from "../../config/Octokit/octokit";
import type { Request, Response } from "express";
import { repositoryReadmeGraph } from "../../lib/Langgraph/RepositoryReadmeBuilder/Graph";
import { profileReadmeGraph } from "../../lib/Langgraph/ProfileReadmeBuilder/Graph";
import { User } from "../../models/user.model";

const REPO_NAME = "githuv-official-app-for-contribution";
const README_PATH = "README.md";
const GITHUB_API_VERSION = "2022-11-28";

function encodeContent(content: string) {
  return Buffer.from(content, "utf8").toString("base64");
}

function decodeContent(content: string) {
  return Buffer.from(content, "base64").toString("utf8");
}

async function getReadmeFile(
  octokit: ReturnType<typeof createOctokit>,
  owner: string,
  repo: string
) {
  const response = await octokit.rest.repos
    .getContent({
      owner,
      repo,
      path: README_PATH,
      headers: {
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
      },
    })
    .catch((error: any) => {
      if (error.status === 404) {
        return null;
      }

      throw error;
    });

  return response as
    | null
    | {
        data: {
          sha: string;
          content: string;
        };
      };
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
  const existingFile = await getReadmeFile(octokit, owner, REPO_NAME);

  await octokit.rest.repos.createOrUpdateFileContents({
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
      const octokit = await getAuthenticatedOctokit(req);
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
      const repos = await octokit.paginate("GET /user/repos", {
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
        repositories: repos.map((repo: any) => ({
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          updated_at: repo.updated_at,
          private: repo.private,
          html_url: repo.html_url,
        })),
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
      const octokit = await getAuthenticatedOctokit(req);
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

  static async generateRepositoryReadme(req: Request, res: Response) {
    try {
      const octokit = await getAuthenticatedOctokit(req);
      const { data: githubUser } = await octokit.request("GET /user");
      const body = req.body as any;
      const repoOwner = body.repoOwner || githubUser.login;
      const repoName = body.repoName;

      if (!repoName) {
        return res.status(400).json({
          success: false,
          message: "repoName is required",
        });
      }

      const user = await User.findOne({ firebaseUID: (req as any).user?.firebaseUID }).select("+githubAccessToken");

      const result = await repositoryReadmeGraph.invoke({
        octokit,
        userId: githubUser.login,
        repoOwner,
        repoName,
        githubAccessToken: user?.githubAccessToken || "",
        userInput: {
          projectPurpose: body.userInput?.projectPurpose || body.projectPurpose || "",
          keyFeatures: body.userInput?.keyFeatures || body.keyFeatures || [],
          targetUsers: body.userInput?.targetUsers || body.targetUsers || "",
        },
      } as any);

      return res.json({
        success: true,
        repoOwner,
        repoName,
        existingReadme: result.existingReadme,
        repoMeta: result.repoMeta,
        folderTree: result.folderTree,
        configSummary: result.configSummary,
        importantFeatures: result.importantFeatures,
        importantCodeSummary: result.importantCodeSummary,
        repoKnowledge: result.repoKnowledge,
        generatedReadme: result.generatedReadme,
        validation: result.validation,
        preview: result.preview,
      });
    } catch (error: any) {
      console.error("Repository README Generation Error:", {
        status: error.status,
        message: error.message,
      });

      return res.status(error.status || 500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate repository README",
      });
    }
  }

  static async publishRepositoryReadme(req: Request, res: Response) {
    try {
      const octokit = await getAuthenticatedOctokit(req);
      const { data: githubUser } = await octokit.request("GET /user");
      const body = req.body as any;
      const repoOwner = body.repoOwner || githubUser.login;
      const repoName = body.repoName;
      const generatedReadme = body.generatedReadme;

      if (!repoName || !generatedReadme) {
        return res.status(400).json({
          success: false,
          message: "repoName and generatedReadme are required",
        });
      }

      const existingFile = await getReadmeFile(octokit, repoOwner, repoName);
      const rollbackSnapshot = existingFile
        ? {
            existed: true,
            sha: existingFile.data.sha,
            content: decodeContent(existingFile.data.content || ""),
          }
        : {
            existed: false,
            sha: "",
            content: "",
          };

      const { data: response } = await octokit.rest.repos.createOrUpdateFileContents(
        {
          owner: repoOwner,
          repo: repoName,
          path: README_PATH,
          message: "docs: publish AI-generated README",
          content: encodeContent(generatedReadme),
          sha: existingFile?.data?.sha,
          headers: {
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
          },
        }
      );

      return res.json({
        success: true,
        repoOwner,
        repoName,
        rollbackSnapshot,
        publishedSha: response?.content?.sha || null,
        message: "README published successfully",
      });
    } catch (error: any) {
      console.error("Repository README Publish Error:", {
        status: error.status,
        message: error.message,
      });

      return res.status(error.status || 500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to publish repository README",
      });
    }
  }

  static async undoRepositoryReadme(req: Request, res: Response) {
    try {
      const octokit = await getAuthenticatedOctokit(req);
      const { data: githubUser } = await octokit.request("GET /user");
      const body = req.body as any;
      const repoOwner = body.repoOwner || githubUser.login;
      const repoName = body.repoName;
      const rollbackSnapshot = body.rollbackSnapshot;

      if (!repoName || !rollbackSnapshot) {
        return res.status(400).json({
          success: false,
          message: "repoName and rollbackSnapshot are required",
        });
      }

      const currentFile = await getReadmeFile(octokit, repoOwner, repoName);

      if (!currentFile) {
        if (!rollbackSnapshot.existed) {
          return res.json({
            success: true,
            message: "Nothing to undo. README does not exist.",
          });
        }

        await octokit.rest.repos.createOrUpdateFileContents({
          owner: repoOwner,
          repo: repoName,
          path: README_PATH,
          message: "docs: restore previous README",
          content: encodeContent(rollbackSnapshot.content || ""),
          headers: {
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
          },
        });
      } else if (rollbackSnapshot.existed) {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: repoOwner,
          repo: repoName,
          path: README_PATH,
          message: "docs: undo AI-generated README",
          content: encodeContent(rollbackSnapshot.content || ""),
          sha: currentFile.data.sha,
          headers: {
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
          },
        });
      } else {
        await octokit.rest.repos.deleteFile({
          owner: repoOwner,
          repo: repoName,
          path: README_PATH,
          message: "docs: remove AI-generated README",
          sha: currentFile.data.sha,
          headers: {
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
          },
        });
      }

      return res.json({
        success: true,
        message: "README changes reverted successfully",
      });
    } catch (error: any) {
      console.error("Repository README Undo Error:", {
        status: error.status,
        message: error.message,
      });

      return res.status(error.status || 500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to undo repository README",
      });
    }
  }

  static async getExistingProfileReadme(req: Request, res: Response) {
    try {
      const octokit = await getAuthenticatedOctokit(req);
      const { data: githubUser } = await octokit.request("GET /user");

      const existingFile = await getReadmeFile(octokit, githubUser.login, githubUser.login);

      const existingProfileReadme = existingFile
        ? decodeContent(existingFile.data.content || "")
        : "";

      return res.json({
        success: true,
        existingProfileReadme,
      });
    } catch (error: any) {
      console.error("Get Existing Profile README Error:", {
        status: error.status,
        message: error.message,
      });

      return res.status(error.status || 500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch existing profile README",
      });
    }
  }

  static async generateProfileReadme(req: Request, res: Response) {
    try {
      const octokit = await getAuthenticatedOctokit(req);
      const { data: githubUser } = await octokit.request("GET /user");
      const body = req.body as any;
      const themeNo = body.themeNo || 1;
      const userFeedback = body.userFeedback || "";

      const user = await User.findOne({
        firebaseUID: (req as any).user?.firebaseUID,
      }).select("+githubAccessToken");

      if (!user?.githubAccessToken) {
        return res.status(400).json({
          success: false,
          message: "GitHub access token not found",
        });
      }

      const result = await profileReadmeGraph.invoke({
        userId: (req as any).user?.firebaseUID || "",
        githubUsername: githubUser.login,
        githubAccessToken: user.githubAccessToken,
        themeNo,
        userFeedback,
      } as any);

      return res.json({
        success: true,
        data: result.userData,
        existingProfileReadme: result.existingProfileReadme,
        generatedProfileReadme: result.generatedProfileReadme,
        preview: result.preview,
      });
    } catch (error: any) {
      console.error("Profile README Generation Error:", {
        status: error.status,
        message: error.message,
      });

      return res.status(error.status || 500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate profile README",
      });
    }
  }

  static async publishProfileReadme(req: Request, res: Response) {
    try {
      const octokit = await getAuthenticatedOctokit(req);
      const { data: githubUser } = await octokit.request("GET /user");
      const body = req.body as any;
      const generatedReadme = body.generatedReadme;

      if (!generatedReadme) {
        return res.status(400).json({
          success: false,
          message: "generatedReadme is required",
        });
      }

      const profileRepoName = githubUser.login;

      let repoExists = true;
      try {
        await octokit.request("GET /repos/{owner}/{repo}", {
          owner: githubUser.login,
          repo: profileRepoName,
        });
      } catch (error: any) {
        if (error.status === 404) {
          repoExists = false;
        } else {
          throw error;
        }
      }

      if (!repoExists) {
        await octokit.request("POST /user/repos", {
          name: profileRepoName,
          description: "Profile README — special repository for my GitHub profile",
          private: false,
          auto_init: false,
          headers: {
            "X-GitHub-Api-Version": GITHUB_API_VERSION,
          },
        });
      }

      let existingSha: string | undefined;

      try {
        const existing = await octokit.rest.repos.getContent({
          owner: githubUser.login,
          repo: profileRepoName,
          path: README_PATH,
        });

        if (!Array.isArray(existing.data)) {
          existingSha = (existing.data as any).sha;
        }
      } catch {
        // README doesn't exist yet
      }

      const { data: response } = await octokit.rest.repos.createOrUpdateFileContents({
        owner: githubUser.login,
        repo: profileRepoName,
        path: README_PATH,
        message: existingSha
          ? "docs: update profile README via Githuv"
          : "Initial commit: add profile README via Githuv",
        content: Buffer.from(generatedReadme, "utf8").toString("base64"),
        sha: existingSha,
        headers: {
          "X-GitHub-Api-Version": GITHUB_API_VERSION,
        },
      });

      return res.json({
        success: true,
        repoName: profileRepoName,
        repoUrl: `https://github.com/${githubUser.login}/${profileRepoName}`,
        profileUrl: `https://github.com/${githubUser.login}`,
        publishedSha: (response as any)?.content?.sha || null,
        repoCreated: !repoExists,
        message: repoExists
          ? "Profile README published successfully"
          : "Profile repository created and README published",
      });
    } catch (error: any) {
      console.error("Profile README Publish Error:", {
        status: error.status,
        message: error.message,
      });

      return res.status(error.status || 500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to publish profile README",
      });
    }
  }
}
