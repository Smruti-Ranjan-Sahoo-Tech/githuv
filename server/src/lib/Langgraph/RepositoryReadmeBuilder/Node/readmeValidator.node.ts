import { type RepositoryReadmeState } from "../State";
import { REQUIRED_SECTIONS } from "../constants";

export async function readmeValidator(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
  const markdown = state.generatedReadme || "";
  const presentSections = REQUIRED_SECTIONS.filter((section) =>
    new RegExp(`^#{1,3}\\s+.*${section}.*$`, "im").test(markdown)
  );
  const missingSections = REQUIRED_SECTIONS.filter(
    (section) => !presentSections.includes(section)
  );

  const score = Math.max(0, 100 - missingSections.length * 10);

  return {
    validation: {
      score,
      presentSections,
      missingSections,
      hasTitle: /^#\s+.+/m.test(markdown),
      hasOverview: /overview/i.test(markdown),
    },
  };
}
