import { type RepositoryReadmeState } from "../State";
import { README_PATH, REQUIRED_SECTIONS } from "../constants";
import { decodeBase64Content, extractMarkdownSummary } from "../utils";

export async function existingReadmeAnalyzer(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
  const octokit = state.octokit;
  if (!octokit) return {};

  const existingFile = await octokit
    .request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: state.repoOwner,
      repo: state.repoName,
      path: README_PATH,
    })
    .catch((error: any) => {
      if (error.status === 404) return null;
      throw error;
    });

  if (!existingFile || Array.isArray(existingFile.data)) {
    return {
      existingReadme: {
        exists: false,
        title: "",
        sections: [],
        strengths: [],
        missingSections: REQUIRED_SECTIONS,
        summary: "No README found.",
      },
      existingReadmeContent: "",
    };
  }

  const content = decodeBase64Content((existingFile.data as any).content || "");
  return {
    existingReadme: {
      exists: true,
      ...extractMarkdownSummary(content),
    },
    existingReadmeContent: content,
  };
}
