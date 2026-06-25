import { type RepositoryReadmeState } from "../State";
import { decodeBase64Content, summarizeSourceFile } from "../utils";

function extractRoutePaths(folderTree: string): { apiRoutes: string[]; pageRoutes: string[] } {
  const paths = folderTree
    .split("\n")
    .map((line) => line.replace(/^\s*-\s*/, "").trim())
    .filter(Boolean);

  const apiRoutes: string[] = [];
  const pageRoutes: string[] = [];

  for (const p of paths) {
    if (/route\.(ts|tsx|js|jsx)$/.test(p)) apiRoutes.push(p);
    if (/page\.(tsx|ts|jsx)$/.test(p)) pageRoutes.push(p);
  }

  return { apiRoutes, pageRoutes };
}

export async function importantCodeAnalyzer(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
  const octokit = state.octokit;
  if (!octokit) return {};

  const candidatePaths = state.folderTree
    .split("\n")
    .map((line) => line.replace(/^\s*-\s*/, "").trim())
    .filter((path) => {
      const lowered = path.toLowerCase();
      const isCodeFile = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|java|rs|php|rb|ex|exs|kt|kts|swift|scala|clj|dart|zig|cs|fs)$/.test(
        lowered
      );
      return (
        isCodeFile &&
        /(auth|service|api|route|controller|middleware|config|main|index|app|core|handler|module|component|store|util|helper|command|page|layout|sidebar|navbar|hook)/.test(
          lowered
        )
      );
    })
    .slice(0, 15);

  const summaries = [];

  for (const path of candidatePaths) {
    const file = await octokit.rest.repos
      .getContent({
        owner: state.repoOwner,
        repo: state.repoName,
        path,
      })
      .catch((error: any) => {
        if (error.status === 404) return null;
        throw error;
      });

    if (!file || Array.isArray(file.data)) continue;

    const content = decodeBase64Content((file.data as any).content || "");
    summaries.push(summarizeSourceFile(path, content));
  }

  const { apiRoutes, pageRoutes } = extractRoutePaths(state.folderTree);

  return {
    importantCodeSummary: {
      selectedFiles: candidatePaths,
      summaries,
      detectedApiRoutes: apiRoutes,
      detectedPageRoutes: pageRoutes,
    },
  };
}
