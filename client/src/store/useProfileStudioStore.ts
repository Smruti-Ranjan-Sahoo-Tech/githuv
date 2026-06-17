import { create } from "zustand";
import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";

export type PersonalInfo = {
  fullName: string;
  currentRole: string;
  email: string;
  phone: string;
  location: string;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  profileImage: string;
};

export type Summary = {
  headline: string;
  about: string;
  currentlyLearning: string[];
  interests: string[];
  careerGoal: string;
};

export type Skills = {
  frontend: string[];
  backend: string[];
  database: string[];
  cloud: string[];
  devops: string[];
  tools: string[];
  languages: string[];
};

export type Project = {
  title: string;
  description: string;
  techStack: string[];
  githubUrl: string;
  liveUrl: string;
  role: string;
  features: string[];
  challenges: string;
  startDate: string;
  endDate: string;
};

export type Experience = {
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  responsibilities: string[];
  achievements: string[];
};

export type Education = {
  degree: string;
  college: string;
  location: string;
  cgpa: string;
  startYear: string;
  endYear: string;
};

export type Certification = {
  title: string;
  issuer: string;
  credentialUrl: string;
};

export type Achievement = {
  title: string;
  description: string;
};

export type OpenSource = {
  repository: string;
  contributionType: string;
  contributionUrl: string;
};

export type GithubInfo = {
  currentFocus: string;
  collaborationInterests: string[];
  funFact: string;
  favoriteRepositories: string[];
  pinnedProjects: string[];
};

export type LinkedinInfo = {
  headline: string;
  openToWork: boolean;
};

