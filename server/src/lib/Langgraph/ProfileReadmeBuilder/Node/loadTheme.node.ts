import { type ProfileReadmeState } from "../State";
import { THEME_FILES } from "../constants";

export async function loadTheme(
  state: typeof ProfileReadmeState.State
): Promise<Partial<typeof ProfileReadmeState.State>> {
  const index = Math.max(0, Math.min(state.themeNo - 1, THEME_FILES.length - 1));
  const filePath = `${import.meta.dir}/../templates/${THEME_FILES[index]}`;

  const themeTemplate = await Bun.file(filePath).text();

  return { themeTemplate };
}
