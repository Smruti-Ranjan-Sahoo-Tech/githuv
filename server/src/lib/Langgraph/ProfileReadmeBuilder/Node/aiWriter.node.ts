import { type ProfileReadmeState } from "../State";
import { askGithub } from "../../../llm/github.llm";

const MAX_PROMPT_LENGTH = 40000;

export async function aiWriter(
  state: typeof ProfileReadmeState.State
): Promise<Partial<typeof ProfileReadmeState.State>> {
  const userDataJson = JSON.stringify(state.userData, null, 2);
  const truncatedData =
    userDataJson.length > MAX_PROMPT_LENGTH
      ? userDataJson.slice(0, MAX_PROMPT_LENGTH) + "\n..."
      : userDataJson;

  const feedbackSection = state.userFeedback
    ? `\nUser preferences / style notes:\n${state.userFeedback}`
    : "";

  const existingSection = state.existingProfileReadme
    ? `\nExisting profile README (analyze it first, then replace with an improved version):\n${state.existingProfileReadme.slice(0, 5000)}`
    : "";

  const analysisPrompt = state.existingProfileReadme
    ? `\nBefore generating, carefully analyze the existing README above:
- What tone and style does it use?
- What sections does it include? What is missing?
- What are its strengths (e.g., clear structure, good visuals)?
- What could be improved (e.g., outdated info, weak layout, missing skills)?
- Note any personal details, links, or projects in the existing README that should be carried forward.
Use this analysis to create a significantly better README that keeps what works and improves everything else.`
    : "";

  const prompt = `
${state.themeTemplate}

---

Generate a GitHub Profile README markdown using this user data:

${truncatedData}
${existingSection}
${analysisPrompt}
${feedbackSection}

Remember:
- Output ONLY valid markdown.
- Do not wrap the response in triple backticks or markdown code fences.
- Replace USERNAME with the actual GitHub username: ${state.githubUsername}
- If the user data lacks certain info, OMIT that section — do not invent anything.
- Treat the theme as a content and layout guide, not a script to repeat verbatim.
- Prefer polished, modern README elements only when they fit the user's actual data.
- If the theme suggests animation, use GitHub-README-safe assets like SVGs, badges, or hosted GIFs.
- If the profile data includes avatarUrl, use it when a profile image or hero block would improve the README.
- Keep the final result visually strong, easy to scan, and tailored to the user's profile.
- If the user already has a profile README, incorporate any valid custom links or personal projects from it.
`.trim();

  const generatedProfileReadme = await askGithub(prompt, state.githubAccessToken);

  return { generatedProfileReadme };
}
