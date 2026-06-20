import { type RepositoryReadmeState } from "../State";
import { detectFeatureFromPath } from "../utils";

export async function featureDetection(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
  const paths = state.folderTree
    .split("\n")
    .map((line) => line.replace(/^\s*-\s*/, "").trim())
    .filter(Boolean);

  const detected = Array.from(
    new Set(paths.map(detectFeatureFromPath).filter(Boolean))
  ) as string[];

  return { importantFeatures: detected };
}
