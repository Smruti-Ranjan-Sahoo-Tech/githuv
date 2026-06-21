import { createOctokit, getAuthenticatedOctokit } from "../../config/Octokit/octokit";
import type { Request, Response } from "express";
import moment from "moment";
import { UserProfile } from "../../models/userProfile.model";
import {
  textToGrid,
  randomPattern,
  applyCustomPattern,
  mergePatterns,
  type Intensity,
} from "../../util/contributionGrid";

const REPO_NAME = "githuv-official-app-for-contribution";
const FILE_PATH = "data.json";
const GITHUB_API_VERSION = "2022-11-28";

async function ensureRepoExists(
  octokit: ReturnType<typeof createOctokit>,
  owner: string
): Promise<void> {
  try {
    await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo: REPO_NAME,
      headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION },
    });
  } catch (error: any) {
    if (error.status !== 404) throw error;
    await octokit.request("POST /user/repos", {
      name: REPO_NAME,
      private: true,
      auto_init: true,
      headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION },
    });
  }
}

async function createCommit(
  octokit: ReturnType<typeof createOctokit>,
  owner: string,
  email: string,
  dateStr: string,
  index: number,
  existingSha?: string
): Promise<string> {
  const date = moment.utc(dateStr).format("YYYY-MM-DDTHH:mm:ss") + "Z";
  const data = { date: dateStr, index };

  if (!existingSha) {
    try {
      const existing = await octokit.rest.repos.getContent(
        {
          owner,
          repo: REPO_NAME,
          path: FILE_PATH,
          headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION },
        }
      );
      existingSha = (existing.data as { sha?: string }).sha;
    } catch {
      // File doesn't exist yet, that's fine
    }
  }

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

  const response = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo: REPO_NAME,
    path: FILE_PATH,
    message: date,
    content,
    sha: existingSha,
    author: {
      name: owner,
      email,
      date,
    },
    committer: {
      name: owner,
      email,
      date,
    },
    headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION },
  });

  return (response.data as any).content.sha;
}

async function createRecoveryCommit(
  octokit: ReturnType<typeof createOctokit>,
  owner: string,
  repo: string,
  branch: string,
  previousCommitSha: string,
  previousTreeSha: string,
  email: string,
  dateStr: string,
  index: number
): Promise<{ commitSha: string; treeSha: string }> {
  const commitDate = `${dateStr}T12:00:00+05:30`;
  const content = JSON.stringify({ date: dateStr, index }, null, 2);

  const { data: blob } = await octokit.request(
    "POST /repos/{owner}/{repo}/git/blobs",
    {
      owner,
      repo,
      content,
      encoding: "utf-8",
      headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION },
    }
  );

  const { data: tree } = await octokit.request(
    "POST /repos/{owner}/{repo}/git/trees",
    {
      owner,
      repo,
      base_tree: previousTreeSha,
      tree: [
        {
          path: FILE_PATH,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        },
      ],
      headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION },
    }
  );

  const { data: commit } = await octokit.request(
    "POST /repos/{owner}/{repo}/git/commits",
    {
      owner,
      repo,
      message: commitDate,
      tree: tree.sha,
      parents: [previousCommitSha],
      author: {
        name: owner,
        email,
        date: commitDate,
      },
      committer: {
        name: owner,
        email,
        date: commitDate,
      },
      headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION },
    }
  );

  await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/{ref}", {
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commit.sha,
    force: true,
    headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION },
  });

  return { commitSha: commit.sha, treeSha: tree.sha };
}

