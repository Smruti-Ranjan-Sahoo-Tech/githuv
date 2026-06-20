import { type RepositoryReadmeState } from "../State";

export async function collectUserInput(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
  const userInput = {
    projectPurpose: state.userInput?.projectPurpose?.trim() || "",
    keyFeatures: Array.isArray(state.userInput?.keyFeatures)
      ? state.userInput.keyFeatures.filter(Boolean)
      : [],
    targetUsers: state.userInput?.targetUsers?.trim() || "",
  };

  if (!userInput.projectPurpose) {
    throw new Error("Project purpose is required.");
  }

  return { userInput };
}
