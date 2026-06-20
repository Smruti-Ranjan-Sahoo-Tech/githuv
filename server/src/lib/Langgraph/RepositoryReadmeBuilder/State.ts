import { Annotation } from "@langchain/langgraph";

export const RepositoryReadmeStateAnnotation = Annotation.Root({
  octokit: Annotation<any>,
  userId: Annotation<string>,
  repoOwner: Annotation<string>,
  repoName: Annotation<string>,
  userInput: Annotation<any>,
  existingReadme: Annotation<any>,
  existingReadmeContent: Annotation<string>,
  repoMeta: Annotation<any>,
  folderTree: Annotation<string>,
  configSummary: Annotation<any>,
  configRawContents: Annotation<Record<string, string>>,
  importantFeatures: Annotation<string[]>,
  importantCodeSummary: Annotation<any>,
  repoKnowledge: Annotation<any>,
  generatedReadme: Annotation<string>,
  validation: Annotation<any>,
  preview: Annotation<any>,
  githubAccessToken: Annotation<string>,
});

export type RepositoryReadmeState = typeof RepositoryReadmeStateAnnotation.State;
