import { type RepositoryReadmeState } from "../State";
import { askGithub } from "../../../llm/github.llm";

const MAX_PROMPT_LENGTH = 60000;

function truncateRepoKnowledge(knowledge: Record<string, any>): Record<string, any> {
  const truncated = { ...knowledge };

  if (truncated.configRawContents && typeof truncated.configRawContents === "object") {
    const entries = Object.entries(truncated.configRawContents as Record<string, string>);
    const sorted = entries.sort(([a], [b]) => {
      const priority = (file: string) => (file.endsWith("package.json") || file === "README.md" ? 0 : 1);
      return priority(a) - priority(b);
    });
    const kept: Record<string, string> = {};
    let size = 0;
    for (const [key, val] of sorted) {
      const entrySize = key.length + val.length;
      if (size + entrySize > 12000 && size > 0) break;
      kept[key] = val;
      size += entrySize;
    }
    truncated.configRawContents = kept;
  }

  if (truncated.importantCodeSummary?.summaries && Array.isArray(truncated.importantCodeSummary.summaries)) {
    truncated.importantCodeSummary.summaries =
      truncated.importantCodeSummary.summaries.slice(0, 8);
  }

  if (truncated.folderTree && typeof truncated.folderTree === "string") {
    const lines = truncated.folderTree.split("\n");
    if (lines.length > 120) {
      truncated.folderTree = lines.slice(0, 120).join("\n") + "\n...";
    }
  }

  if (truncated.configFilesByDirectory && typeof truncated.configFilesByDirectory === "string") {
    truncated.configFilesByDirectory = truncated.configFilesByDirectory.slice(0, 2000);
  }

  return truncated;
}

export async function aiWriter(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
  const truncatedKnowledge = truncateRepoKnowledge(state.repoKnowledge);
  let repoKnowledgeJson = JSON.stringify(truncatedKnowledge, null, 2);

  if (repoKnowledgeJson.length > MAX_PROMPT_LENGTH) {
    repoKnowledgeJson = repoKnowledgeJson.slice(0, MAX_PROMPT_LENGTH) + "\n...";
  }

  const hasRoutes = (truncatedKnowledge.detectedApiRoutes?.length || 0) > 0;
  const hasPages = (truncatedKnowledge.detectedPageRoutes?.length || 0) > 0;
  const hasMultipleDirs = (truncatedKnowledge.topLevelDirectories?.length || 0) > 1;

  const routeInstruction = hasRoutes
    ? "- List discovered API endpoints under an **API Reference** or **Routes** section\n"
    : "";
  const pageInstruction = hasPages
    ? "- List discovered frontend pages under a **Pages** or **Routes** section\n"
    : "";
  const dirInstruction = hasMultipleDirs
    ? "- Describe how the top-level directories (e.g. client/, server/) connect to each other\n"
    : "";

  const prompt = `
You are a senior technical writer generating a README.md for a GitHub repository.

Use ONLY the structured repository knowledge below.
Do NOT invent features, APIs, libraries, or integrations.
If something is missing, omit it instead of guessing.
Return ONLY valid markdown content.

Required sections:
- Title (use the repository name from repoMeta)
- Overview
- Features
- Tech Stack (group by directory if multiple packages exist)
- Installation
- Usage
- Architecture (describe how directories/packages connect)
- Contributing
- License

${dirInstruction}${routeInstruction}${pageInstruction}
Repository Knowledge:
${repoKnowledgeJson}

Generate the README now.
`;

  const generatedReadme = await askGithub(
    prompt,
    state.githubAccessToken
  );

  return { generatedReadme };
}