export type OnboardingProfile = {
  user?: string;
  firebaseUID?: string;
  currentStep: number;
  completedSteps: number[];
  onboardingCompleted: boolean;
  personalInfo: PersonalInfo;
  summary: Summary;
  skills: Skills;
  projects: Project[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  achievements: Achievement[];
  opensource: OpenSource[];
  githubInfo: GithubInfo;
  linkedinInfo: LinkedinInfo;
  createdAt?: string;
  updatedAt?: string;
};

export type ProfileDraft = {
  personalInfo: PersonalInfo;
  summary: Summary;
  skills: Skills;
  projects: Project[];
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  achievements: Achievement[];
  opensource: OpenSource[];
  githubInfo: GithubInfo;
  linkedinInfo: LinkedinInfo;
};

type StepSaveOptions = {
  keepAlive?: boolean;
  advance?: boolean;
};

type StepPayloadMap = {
  1: Pick<ProfileDraft, "personalInfo">;
  2: Pick<ProfileDraft, "summary" | "skills">;
  3: Pick<ProfileDraft, "projects">;
  4: Pick<ProfileDraft, "experience" | "education">;
  5: Pick<
    ProfileDraft,
    "certifications" | "achievements" | "opensource" | "githubInfo" | "linkedinInfo"
  >;
};

type ProfileStudioState = {
  profile: OnboardingProfile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  lastSavedAt: string | null;
  fetchProfile: () => Promise<OnboardingProfile | null>;
  saveStep: <Step extends keyof StepPayloadMap>(
    step: Step,
    payload: StepPayloadMap[Step],
    options?: StepSaveOptions,
  ) => Promise<boolean>;
  resetMessages: () => void;
};

const API_BASE_URL = "";

const emptyPersonalInfo = (): PersonalInfo => ({
  fullName: "",
  currentRole: "",
  email: "",
  phone: "",
  location: "",
  githubUrl: "",
  linkedinUrl: "",
  portfolioUrl: "",
  profileImage: "",
});

const emptySummary = (): Summary => ({
  headline: "",
  about: "",
  currentlyLearning: [],
  interests: [],
  careerGoal: "",
});

const emptySkills = (): Skills => ({
  frontend: [],
  backend: [],
  database: [],
  cloud: [],
  devops: [],
  tools: [],
  languages: [],
});

const emptyProject = (): Project => ({
  title: "",
  description: "",
  techStack: [],
  githubUrl: "",
  liveUrl: "",
  role: "",
  features: [],
  challenges: "",
  startDate: "",
  endDate: "",
});

const emptyExperience = (): Experience => ({
  company: "",
  position: "",
  location: "",
  startDate: "",
  endDate: "",
  responsibilities: [],
  achievements: [],
});

const emptyEducation = (): Education => ({
  degree: "",
  college: "",
  location: "",
  cgpa: "",
  startYear: "",
  endYear: "",
});

const emptyCertification = (): Certification => ({
  title: "",
  issuer: "",
  credentialUrl: "",
});

const emptyAchievement = (): Achievement => ({
  title: "",
  description: "",
});

const emptyOpenSource = (): OpenSource => ({
  repository: "",
  contributionType: "",
  contributionUrl: "",
});

const emptyGithubInfo = (): GithubInfo => ({
  currentFocus: "",
  collaborationInterests: [],
  funFact: "",
  favoriteRepositories: [],
  pinnedProjects: [],
});

const emptyLinkedinInfo = (): LinkedinInfo => ({
  headline: "",
  openToWork: false,
});

export const createEmptyDraft = (): ProfileDraft => ({
  personalInfo: emptyPersonalInfo(),
  summary: emptySummary(),
  skills: emptySkills(),
  projects: [emptyProject()],
  experience: [emptyExperience()],
  education: [emptyEducation()],
  certifications: [emptyCertification()],
  achievements: [emptyAchievement()],
  opensource: [emptyOpenSource()],
  githubInfo: emptyGithubInfo(),
  linkedinInfo: emptyLinkedinInfo(),
});

export const onboardingStepLabels = [
  {
    step: 1,
    key: "step1",
    title: "Personal Information",
    description: "Identity, contact, and profile links",
  },
  {
    step: 2,
    key: "step2",
    title: "Professional Profile",
    description: "Headline, summary, skills, and goals",
  },
  {
    step: 3,
    key: "step3",
    title: "Projects",
    description: "Portfolio projects with links and impact",
  },
  {
    step: 4,
    key: "step4",
    title: "Experience & Education",
    description: "Career history and academic background",
  },
  {
    step: 5,
    key: "step5",
    title: "Branding",
    description: "Certifications, GitHub, LinkedIn, and open source",
  },
] as const;

type ApiErrorResponse = {
  message?: string;
  error?: string;
};

const trimList = (values: string[]) =>
  values
    .map((value) => value.trim())
    .filter(Boolean);

const listFromString = (value: string) =>
  trimList(
    value
      .split(",")
      .map((item) => item.trim()),
  );

const normalizeDraft = (profile: OnboardingProfile | null): ProfileDraft => ({
  personalInfo: profile?.personalInfo ?? emptyPersonalInfo(),
  summary: {
    ...(profile?.summary ?? emptySummary()),
    currentlyLearning: profile?.summary?.currentlyLearning ?? [],
    interests: profile?.summary?.interests ?? [],
  },
  skills: {
    ...(profile?.skills ?? emptySkills()),
    frontend: profile?.skills?.frontend ?? [],
    backend: profile?.skills?.backend ?? [],
    database: profile?.skills?.database ?? [],
    cloud: profile?.skills?.cloud ?? [],
    devops: profile?.skills?.devops ?? [],
    tools: profile?.skills?.tools ?? [],
    languages: profile?.skills?.languages ?? [],
  },
  projects: profile?.projects?.length ? profile.projects : [emptyProject()],
  experience: profile?.experience?.length ? profile.experience : [emptyExperience()],
  education: profile?.education?.length ? profile.education : [emptyEducation()],
  certifications: profile?.certifications?.length ? profile.certifications : [emptyCertification()],
  achievements: profile?.achievements?.length ? profile.achievements : [emptyAchievement()],
  opensource: profile?.opensource?.length ? profile.opensource : [emptyOpenSource()],
  githubInfo: {
    ...(profile?.githubInfo ?? emptyGithubInfo()),
    collaborationInterests: profile?.githubInfo?.collaborationInterests ?? [],
    favoriteRepositories: profile?.githubInfo?.favoriteRepositories ?? [],
    pinnedProjects: profile?.githubInfo?.pinnedProjects ?? [],
  },
  linkedinInfo: {
    ...(profile?.linkedinInfo ?? emptyLinkedinInfo()),
    openToWork: profile?.linkedinInfo?.openToWork ?? false,
  },
});

const readErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as ApiErrorResponse;
    return payload.message ?? payload.error ?? "Request failed";
  } catch {
    return "Request failed";
  }
};

