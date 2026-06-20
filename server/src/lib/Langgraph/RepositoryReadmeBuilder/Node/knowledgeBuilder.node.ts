import { type RepositoryReadmeState } from "../State";

export async function knowledgeBuilder(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
  const repoKnowledge = {
    projectPurpose: state.userInput?.projectPurpose || "",
    targetUsers: state.userInput?.targetUsers || "",
    keyFeatures: state.userInput?.keyFeatures || [],
    repoMeta: state.repoMeta,
    existingReadme: state.existingReadme,
    folderTree: state.folderTree,
    configSummary: state.configSummary,
    configRawContents: state.configRawContents,
    importantFeatures: state.importantFeatures,
    importantCodeSummary: state.importantCodeSummary,
    instructions: [
      "Use only the facts in this object.",
      "Do not invent features or dependencies.",
      "Prefer clarity over marketing fluff.",
    ],
  };

  return { repoKnowledge };
}
