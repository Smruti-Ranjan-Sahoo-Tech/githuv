import { type ProfileReadmeState } from "../State";

export async function previewNode(
  state: typeof ProfileReadmeState.State
): Promise<Partial<typeof ProfileReadmeState.State>> {
  return {
    preview: {
      oldReadme: state.existingProfileReadme,
      newReadme: state.generatedProfileReadme,
      themeUsed: state.themeNo,
    },
  };
}
