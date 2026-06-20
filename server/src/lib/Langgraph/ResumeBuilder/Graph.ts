import { StateGraph, START, END } from "@langchain/langgraph";
import { ResumeStateAnnotation } from "./State";
import { fetchAndCleanData } from "./Node/fetchAndCleanData.node";
import { askOllamaForLatex } from "./Node/askOllamaForLatex.node";
import { compileAndUploadPdf } from "./Node/compileAndUploadPdf.node";

const graph = new StateGraph(ResumeStateAnnotation);

graph.addNode("fetchAndCleanData", fetchAndCleanData);
graph.addNode("askOllamaForLatex", askOllamaForLatex);
graph.addNode("compileAndUploadPdf", compileAndUploadPdf);

graph.addEdge(START as any, "fetchAndCleanData" as any);
graph.addEdge("fetchAndCleanData" as any, "askOllamaForLatex" as any);
graph.addEdge("askOllamaForLatex" as any, "compileAndUploadPdf" as any);
graph.addEdge("compileAndUploadPdf" as any, END);

export const resumeGraph = graph.compile();
export const buildResumeGraph = async () => graph.compile();
