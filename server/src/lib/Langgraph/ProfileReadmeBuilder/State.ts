import { Annotation } from "@langchain/langgraph";

export const ProfileReadmeState = Annotation.Root({
  userId: Annotation<string>,
  githubUsername: Annotation<string>,
  githubAccessToken: Annotation<string>,

  userData: Annotation<Record<string, any>>,
  existingProfileReadme: Annotation<string>,

  themeNo: Annotation<number>,
  themeTemplate: Annotation<string>,

  userFeedback: Annotation<string>,

  generatedProfileReadme: Annotation<string>,

  preview: Annotation<{
    oldReadme: string;
    newReadme: string;
    themeUsed: number;
  }>,
});
