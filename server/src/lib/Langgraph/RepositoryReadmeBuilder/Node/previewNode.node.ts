import { type RepositoryReadmeState } from "../State";
import { truncate } from "../utils";

export async function previewNode(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
  return {
    preview: {
      oldReadme: truncate(state.existingReadmeContent || "", 8000),
      newReadme: state.generatedReadme || "",
      repo: `${state.repoOwner}/${state.repoName}`,
    },
  };
}
