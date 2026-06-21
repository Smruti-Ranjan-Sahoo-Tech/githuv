import { StateGraph } from "@langchain/langgraph";
import { ProfileReadmeState } from "./State";
import { fetchUserProfile } from "./Node/fetchUserProfile.node";
import { loadTheme } from "./Node/loadTheme.node";
import { aiWriter } from "./Node/aiWriter.node";
import { previewNode } from "./Node/previewNode.node";

const graph = new StateGraph(ProfileReadmeState)
  .addNode("fetchUserProfile", fetchUserProfile)
  .addNode("loadTheme", loadTheme)
  .addNode("aiWriter", aiWriter)
  .addNode("previewNode", previewNode)
  .addEdge("__start__", "fetchUserProfile")
  .addEdge("fetchUserProfile", "loadTheme")
  .addEdge("loadTheme", "aiWriter")
  .addEdge("aiWriter", "previewNode")
  .addEdge("previewNode", "__end__");

export const profileReadmeGraph = graph.compile();
