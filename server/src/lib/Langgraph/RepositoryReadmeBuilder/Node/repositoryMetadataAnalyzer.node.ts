import { type RepositoryReadmeState } from "../State";

export async function repositoryMetadataAnalyzer(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
  const octokit = state.octokit;
  if (!octokit) return {};

  const [{ data: repo }, { data: ownerRepoTopics }] = await Promise.all([
    octokit.request("GET /repos/{owner}/{repo}", {
      owner: state.repoOwner,
      repo: state.repoName,
    }),
    octokit.request("GET /repos/{owner}/{repo}/topics", {
      owner: state.repoOwner,
      repo: state.repoName,
      headers: {
        Accept: "application/vnd.github.mercy-preview+json",
      },
    }),
  ]);

  return {
    repoMeta: {
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      topics: ownerRepoTopics.names || [],
      stars: repo.stargazers_count || 0,
      languages: repo.language ? [repo.language] : [],
      defaultBranch: repo.default_branch,
      private: repo.private,
      homepage: repo.homepage,
      htmlUrl: repo.html_url,
    },
  };
}
