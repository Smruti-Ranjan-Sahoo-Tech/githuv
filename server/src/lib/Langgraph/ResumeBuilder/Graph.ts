import { StateGraph, START, END } from "@langchain/langgraph";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { ResumeStateAnnotation, type ResumeState } from "./State";
import { cleanProfile } from "../../cleanProfile";
import { askOllama } from "../../llm/phi-4.ollama.llm";
import { askGithub } from "../../llm/github.llm";
import {
  compileLatexToPdfBuffer,
  uploadPdfToCloudinary,
  saveResumeRecord,
  getNextVersion,
} from "../../pdf/compileAndUpload";
import { UserProfile } from "../../../models/userProfile.model";

const __dirname = join(process.cwd(), "src", "lib", "Langgraph", "ResumeBuilder");
const THEME_DIR = join(__dirname, "Theme");

async function fetchAndCleanData(state: ResumeState): Promise<Partial<ResumeState>> {
  try {
    console.log("🔄 Node: fetchAndCleanData - START");
    const themeNo = state.themeNo || "Theme1";
    const themeFileName = existsSync(join(THEME_DIR, `${themeNo}.tex`))
      ? `${themeNo}.tex`
      : "Theme1.tex";
    const themePath = join(THEME_DIR, themeFileName);
    console.log("📂 Reading theme file:", themePath);
    const themeTex = await readFile(themePath, "utf-8");
    console.log("✓ Theme file read, length:", themeTex.length);

    console.log("🔍 Finding user profile for:", state.userId);
    const data = await UserProfile.findOne({firebaseUID:state.userId})
    if (!data) {
      throw new Error("No rawData provided. Ensure user profile is loaded before starting resume generation.");
    }
    console.log("✓ User profile found");

    console.log("🧹 Cleaning profile data...");
    const cleanedData = cleanProfile(data);
    console.log("✓ Profile cleaned, sections:", Object.keys(cleanedData).length);
    console.log("🔄 Node: fetchAndCleanData - END ✓");

    return { cleanedData, themeTex, themeNo, userObjectId: data.user };
  } catch (err: any) {
    console.error("❌ Node: fetchAndCleanData - ERROR:", err?.message || err);
    throw err;
  }
}

async function askOllamaForLatex(state: ResumeState): Promise<Partial<ResumeState>> {
  try {
    console.log("🔄 Node: askOllamaForLatex - START");
    const pageCount = state.pageCount || 1;
    console.log("📄 Generating resume for", pageCount, "page(s)");
    
    const pageInstruction = pageCount === 1
      ? "CRITICAL: The resume MUST fit on exactly ONE page. Trim content aggressively — keep only the most important/relevant experience, projects, and education. Omit less relevant details."
      : `The resume should span exactly ${pageCount} pages. Distribute content appropriately without leaving large gaps.`;

    console.log("✍️ Building prompt...");
    const prompt = `
You are an expert ATS Resume Writer and LaTeX Resume Generator.

Your task is to generate a professional ATS-friendly LaTeX resume using the user profile data and the LaTeX theme template provided below.

CRITICAL REQUIREMENTS:
- Return ONLY valid LaTeX code.
- Do NOT return markdown, explanations, or notes.
- Do NOT wrap the response in triple backticks.
- Preserve the LaTeX theme structure and commands exactly as provided.
- Only replace the content inside the template.
- The output must start with \\documentclass and end with \\end{document}.
- Escape all LaTeX special characters: & % $ # _ { } ~ ^
- If a section has no data, remove it while keeping valid LaTeX.
- NEVER use placeholder text like [City, State], [Month Year], [Name], [Email], etc. Use the actual data from the profile.
- If a field is empty or missing, omit that line entirely rather than inserting placeholder brackets.
- ${pageInstruction}

USER PROFILE DATA:
${JSON.stringify(state.cleanedData, null, 2)}

LATEX THEME TEMPLATE:
${state.themeTex}

Generate the ATS-optimized LaTeX resume now.
`;
    console.log("📤 Sending prompt to AI (length:", prompt.length, ")");

    let latexCode = await askGithub(prompt, process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN || "");
    console.log("✓ AI response received, LaTeX length:", latexCode?.length || 0);

    // Sanitize: escape literal [ and ] that appear after \\ with whitespace to prevent optional-argument parsing
    latexCode = latexCode.replace(/(\\\\\s+)\[/g, '$1\\lbrack{}');
    latexCode = latexCode.replace(/(\\\\\s+)\]/g, '$1\\rbrack{}');

    console.log("🔄 Node: askOllamaForLatex - END ✓");

    return { latexCode };
  } catch (err: any) {
    console.error("❌ Node: askOllamaForLatex - ERROR:", err?.message || err);
    throw err;
  }
}


async function compileAndUploadPdf(state: ResumeState): Promise<Partial<ResumeState>> {
  try {
    console.log("🔄 Node: compileAndUploadPdf - START");
    console.log("📄 LaTeX code length:", state.latexCode?.length || 0);
    
    console.log("⚙️ Compiling LaTeX to PDF...");
    const pdfBuffer = await compileLatexToPdfBuffer(state.latexCode);
    console.log("✓ PDF compiled, size:", pdfBuffer.length, "bytes");

    const firebaseUID = state.userId || "demo-user";
    console.log("🔢 Getting next version for:", firebaseUID);
    const version = await getNextVersion(firebaseUID);
    console.log("✓ Version:", version);

    console.log("☁️ Uploading to Cloudinary...");
    const { url, publicId } = await uploadPdfToCloudinary(pdfBuffer, firebaseUID, version);
    console.log("✓ Uploaded:", url);

    console.log("💾 Saving resume record...");
    await saveResumeRecord({
      userId: state.userObjectId,
      firebaseUID,
      threadId: state.threadId,
      latexCode: state.latexCode,
      cloudinaryUrl: url,
      cloudinaryPublicId: publicId,
      version,
    });
    console.log("✓ Record saved");
    console.log("🔄 Node: compileAndUploadPdf - END ✓");

    return { pdfUrl: url, cloudinaryPublicId: publicId };
  } catch (err: any) {
    console.error("❌ Node: compileAndUploadPdf - ERROR:", err?.message || err);
    throw err;
  }
}


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
