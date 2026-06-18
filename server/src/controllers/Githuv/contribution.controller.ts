import { createOctokit, getAuthenticatedOctokit } from "../../config/Octokit/octokit";
import type { Request, Response } from "express";
import moment from "moment";
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

async function createCommit(
  octokit: ReturnType<typeof createOctokit>,
  owner: string,
  dateStr: string,
  index: number
): Promise<void> {
  const date = moment(dateStr).format();

  const data = { date: dateStr, index };

  let existingSha: string | undefined;

  try {
    const existing = await octokit.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
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

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");

  await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo: REPO_NAME,
    path: FILE_PATH,
    message: date,
    content,
    sha: existingSha,
    committer: {
      name: owner,
      email: `${owner}@users.noreply.github.com`,
      date,
    },
    headers: { "X-GitHub-Api-Version": GITHUB_API_VERSION },
  });
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
      } = req.body as {
        startDate?: string;
        endDate?: string;
        printName?: string;
        randomContribution?: boolean | number;
        darkerOrLightest?: "darker" | "lightest" | number;
        pattern?: string;
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

      const intensity: Intensity =
        darkerOrLightest === "darker"
          ? 4
          : darkerOrLightest === "lightest"
            ? 1
            : typeof darkerOrLightest === "number" && darkerOrLightest >= 1 && darkerOrLightest <= 4
              ? (darkerOrLightest as Intensity)
              : 2;

      const patterns: Map<string, number>[] = [];

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
          typeof randomContribution === "number" ? randomContribution : 0.3;
        patterns.push(
          randomPattern(start.toDate(), end.toDate(), intensity, density)
        );
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

      let totalCommits = 0;

      for (const [dateStr, count] of schedule) {
        for (let i = 0; i < count; i++) {
          await createCommit(octokit, owner, dateStr, i);
          totalCommits++;
        }
      }

      return res.json({
        success: true,
        owner,
        repository: REPO_NAME,
        totalCommits,
        uniqueDays: schedule.size,
        dateRange: {
          start: start.format("DD-MM-YY"),
          end: end.format("DD-MM-YY"),
        },
        options: {
          printName: printName || null,
          randomContribution: !!randomContribution,
          darkerOrLightest: intensity === 4 ? "darker" : intensity === 1 ? "lightest" : `level-${intensity}`,
          pattern: !!pattern,
        },
        message: "Contribution pattern created successfully",
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
