import { create } from "zustand";
import { axiosInstance } from "@/API/axiosInstance";

type TopLanguage = {
  language: string;
  count: number;
};

type RecentRepo = {
  name: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  updated_at: string;
  private: boolean;
  html_url: string;
};

type RecentActivity = {
  id: string;
  type: string;
  repo: string;
  created_at: string;
  payload: any;
};

type GithubProfile = {
  login: string;
  name: string;
  avatar_url: string;
  bio: string;
  location: string;
  company: string;
  blog: string;
  email: string;
  twitter_username: string;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  created_at: string;
};

type GithubStats = {
  totalRepos: number;
  totalStars: number;
  totalForks: number;
  topLanguages: TopLanguage[];
  totalWatchers: number;
};

type DashboardData = {
  profile: GithubProfile;
  stats: GithubStats;
  recentRepos: RecentRepo[];
  recentActivity: RecentActivity[];
};

type GithubDataState = {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  fetchDashboardData: (githubAccessToken?: string) => Promise<void>;
};

export const useGithubDataStore = create<GithubDataState>((set) => ({
  data: null,
  loading: false,
  error: null,

  fetchDashboardData: async (_githubAccessToken?: string) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/api/githuv/dashboard-data");
      set({ data: data as DashboardData, loading: false });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch dashboard data";
      set({ error: message, loading: false });
    }
  },
}));
