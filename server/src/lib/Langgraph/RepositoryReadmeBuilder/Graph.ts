import { StateGraph, START, END } from "@langchain/langgraph";
import { RepositoryReadmeStateAnnotation } from "./State";
import { collectUserInput } from "./Node/collectUserInput.node";
import { existingReadmeAnalyzer } from "./Node/existingReadmeAnalyzer.node";
import { repositoryMetadataAnalyzer } from "./Node/repositoryMetadataAnalyzer.node";
import { folderTreeAnalyzer } from "./Node/folderTreeAnalyzer.node";
import { configIntelligence } from "./Node/configIntelligence.node";
import { featureDetection } from "./Node/featureDetection.node";
import { importantCodeAnalyzer } from "./Node/importantCodeAnalyzer.node";
import { knowledgeBuilder } from "./Node/knowledgeBuilder.node";
import { aiWriter } from "./Node/aiWriter.node";
import { readmeValidator } from "./Node/readmeValidator.node";
import { previewNode } from "./Node/previewNode.node";

const graph = new StateGraph(RepositoryReadmeStateAnnotation);

graph.addNode("CollectUserInput", collectUserInput);
graph.addNode("ExistingReadmeAnalyzer", existingReadmeAnalyzer);
graph.addNode("RepositoryMetadataAnalyzer", repositoryMetadataAnalyzer);
graph.addNode("FolderTreeAnalyzer", folderTreeAnalyzer);
graph.addNode("ConfigIntelligence", configIntelligence);
graph.addNode("FeatureDetection", featureDetection);
graph.addNode("ImportantCodeAnalyzer", importantCodeAnalyzer);
graph.addNode("KnowledgeBuilder", knowledgeBuilder);
graph.addNode("AIWriter", aiWriter);
graph.addNode("ReadmeValidator", readmeValidator);
graph.addNode("Preview", previewNode);

graph.addEdge(START as any, "CollectUserInput" as any);
graph.addEdge("CollectUserInput" as any, "ExistingReadmeAnalyzer" as any);
graph.addEdge("ExistingReadmeAnalyzer" as any, "RepositoryMetadataAnalyzer" as any);
graph.addEdge("RepositoryMetadataAnalyzer" as any, "FolderTreeAnalyzer" as any);
graph.addEdge("FolderTreeAnalyzer" as any, "ConfigIntelligence" as any);
graph.addEdge("ConfigIntelligence" as any, "FeatureDetection" as any);
graph.addEdge("FeatureDetection" as any, "ImportantCodeAnalyzer" as any);
graph.addEdge("ImportantCodeAnalyzer" as any, "KnowledgeBuilder" as any);
graph.addEdge("KnowledgeBuilder" as any, "AIWriter" as any);
graph.addEdge("AIWriter" as any, "ReadmeValidator" as any);
graph.addEdge("ReadmeValidator" as any, "Preview" as any);
graph.addEdge("Preview" as any, END);

export const repositoryReadmeGraph = graph.compile();