export default class ContributionController {
  static async printContribution(req: Request, res: Response) {
    try {
      const {
        startDate,
        endDate,
        printName,
        randomContribution,
        darkerOrLightest,
        pattern,
        density: densityParam,
        forceDailyRecovery,
        forceSingleDayRecovery,
      } = req.body as {
        startDate?: string;
        endDate?: string;
        printName?: string;
        randomContribution?: boolean | number;
        darkerOrLightest?: "darker" | "lightest" | number;
        pattern?: string;
        density?: number;
        forceDailyRecovery?: boolean;
        forceSingleDayRecovery?: boolean;
      };

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required (format: DD-MM-YY)",
        });
      }

      const start = moment(startDate, "DD-MM-YY");
      const end = moment(endDate, "DD-MM-YY");

      if (!start.isValid() || !end.isValid()) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use DD-MM-YY (e.g., 01-01-24)",
        });
      }

      if (end.isBefore(start)) {
        return res.status(400).json({
          success: false,
          message: "endDate must be after startDate",
        });
      }

      const startDateValue = startDate;
      const endDateValue = endDate;

      const intensity: Intensity =
        darkerOrLightest === "darker"
          ? 4
          : darkerOrLightest === "lightest"
            ? 1
            : typeof darkerOrLightest === "number" && darkerOrLightest >= 1 && darkerOrLightest <= 4
              ? (darkerOrLightest as Intensity)
              : 2;

      const patterns: Map<string, number>[] = [];

      if (forceSingleDayRecovery) {
        patterns.push(new Map([[start.format("YYYY-MM-DD"), 1]]));
      } else if (forceDailyRecovery) {
        const dailyPattern = new Map<string, number>();
        let cursor = moment(start).startOf("day");
        const lastDay = moment(end).startOf("day");

        while (cursor.isSameOrBefore(lastDay, "day")) {
          dailyPattern.set(cursor.format("YYYY-MM-DD"), 1);
          cursor = cursor.add(1, "day");
        }

        patterns.push(dailyPattern);
      } else {
        if (printName) {
          patterns.push(
            textToGrid(printName, start.toDate(), end.toDate(), intensity)
          );
        }

        if (pattern) {
          patterns.push(
            applyCustomPattern(pattern, start.toDate(), end.toDate(), intensity)
          );
        }

        if (randomContribution || (!printName && !pattern)) {
          const density =
            typeof densityParam === "number" ? densityParam :
            typeof randomContribution === "number" ? randomContribution : 0.3;
          patterns.push(
            randomPattern(start.toDate(), end.toDate(), intensity, density)
          );
        }
      }

      const schedule = mergePatterns(...patterns);

      if (schedule.size === 0) {
        return res.status(400).json({
          success: false,
          message: "No commits to create. Check your date range and options.",
        });
      }

      const octokit = await getAuthenticatedOctokit(req);
      const { data: githubUser } = await octokit.request("GET /user");
      const owner = githubUser.login;
      const { data: emails } = await octokit.request("GET /user/emails");
      const primaryEmail =
        emails.find((e: any) => e.primary && e.verified)?.email || emails[0]?.email || "";

      if (!primaryEmail) {
        return res.status(400).json({
          success: false,
          message: "Unable to determine a verified GitHub email for commits",
        });
      }

      const sortedDates = [...schedule.keys()].sort();
      let longestStreak = 0;
      let currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = moment(sortedDates[i - 1], "YYYY-MM-DD");
        const curr = moment(sortedDates[i], "YYYY-MM-DD");
        const diff = curr.diff(prev, "days");
        if (diff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, currentStreak);

      await ensureRepoExists(octokit, owner);

      const { data: repoInfo } = await octokit.request("GET /repos/{owner}/{repo}", {
        owner,
        repo: REPO_NAME,
        headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION },
      });

      const branchName = repoInfo.default_branch || "main";
      const { data: ref } = await octokit.request(
        "GET /repos/{owner}/{repo}/git/ref/{ref}",
        {
          owner,
          repo: REPO_NAME,
          ref: `heads/${branchName}`,
          headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION },
        }
      );

      const { data: tipCommit } = await octokit.request(
        "GET /repos/{owner}/{repo}/git/commits/{commit_sha}",
        {
          owner,
          repo: REPO_NAME,
          commit_sha: ref.object.sha,
          headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION },
        }
      );

      let totalCommits = 0;
      let previousCommitSha = ref.object.sha;
      let previousTreeSha = tipCommit.tree.sha;

      for (const [dateStr] of schedule) {
        const result = await createRecoveryCommit(
          octokit,
          owner,
          REPO_NAME,
          branchName,
          previousCommitSha,
          previousTreeSha,
          primaryEmail,
          dateStr,
          0
        );
        previousCommitSha = result.commitSha;
        previousTreeSha = result.treeSha;
        totalCommits++;
      }

      if (req.user?.firebaseUID) {
        await UserProfile.findOneAndUpdate(
          { firebaseUID: req.user.firebaseUID },
          {
            $set: {
              strikeRecovery: {
                startDate: moment(startDateValue, "DD-MM-YY").format("YYYY-MM-DD"),
                endDate: moment(endDateValue, "DD-MM-YY").format("YYYY-MM-DD"),
                totalCommits,
                uniqueDays: schedule.size,
                longestStreak,
                repository: REPO_NAME,
                owner,
                recoveredAt: new Date().toISOString(),
              },
            },
          },
          { upsert: true, new: true }
        );
      }

      return res.json({
        success: true,
        owner,
        repository: REPO_NAME,
        totalCommits,
        uniqueDays: schedule.size,
        longestStreak,
        dateRange: {
          start: start.format("DD-MM-YY"),
          end: (forceSingleDayRecovery ? start : end).format("DD-MM-YY"),
        },
        message: "Strike recovery complete",
      });
    } catch (error: any) {
      console.error("Contribution Error:", {
        status: error.status,
        message: error.message,
        response: error.response?.data,
      });

      return res.status(error.status || 500).json({
        success: false,
        status: error.status,
        message: error instanceof Error ? error.message : "Failed to create contribution pattern",
        githubError: error.response?.data,
      });
    }
  }
}
