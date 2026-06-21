import { type RepositoryReadmeState } from "../State";
import { shouldIgnorePath } from "../utils";

export async function folderTreeAnalyzer(
  state: RepositoryReadmeState
): Promise<Partial<RepositoryReadmeState>> {
  const octokit = state.octokit;
  if (!octokit) return {};

  const branch = await octokit.request(
    "GET /repos/{owner}/{repo}/branches/{branch}",
    {
      owner: state.repoOwner,
      repo: state.repoName,
      branch: state.repoMeta?.defaultBranch || "main",
    }
  );

  const tree = await octokit.request(
    "GET /repos/{owner}/{repo}/git/trees/{tree_sha}",
    {
      owner: state.repoOwner,
      repo: state.repoName,
      tree_sha: (branch.data as any).commit?.commit?.tree?.sha || (branch.data as any).commit?.sha,
      recursive: "1",
    }
  );

  const paths: string[] = ((tree.data as any).tree || [])
    .filter((item: any) => item.path && !shouldIgnorePath(item.path))
    .map((item: any) => item.path)
    .slice(0, 150);

  const treeText = paths
    .map((path) => {
      const depth = path.split("/").length - 1;
      return `${"  ".repeat(depth)}- ${path}`;
    })
    .join("\n");

  return { folderTree: treeText };
}
