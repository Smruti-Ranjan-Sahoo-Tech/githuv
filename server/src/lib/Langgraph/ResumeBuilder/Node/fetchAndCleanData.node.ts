import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { type ResumeState } from "../State";
import { cleanProfile } from "../../../cleanProfile";
import { UserProfile } from "../../../../models/userProfile.model";

const __dirname = join(process.cwd(), "src", "lib", "Langgraph", "ResumeBuilder");
const THEME_DIR = join(__dirname, "Theme");

export async function fetchAndCleanData(state: ResumeState): Promise<Partial<ResumeState>> {
  const themeNo = state.themeNo || "Theme1";
  const themeFileName = existsSync(join(THEME_DIR, `${themeNo}.tex`))
    ? `${themeNo}.tex`
    : "Theme1.tex";
  const themePath = join(THEME_DIR, themeFileName);
  const themeTex = await readFile(themePath, "utf-8");

  const data = await UserProfile.findOne({ firebaseUID: state.userId });
  if (!data) {
    throw new Error("No rawData provided. Ensure user profile is loaded before starting resume generation.");
  }

  const cleanedData = cleanProfile(data);

  return { cleanedData, themeTex, themeNo, userObjectId: data.user };
}
