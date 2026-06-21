import { type RepositoryReadmeState } from "../State";
import { askGithub } from "../../../llm/github.llm";

const MAX_PROMPT_LENGTH = 60000;

function truncateRepoKnowledge(knowledge: Record<string, any>): Record<string, any> {
  const truncated = { ...knowledge };

  if (truncated.configRawContents && typeof truncated.configRawContents === "object") {
    const entries = Object.entries(truncated.configRawContents as Record<string, string>);
    const sorted = entries.sort(([a], [b]) => {
      const priority = (file: string) => (file === "package.json" || file === "README.md" ? 0 : 1);
      return priority(a) - priority(b);
    });
    const kept: Record<string, string> = {};
    let size = 0;
    for (const [key, val] of sorted) {
      const entrySize = key.length + val.length;
      if (size + entrySize > 8000 && size > 0) break;
      kept[key] = val;
      size += entrySize;
    }
    truncated.configRawContents = kept;
  }

  if (truncated.importantCodeSummary?.summaries && Array.isArray(truncated.importantCodeSummary.summaries)) {
    truncated.importantCodeSummary.summaries =
      truncated.importantCodeSummary.summaries.slice(0, 4);
  }

  if (truncated.folderTree && typeof truncated.folderTree === "string") {
    const lines = truncated.folderTree.split("\n");
    if (lines.length > 80) {
      truncated.folderTree = lines.slice(0, 80).join("\n") + "\n...";
    }
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

  const prompt = `
You are a senior technical writer generating a README.md for a GitHub repository.

Use ONLY the structured repository knowledge below.
Do NOT invent features, APIs, libraries, or integrations.
If something is missing, omit it instead of guessing.
Return ONLY valid markdown content.

Required sections:
- Title
- Overview
- Features
- Tech Stack
- Installation
- Usage
- Architecture
- Contributing
- License

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
