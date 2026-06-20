import { type ResumeState } from "../State";
import { askGithub } from "../../../llm/github.llm";

export async function askOllamaForLatex(state: ResumeState): Promise<Partial<ResumeState>> {
  const pageCount = state.pageCount || 1;

  const pageInstruction = pageCount === 1
    ? "CRITICAL: The resume MUST fit on exactly ONE page. Trim content aggressively — keep only the most important/relevant experience, projects, and education. Omit less relevant details."
    : `The resume should span exactly ${pageCount} pages. Distribute content appropriately without leaving large gaps.`;

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

  let latexCode = await askGithub(prompt, state.githubAccessToken);

  latexCode = latexCode.replace(/(\\\\\s+)\[/g, '$1\\lbrack{}');
  latexCode = latexCode.replace(/(\\\\\s+)\]/g, '$1\\rbrack{}');

  return { latexCode };
}
