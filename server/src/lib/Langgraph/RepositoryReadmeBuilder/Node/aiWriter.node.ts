import { type RepositoryReadmeState } from "../State";
import { askGithub } from "../../../llm/github.llm";

export async function aiWriter(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
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
${JSON.stringify(state.repoKnowledge, null, 2)}

Generate the README now.
`;

  const generatedReadme = await askGithub(
    prompt,
    state.githubAccessToken
  );

  return { generatedReadme };
}
