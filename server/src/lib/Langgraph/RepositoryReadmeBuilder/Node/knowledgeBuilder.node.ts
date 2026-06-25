import { type RepositoryReadmeState } from "../State";

function detectTopLevelDirectories(folderTree: string): string[] {
  const dirs = new Set<string>();
  for (const line of folderTree.split("\n")) {
    const path = line.replace(/^\s*-\s*/, "").trim();
    const top = path.split("/")[0];
    if (top && !top.includes(".")) dirs.add(top);
  }
  return Array.from(dirs).sort();
}

function buildDirectorySummary(
  configRawContents: Record<string, string>,
  configSummary: any,
): string {
  const dirs = new Set<string>();
  const dirConfigs: Record<string, string[]> = {};

  for (const filePath of Object.keys(configRawContents)) {
    const dir = filePath.includes("/") ? filePath.split("/").slice(0, -1).join("/") : ".";
    if (!dirConfigs[dir]) dirConfigs[dir] = [];
    dirConfigs[dir].push(filePath);
  }

  let result = "";
  for (const [dir, files] of Object.entries(dirConfigs)) {
    result += `  ${dir === "." ? "root" : dir}: ${files.join(", ")}\n`;
  }
  return result;
}

export async function knowledgeBuilder(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
  const topLevelDirs = detectTopLevelDirectories(state.folderTree);
  const dirConfigSummary = buildDirectorySummary(
    state.configRawContents || {},
    state.configSummary,
  );

  const repoKnowledge = {
    projectPurpose: state.userInput?.projectPurpose || "",
    targetUsers: state.userInput?.targetUsers || "",
    keyFeatures: state.userInput?.keyFeatures || [],
    repoMeta: state.repoMeta,
    existingReadme: state.existingReadme,
    folderTree: state.folderTree,
    topLevelDirectories: topLevelDirs,
    configSummary: state.configSummary,
    configRawContents: state.configRawContents,
    configFilesByDirectory: dirConfigSummary,
    importantFeatures: state.importantFeatures,
    importantCodeSummary: state.importantCodeSummary,
    detectedApiRoutes: state.importantCodeSummary?.detectedApiRoutes || [],
    detectedPageRoutes: state.importantCodeSummary?.detectedPageRoutes || [],
    instructions: [
      "Use only the facts in this object.",
      "Do not invent features or dependencies.",
      "Prefer clarity over marketing fluff.",
    ],
  };

  return { repoKnowledge };
}