const applyStepToProfile = <Step extends keyof StepPayloadMap>(
  current: OnboardingProfile | null,
  step: Step,
  payload: StepPayloadMap[Step],
  response: { currentStep?: number; onboardingCompleted?: boolean },
  options?: { advance?: boolean },
): OnboardingProfile => {
  const shouldAdvance = options?.advance ?? false;
  const stepPayload = payload as StepPayloadMap[keyof StepPayloadMap];
  const profile: OnboardingProfile = current
    ? {
        ...current,
        personalInfo: { ...current.personalInfo },
        summary: {
          ...current.summary,
          currentlyLearning: [...current.summary.currentlyLearning],
          interests: [...current.summary.interests],
        },
        skills: {
          ...current.skills,
          frontend: [...current.skills.frontend],
          backend: [...current.skills.backend],
          database: [...current.skills.database],
          cloud: [...current.skills.cloud],
          devops: [...current.skills.devops],
          tools: [...current.skills.tools],
          languages: [...current.skills.languages],
        },
        projects: current.projects.map((item) => ({
          ...item,
          techStack: [...item.techStack],
          features: [...item.features],
        })),
        experience: current.experience.map((item) => ({
          ...item,
          responsibilities: [...item.responsibilities],
          achievements: [...item.achievements],
        })),
        education: current.education.map((item) => ({ ...item })),
        certifications: current.certifications.map((item) => ({ ...item })),
        achievements: current.achievements.map((item) => ({ ...item })),
        opensource: current.opensource.map((item) => ({ ...item })),
        githubInfo: {
          ...current.githubInfo,
          collaborationInterests: [...current.githubInfo.collaborationInterests],
          favoriteRepositories: [...current.githubInfo.favoriteRepositories],
          pinnedProjects: [...current.githubInfo.pinnedProjects],
        },
        linkedinInfo: { ...current.linkedinInfo },
      }
    : {
    currentStep: 1,
    completedSteps: [],
    onboardingCompleted: false,
    personalInfo: emptyPersonalInfo(),
    summary: emptySummary(),
    skills: emptySkills(),
    projects: [],
    experience: [],
    education: [],
    certifications: [],
    achievements: [],
    opensource: [],
    githubInfo: emptyGithubInfo(),
    linkedinInfo: emptyLinkedinInfo(),
  };

  const completed = new Set(profile.completedSteps);

  if (step === 1) {
    profile.personalInfo = (stepPayload as StepPayloadMap[1]).personalInfo;
  }

  if (step === 2) {
    profile.summary = (stepPayload as StepPayloadMap[2]).summary;
    profile.skills = (stepPayload as StepPayloadMap[2]).skills;
  }

  if (step === 3) {
    profile.projects = (stepPayload as StepPayloadMap[3]).projects;
  }

  if (step === 4) {
    profile.experience = (stepPayload as StepPayloadMap[4]).experience;
    profile.education = (stepPayload as StepPayloadMap[4]).education;
  }

  if (step === 5) {
    profile.certifications = (stepPayload as StepPayloadMap[5]).certifications;
    profile.achievements = (stepPayload as StepPayloadMap[5]).achievements;
    profile.opensource = (stepPayload as StepPayloadMap[5]).opensource;
    profile.githubInfo = (stepPayload as StepPayloadMap[5]).githubInfo;
    profile.linkedinInfo = (stepPayload as StepPayloadMap[5]).linkedinInfo;
  }

  completed.add(Number(step));
  profile.completedSteps = [...completed].sort((left, right) => left - right);

  if (step === 5) {
    profile.onboardingCompleted = true;
    profile.currentStep = 5;
  } else if (shouldAdvance) {
    profile.currentStep = response.currentStep ?? (step === 5 ? 5 : Number(step) + 1);
    profile.onboardingCompleted = response.onboardingCompleted ?? step === 5;
  }

  return profile;
};

const useProfileStudioStore = create<ProfileStudioState>((set, get) => ({
  profile: null,
  loading: false,
  saving: false,
  error: null,
  success: null,
  lastSavedAt: null,

  resetMessages: () => {
    set({ error: null, success: null });
  },

  fetchProfile: async () => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_BASE_URL}/api/onboarding/me`, {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401) {
        useFirebaseAuthStore.getState().logout();
        return null;
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as { profile: OnboardingProfile };
      set({
        profile: data.profile,
        loading: false,
        error: null,
        success: null,
        lastSavedAt: null,
      });

      return data.profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load profile";
      set({
        loading: false,
        error: message,
      });
      return null;
    }
  },

  saveStep: async (step, payload, options) => {
    set({ saving: true, error: null, success: null });

    try {
      const response = await fetch(`${API_BASE_URL}/api/onboarding/step${step}`, {
        method: "POST",
        credentials: "include",
        keepalive: options?.keepAlive ?? false,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        useFirebaseAuthStore.getState().logout();
        return false;
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as {
        success?: boolean;
        currentStep?: number;
        onboardingCompleted?: boolean;
      };

      const nextProfile = applyStepToProfile(
        get().profile,
        step,
        payload,
        {
          currentStep: data.currentStep,
          onboardingCompleted: data.onboardingCompleted,
        },
        {
          advance: options?.advance ?? false,
        },
      );

      set({
        profile: nextProfile,
        saving: false,
        success:
          step === 5
            ? "Profile Studio is complete."
            : `Step ${step} saved successfully.`,
        lastSavedAt: new Date().toISOString(),
      });

      return data.success !== false;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save step";
      set({
        saving: false,
        error: message,
      });
      return false;
    }
  },
}));

export const useProfileStudioDraft = () => {
  const profile = useProfileStudioStore((state) => state.profile);
  return normalizeDraft(profile);
};

export const useProfileStudioStoreSelectors = {
  emptyPersonalInfo,
  emptySummary,
  emptySkills,
  emptyProject,
  emptyExperience,
  emptyEducation,
  emptyCertification,
  emptyAchievement,
  emptyOpenSource,
  emptyGithubInfo,
  emptyLinkedinInfo,
  createEmptyDraft,
  normalizeDraft,
  listFromString,
  trimList,
};

export default useProfileStudioStore;
