import { Annotation } from "@langchain/langgraph";

export const ResumeStateAnnotation = Annotation.Root({
  userId: Annotation<string>,
  threadId: Annotation<string>,
  rawData: Annotation<any>,
  cleanedData: Annotation<any>,
  themeNo: Annotation<string>,
  pageCount: Annotation<number>,
  themeTex: Annotation<string>,
  latexCode: Annotation<string>,
  pdfUrl: Annotation<string>,
  cloudinaryPublicId: Annotation<string>,
  userObjectId: Annotation<any>,
  githubAccessToken: Annotation<string>,
});

export type ResumeState = typeof ResumeStateAnnotation.State;
