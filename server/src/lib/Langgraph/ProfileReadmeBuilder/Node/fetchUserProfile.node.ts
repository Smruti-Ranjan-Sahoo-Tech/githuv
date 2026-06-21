import { type ProfileReadmeState } from "../State";
import { fetchUserProfileFromDB } from "../utils";
import { createOctokit } from "../../../../config/Octokit/octokit";

export async function fetchUserProfile(
  state: typeof ProfileReadmeState.State
): Promise<Partial<typeof ProfileReadmeState.State>> {
  const octokit = createOctokit(state.githubAccessToken);

  const { data: githubUser } = await octokit.request("GET /user");

  const githubData: Record<string, any> = {
    name: githubUser.name || githubUser.login,
    login: githubUser.login,
    bio: githubUser.bio || "",
    company: githubUser.company || "",
    location: githubUser.location || "",
    blog: githubUser.blog || "",
    email: githubUser.email || "",
    twitterUsername: githubUser.twitter_username || "",
    avatarUrl: githubUser.avatar_url,
    followers: githubUser.followers,
    following: githubUser.following,
    publicRepos: githubUser.public_repos,
    htmlUrl: githubUser.html_url,
  };

  const profile = await fetchUserProfileFromDB(state.userId);

  const mergedData = profile
    ? { ...githubData, ...profile }
    : githubData;

  let existingProfileReadme = "";

  try {
    const res = await octokit.rest.repos.getContent({
      owner: state.githubUsername,
      repo: state.githubUsername,
      path: "README.md",
    });

    if (!Array.isArray(res.data)) {
      const content = Buffer.from(
        (res.data as any).content || "",
        "base64"
      ).toString("utf8");
      existingProfileReadme = content;
    }
  } catch {
  }

  return {
    userData: mergedData,
    existingProfileReadme,
  };
}
