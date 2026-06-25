"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";

import ProgressRing from "@/components/ProfileStudio/ProgressRing";
import { useFirebaseAuthStore } from "@/store/useFirebaseAuthStore";
import { useGithubDataStore, type RecentRepo } from "@/store/useGithubDataStore";
import {
  createEmptyDraft,
  onboardingStepLabels,
  type Education,
  type Experience,
  type ProfileDraft,
  type Project,
} from "@/store/useProfileStudioStore";
import useProfileStudioStore from "@/store/useProfileStudioStore";

const totalSteps = onboardingStepLabels.length;

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const joinList = (value: string[]) => value.join(", ");

const fieldBase =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-red-400/60 focus:bg-white/8";
const labelBase = "mb-2 block text-sm font-medium text-white/75";
const cardBase =
  "rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20";

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className={labelBase}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={fieldBase}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className={labelBase}>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`${fieldBase} resize-none`}
      />
    </label>
  );
}

function StepBadge({
  title,
  description,
  status,
  active,
  onClick,
  stepNumber,
}: {
  title: string;
  description: string;
  status: "done" | "active" | "pending";
  active: boolean;
  onClick: () => void;
  stepNumber: number;
}) {
  const statusClasses =
    status === "done"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : status === "active"
        ? "border-red-400/20 bg-red-400/10 text-red-100"
        : "border-white/10 bg-white/5 text-white/50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
        active
          ? "border-red-400/30 bg-red-500/10"
          : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
      }`}
    >
      <div
        className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-black ${statusClasses}`}
      >
        {status === "done" ? <CheckCircle2 size={18} /> : stepNumber}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-white">{title}</h3>
          <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-white/50">
            {status}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-white/55">{description}</p>
      </div>
    </button>
  );
}

const formatProfileDate = (value?: string) => {
  if (!value) return "";

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return value;
};

function FindRepoModal({
  repos,
  loading,
  onSelect,
  onClose,
}: {
  repos: RecentRepo[];
  loading: boolean;
  onSelect: (repo: RecentRepo) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(query.toLowerCase()) ||
      (repo.description || "").toLowerCase().includes(query.toLowerCase()) ||
      (repo.language || "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Select a Repository</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 px-3 py-1 text-sm text-white/60 transition hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your repositories..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-10 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-400/60"
          />
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-white/40">Loading repositories...</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">No repositories found</p>
          ) : (
            filtered.map((repo) => (
              <button
                key={repo.full_name}
                type="button"
                onClick={() => onSelect(repo)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-red-400/30 hover:bg-red-500/5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-medium text-white">{repo.name}</h4>
                    {repo.description && (
                      <p className="mt-1 truncate text-sm text-white/50">{repo.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-sm text-white/50">
                    {repo.language && (
                      <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs">
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star size={14} /> {repo.stars}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfileStudioPage() {
  const router = useRouter();
  const { user, loading: authLoading, initialLoginCheck } =
    useFirebaseAuthStore();
  const {
    profile,
    loading: profileLoading,
    saving,
    error,
    success,
    lastSavedAt,
    fetchProfile,
    saveStep,
  } = useProfileStudioStore();

  const [activeStep, setActiveStep] = useState(1);
  const [draft, setDraft] = useState<ProfileDraft>(createEmptyDraft());
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null);
  const draftRef = useRef(draft);
  const activeStepRef = useRef(activeStep);
  const hydrationUidRef = useRef<string | null>(null);
  const autoFilledRef = useRef(false);

  const {
    data: githubData,
    loading: githubLoading,
    fetchDashboardData,
  } = useGithubDataStore();


  useEffect(() => {
    const unsubscribe = initialLoginCheck();
    return unsubscribe;
  }, [initialLoginCheck]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (hydrationUidRef.current === user.uid) {
      return;
    }

    hydrationUidRef.current = user.uid;
    void fetchProfile();
  }, [fetchProfile, user]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setDraft({
        personalInfo: profile.personalInfo,
        summary: profile.summary,
        skills: profile.skills,
        projects: profile.projects.length
          ? profile.projects
          : createEmptyDraft().projects,
        experience: profile.experience.length
          ? profile.experience
          : createEmptyDraft().experience,
        education: profile.education.length
          ? profile.education
          : createEmptyDraft().education,
        certifications: profile.certifications.length
          ? profile.certifications
          : createEmptyDraft().certifications,
        achievements: profile.achievements.length
          ? profile.achievements
          : createEmptyDraft().achievements,
        opensource: profile.opensource.length
          ? profile.opensource
          : createEmptyDraft().opensource,
        githubInfo: profile.githubInfo,
        linkedinInfo: profile.linkedinInfo,
      });
      setActiveStep(Math.min(Math.max(profile.currentStep || 1, 1), 5));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [profile]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);

  useEffect(() => {
    if (!user || !profile) return;
    const hasPersonalInfo = profile.personalInfo.fullName || profile.personalInfo.email;
    if (!hasPersonalInfo && !githubData && !githubLoading) {
      fetchDashboardData();
    }
  }, [user, profile, githubData, githubLoading, fetchDashboardData]);

  useEffect(() => {
    if (autoFilledRef.current || !githubData || !profile) return;
    const info = profile.personalInfo;
    const isEmpty = !info.fullName && !info.email && !info.githubUrl;
    if (!isEmpty) return;

    setDraft((current) => ({
      ...current,
      personalInfo: {
        fullName: githubData.profile.name || current.personalInfo.fullName,
        currentRole: githubData.profile.bio || current.personalInfo.currentRole,
        email: githubData.profile.email || current.personalInfo.email,
        phone: current.personalInfo.phone,
        location: githubData.profile.location || current.personalInfo.location,
        githubUrl: `https://github.com/${githubData.profile.login}`,
        linkedinUrl: current.personalInfo.linkedinUrl,
        portfolioUrl: githubData.profile.blog || current.personalInfo.portfolioUrl,
        profileImage: githubData.profile.avatar_url || current.personalInfo.profileImage,
      },
    }));
    autoFilledRef.current = true;
  }, [githubData, profile]);

  const saveCurrentStep = async (keepAlive = false, advance = false) => {
    const currentDraft = draftRef.current;
    const currentStep = activeStepRef.current;

    const ok =
      currentStep === 1
        ? await saveStep(
            1,
            { personalInfo: currentDraft.personalInfo },
            { keepAlive, advance },
          )
        : currentStep === 2
          ? await saveStep(
              2,
              {
                summary: currentDraft.summary,
                skills: currentDraft.skills,
              },
              { keepAlive, advance },
            )
          : currentStep === 3
            ? await saveStep(
                3,
                { projects: currentDraft.projects },
                { keepAlive, advance },
              )
            : currentStep === 4
              ? await saveStep(
                  4,
                  {
                    experience: currentDraft.experience,
                    education: currentDraft.education,
                  },
                  { keepAlive, advance },
                )
              : await saveStep(
                  5,
                  {
                    certifications: currentDraft.certifications,
                    achievements: currentDraft.achievements,
                    opensource: currentDraft.opensource,
                    githubInfo: currentDraft.githubInfo,
                    linkedinInfo: currentDraft.linkedinInfo,
                  },
                  { keepAlive, advance },
                );

    if (ok && advance) {
      setActiveStep((step) => Math.min(step + 1, 5));
    }

    return ok;
  };

  const updateProjects = (updater: (items: Project[]) => Project[]) => {
    setDraft((current) => ({
      ...current,
      projects: updater(current.projects),
    }));
  };

  const updateExperience = (updater: (items: Experience[]) => Experience[]) => {
    setDraft((current) => ({
      ...current,
      experience: updater(current.experience),
    }));
  };

  const updateEducation = (updater: (items: Education[]) => Education[]) => {
    setDraft((current) => ({
      ...current,
      education: updater(current.education),
    }));
  };

  const updateCertifications = (
    updater: (items: ProfileDraft["certifications"]) => ProfileDraft["certifications"],
  ) => {
    setDraft((current) => ({
      ...current,
      certifications: updater(current.certifications),
    }));
  };

  const updateAchievements = (
    updater: (items: ProfileDraft["achievements"]) => ProfileDraft["achievements"],
  ) => {
    setDraft((current) => ({
      ...current,
      achievements: updater(current.achievements),
    }));
  };

  const updateOpenSource = (
    updater: (items: ProfileDraft["opensource"]) => ProfileDraft["opensource"],
  ) => {
    setDraft((current) => ({
      ...current,
      opensource: updater(current.opensource),
    }));
  };

  const handleRepoSelect = (repo: RecentRepo) => {
    setDraft((current) => {
      const projects = [...current.projects];
      const index = activeProjectIndex;
      const project = {
        title: repo.name,
        description: repo.description || "",
        techStack: repo.language ? [repo.language] : [],
        githubUrl: repo.html_url,
        liveUrl: "",
        role: "",
        features: [],
        challenges: "",
        startDate: "",
        endDate: "",
      };
      if (index !== null && index < projects.length) {
        projects[index] = project;
      } else {
        projects.push(project);
      }
      return { ...current, projects };
    });
    setShowRepoModal(false);
    setActiveProjectIndex(null);
  };

  const progress = profile?.completedSteps?.length
    ? Math.round((profile.completedSteps.length / totalSteps) * 100)
    : Math.round((activeStep / totalSteps) * 100);

  const currentStepConfig =
    onboardingStepLabels.find((item) => item.step === activeStep) ??
    onboardingStepLabels[0];

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03]">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-red-400" />
          <p className="text-sm uppercase tracking-[0.28em] text-white/45">
            Loading Profile Studio
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSave = async (advance = false) => {
    await saveCurrentStep(false, advance);
  };

  const stepStatus = (stepNumber: number) => {
    if (profile?.onboardingCompleted && stepNumber === 5) {
      return "done" as const;
    }

    if (profile?.completedSteps.includes(stepNumber)) {
      return "done" as const;
    }

    if (stepNumber === activeStep) {
      return "active" as const;
    }

    return "pending" as const;
  };

  const renderStepEditor = () => {
    if (activeStep === 1) {
      return (
        <div className="space-y-4">
          <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <GitBranch size={20} className="text-red-300" />
                <div>
                  <p className="text-sm font-semibold text-white">GitHub Profile</p>
                  <p className="text-xs text-white/50">
                    {autoFilledRef.current
                      ? "Your personal info was auto-filled from GitHub. Edit or refresh below."
                      : "Import your profile data from GitHub to get started faster."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await fetchDashboardData();
                  const store = useGithubDataStore.getState();
                  if (store.data) {
                    const g = store.data.profile;
                    setDraft((current) => ({
                      ...current,
                      personalInfo: {
                        fullName: g.name || current.personalInfo.fullName,
                        currentRole: g.bio || current.personalInfo.currentRole,
                        email: g.email || current.personalInfo.email,
                        phone: current.personalInfo.phone,
                        location: g.location || current.personalInfo.location,
                        githubUrl: `https://github.com/${g.login}`,
                        linkedinUrl: current.personalInfo.linkedinUrl,
                        portfolioUrl: g.blog || current.personalInfo.portfolioUrl,
                        profileImage: g.avatar_url || current.personalInfo.profileImage,
                      },
                    }));
                    autoFilledRef.current = true;
                  }
                }}
                disabled={githubLoading}
                className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                <RotateCcw size={14} />
                {githubLoading ? "Fetching..." : "Import from GitHub"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Full name"
              value={draft.personalInfo.fullName}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  personalInfo: { ...current.personalInfo, fullName: value },
                }))
              }
              placeholder="Your name"
            />
            <TextField
              label="Current role"
              value={draft.personalInfo.currentRole}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  personalInfo: { ...current.personalInfo, currentRole: value },
                }))
              }
              placeholder="Frontend Engineer"
            />
            <TextField
              label="Email"
              value={draft.personalInfo.email}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  personalInfo: { ...current.personalInfo, email: value },
                }))
              }
              placeholder="you@example.com"
              type="email"
            />
            <TextField
              label="Phone"
              value={draft.personalInfo.phone}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  personalInfo: { ...current.personalInfo, phone: value },
                }))
              }
              placeholder="+91..."
            />
            <TextField
              label="Location"
              value={draft.personalInfo.location}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  personalInfo: { ...current.personalInfo, location: value },
                }))
              }
              placeholder="City, Country"
            />
            <TextField
              label="GitHub URL"
              value={draft.personalInfo.githubUrl}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  personalInfo: { ...current.personalInfo, githubUrl: value },
                }))
              }
              placeholder="https://github.com/yourname"
            />
            <TextField
              label="LinkedIn URL"
              value={draft.personalInfo.linkedinUrl}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  personalInfo: { ...current.personalInfo, linkedinUrl: value },
                }))
              }
              placeholder="https://linkedin.com/in/yourname"
            />
            <TextField
              label="Portfolio URL"
              value={draft.personalInfo.portfolioUrl}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  personalInfo: { ...current.personalInfo, portfolioUrl: value },
                }))
              }
              placeholder="https://..."
            />
          </div>
          <TextField
            label="Profile image URL"
            value={draft.personalInfo.profileImage}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                personalInfo: { ...current.personalInfo, profileImage: value },
              }))
            }
            placeholder="https://avatars.githubusercontent.com/..."
          />
        </div>
      );
    }

    if (activeStep === 2) {
      return (
        <div className="space-y-5">
          <TextField
            label="Headline"
            value={draft.summary.headline}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                summary: { ...current.summary, headline: value },
              }))
            }
            placeholder="Building intuitive web apps"
          />
          <TextAreaField
            label="About"
            value={draft.summary.about}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                summary: { ...current.summary, about: value },
              }))
            }
            placeholder="Tell your story"
            rows={5}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Currently learning"
              value={joinList(draft.summary.currentlyLearning)}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  summary: {
                    ...current.summary,
                    currentlyLearning: splitList(value),
                  },
                }))
              }
              placeholder="Next.js, System Design, AWS"
            />
            <TextField
              label="Interests"
              value={joinList(draft.summary.interests)}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  summary: { ...current.summary, interests: splitList(value) },
                }))
              }
              placeholder="AI, Product Design"
            />
            <TextField
              label="Career goal"
              value={draft.summary.careerGoal}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  summary: { ...current.summary, careerGoal: value },
                }))
              }
              placeholder="Senior Frontend Engineer"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(draft.skills).map(([key, value]) => (
              <TextField
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                value={joinList(value)}
                onChange={(nextValue) =>
                  setDraft((current) => ({
                    ...current,
                    skills: {
                      ...current.skills,
                      [key]: splitList(nextValue),
                    },
                  }))
                }
                placeholder="Comma separated values"
              />
            ))}
          </div>
        </div>
      );
    }

    if (activeStep === 3) {
      return (
        <div className="space-y-4">
          {draft.projects.map((project, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-white">Project {index + 1}</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProjectIndex(index);
                      if (githubData?.repositories.length) setShowRepoModal(true);
                      else fetchDashboardData().then(() => setShowRepoModal(true));
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:border-red-400/30 hover:text-red-200"
                  >
                    <GitBranch size={14} />
                    Find Repo
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateProjects((items) =>
                        items.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:border-red-400/30 hover:text-red-200"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Title"
                  value={project.title}
                  onChange={(value) =>
                    updateProjects((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, title: value } : item,
                      ),
                    )
                  }
                  placeholder="Profile Studio"
                />
                <TextField
                  label="Role"
                  value={project.role}
                  onChange={(value) =>
                    updateProjects((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, role: value } : item,
                      ),
                    )
                  }
                  placeholder="Full Stack Developer"
                />
                <TextField
                  label="GitHub URL"
                  value={project.githubUrl}
                  onChange={(value) =>
                    updateProjects((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, githubUrl: value } : item,
                      ),
                    )
                  }
                  placeholder="https://github.com/..."
                />
                <TextField
                  label="Live URL"
                  value={project.liveUrl}
                  onChange={(value) =>
                    updateProjects((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, liveUrl: value } : item,
                      ),
                    )
                  }
                  placeholder="https://..."
                />
                <TextField
                  label="Tech stack"
                  value={joinList(project.techStack)}
                  onChange={(value) =>
                    updateProjects((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, techStack: splitList(value) }
                          : item,
                      ),
                    )
                  }
                  placeholder="React, Node.js, MongoDB"
                />
                <TextField
                  label="Features"
                  value={joinList(project.features)}
                  onChange={(value) =>
                    updateProjects((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, features: splitList(value) }
                          : item,
                      ),
                    )
                  }
                  placeholder="Auth, analytics, exports"
                />
                <TextField
                  label="Start date"
                  value={project.startDate}
                  onChange={(value) =>
                    updateProjects((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, startDate: value } : item,
                      ),
                    )
                  }
                  placeholder="Jan 2025"
                />
                <TextField
                  label="End date"
                  value={project.endDate}
                  onChange={(value) =>
                    updateProjects((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, endDate: value } : item,
                      ),
                    )
                  }
                  placeholder="Present"
                />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextAreaField
                  label="Description"
                  value={project.description}
                  onChange={(value) =>
                    updateProjects((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, description: value } : item,
                      ),
                    )
                  }
                  rows={4}
                />
                <TextAreaField
                  label="Challenges"
                  value={project.challenges}
                  onChange={(value) =>
                    updateProjects((items) =>
                      items.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, challenges: value } : item,
                      ),
                    )
                  }
                  rows={4}
                />
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveProjectIndex(null);
                if (githubData?.repositories.length) setShowRepoModal(true);
                else fetchDashboardData().then(() => setShowRepoModal(true));
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-red-400/30 hover:text-red-200"
            >
              <GitBranch size={16} />
              Find from GitHub
            </button>
            <button
              type="button"
              onClick={() =>
                updateProjects((items) => [
                  ...items,
                  {
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
                  },
                ])
              }
              className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20"
            >
              <Plus size={16} />
              Add Project
            </button>
          </div>
        </div>
      );
    }

    if (activeStep === 4) {
      return (
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Experience</h3>
              <button
                type="button"
                onClick={() =>
                  updateExperience((items) => [
                    ...items,
                    {
                      company: "",
                      position: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      responsibilities: [],
                      achievements: [],
                    },
                  ])
                }
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
              >
                <Plus size={14} />
                Add Experience
              </button>
            </div>
            {draft.experience.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-medium text-white/90">Experience {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() =>
                      updateExperience((items) =>
                        items.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:border-red-400/30 hover:text-red-200"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Company"
                    value={item.company}
                    onChange={(value) =>
                      updateExperience((items) =>
                        items.map((experience, itemIndex) =>
                          itemIndex === index
                            ? { ...experience, company: value }
                            : experience,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="Position"
                    value={item.position}
                    onChange={(value) =>
                      updateExperience((items) =>
                        items.map((experience, itemIndex) =>
                          itemIndex === index
                            ? { ...experience, position: value }
                            : experience,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="Location"
                    value={item.location}
                    onChange={(value) =>
                      updateExperience((items) =>
                        items.map((experience, itemIndex) =>
                          itemIndex === index
                            ? { ...experience, location: value }
                            : experience,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="Start date"
                    value={item.startDate}
                    onChange={(value) =>
                      updateExperience((items) =>
                        items.map((experience, itemIndex) =>
                          itemIndex === index
                            ? { ...experience, startDate: value }
                            : experience,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="End date"
                    value={item.endDate}
                    onChange={(value) =>
                      updateExperience((items) =>
                        items.map((experience, itemIndex) =>
                          itemIndex === index
                            ? { ...experience, endDate: value }
                            : experience,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="Responsibilities"
                    value={joinList(item.responsibilities)}
                    onChange={(value) =>
                      updateExperience((items) =>
                        items.map((experience, itemIndex) =>
                          itemIndex === index
                            ? { ...experience, responsibilities: splitList(value) }
                            : experience,
                        ),
                      )
                    }
                    placeholder="Built APIs, shipped features"
                  />
                </div>
                <div className="mt-4">
                  <TextAreaField
                    label="Achievements"
                    value={joinList(item.achievements)}
                    onChange={(value) =>
                      updateExperience((items) =>
                        items.map((experience, itemIndex) =>
                          itemIndex === index
                            ? { ...experience, achievements: splitList(value) }
                            : experience,
                        ),
                      )
                    }
                    placeholder="List achievement bullets separated by commas"
                  />
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Education</h3>
              <button
                type="button"
                onClick={() =>
                  updateEducation((items) => [
                    ...items,
                    {
                      degree: "",
                      college: "",
                      location: "",
                      cgpa: "",
                      startYear: "",
                      endYear: "",
                    },
                  ])
                }
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
              >
                <Plus size={14} />
                Add Education
              </button>
            </div>
            {draft.education.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-medium text-white/90">Education {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() =>
                      updateEducation((items) =>
                        items.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/65 transition hover:border-red-400/30 hover:text-red-200"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Degree"
                    value={item.degree}
                    onChange={(value) =>
                      updateEducation((items) =>
                        items.map((education, itemIndex) =>
                          itemIndex === index
                            ? { ...education, degree: value }
                            : education,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="College"
                    value={item.college}
                    onChange={(value) =>
                      updateEducation((items) =>
                        items.map((education, itemIndex) =>
                          itemIndex === index
                            ? { ...education, college: value }
                            : education,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="Location"
                    value={item.location}
                    onChange={(value) =>
                      updateEducation((items) =>
                        items.map((education, itemIndex) =>
                          itemIndex === index
                            ? { ...education, location: value }
                            : education,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="CGPA"
                    value={item.cgpa}
                    onChange={(value) =>
                      updateEducation((items) =>
                        items.map((education, itemIndex) =>
                          itemIndex === index
                            ? { ...education, cgpa: value }
                            : education,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="Start year"
                    value={item.startYear}
                    onChange={(value) =>
                      updateEducation((items) =>
                        items.map((education, itemIndex) =>
                          itemIndex === index
                            ? { ...education, startYear: value }
                            : education,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="End year"
                    value={item.endYear}
                    onChange={(value) =>
                      updateEducation((items) =>
                        items.map((education, itemIndex) =>
                          itemIndex === index
                            ? { ...education, endYear: value }
                            : education,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </section>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Certifications</h3>
            <button
              type="button"
              onClick={() =>
                updateCertifications((items) => [
                  ...items,
                  { title: "", issuer: "", credentialUrl: "" },
                ])
              }
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
            >
              <Plus size={14} />
              Add Certification
            </button>
          </div>
          {draft.certifications.map((item, index) => (
            <div
              key={index}
              className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-3"
            >
              <TextField
                label="Title"
                value={item.title}
                onChange={(value) =>
                  updateCertifications((items) =>
                    items.map((certification, itemIndex) =>
                      itemIndex === index
                        ? { ...certification, title: value }
                        : certification,
                    ),
                  )
                }
              />
              <TextField
                label="Issuer"
                value={item.issuer}
                onChange={(value) =>
                  updateCertifications((items) =>
                    items.map((certification, itemIndex) =>
                      itemIndex === index
                        ? { ...certification, issuer: value }
                        : certification,
                    ),
                  )
                }
              />
              <div className="flex items-end gap-3">
                <TextField
                  label="Credential URL"
                  value={item.credentialUrl}
                  onChange={(value) =>
                    updateCertifications((items) =>
                      items.map((certification, itemIndex) =>
                        itemIndex === index
                          ? { ...certification, credentialUrl: value }
                          : certification,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    updateCertifications((items) =>
                      items.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="mb-[1px] inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-3 text-white/60 transition hover:border-red-400/30 hover:text-red-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Achievements</h3>
            <button
              type="button"
              onClick={() =>
                updateAchievements((items) => [
                  ...items,
                  { title: "", description: "" },
                ])
              }
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
            >
              <Plus size={14} />
              Add Achievement
            </button>
          </div>
          {draft.achievements.map((item, index) => (
            <div
              key={index}
              className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[240px_1fr_auto]"
            >
              <TextField
                label="Title"
                value={item.title}
                onChange={(value) =>
                  updateAchievements((items) =>
                    items.map((achievement, itemIndex) =>
                      itemIndex === index
                        ? { ...achievement, title: value }
                        : achievement,
                    ),
                  )
                }
              />
              <TextAreaField
                label="Description"
                value={item.description}
                onChange={(value) =>
                  updateAchievements((items) =>
                    items.map((achievement, itemIndex) =>
                      itemIndex === index
                        ? { ...achievement, description: value }
                        : achievement,
                    ),
                  )
                }
                rows={3}
              />
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() =>
                    updateAchievements((items) =>
                      items.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="mb-[1px] inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-3 text-white/60 transition hover:border-red-400/30 hover:text-red-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Open Source</h3>
            <button
              type="button"
              onClick={() =>
                updateOpenSource((items) => [
                  ...items,
                  {
                    repository: "",
                    contributionType: "",
                    contributionUrl: "",
                  },
                ])
              }
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
            >
              <Plus size={14} />
              Add Contribution
            </button>
          </div>
          {draft.opensource.map((item, index) => (
            <div
              key={index}
              className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <TextField
                label="Repository"
                value={item.repository}
                onChange={(value) =>
                  updateOpenSource((items) =>
                    items.map((source, itemIndex) =>
                      itemIndex === index
                        ? { ...source, repository: value }
                        : source,
                    ),
                  )
                }
              />
              <TextField
                label="Contribution type"
                value={item.contributionType}
                onChange={(value) =>
                  updateOpenSource((items) =>
                    items.map((source, itemIndex) =>
                      itemIndex === index
                        ? { ...source, contributionType: value }
                        : source,
                    ),
                  )
                }
              />
              <TextField
                label="Contribution URL"
                value={item.contributionUrl}
                onChange={(value) =>
                  updateOpenSource((items) =>
                    items.map((source, itemIndex) =>
                      itemIndex === index
                        ? { ...source, contributionUrl: value }
                        : source,
                    ),
                  )
                }
              />
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() =>
                    updateOpenSource((items) =>
                      items.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="mb-[1px] inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-3 text-white/60 transition hover:border-red-400/30 hover:text-red-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">GitHub Branding</h3>
            <TextField
              label="Current focus"
              value={draft.githubInfo.currentFocus}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  githubInfo: {
                    ...current.githubInfo,
                    currentFocus: value,
                  },
                }))
              }
            />
            <TextField
              label="Collaboration interests"
              value={joinList(draft.githubInfo.collaborationInterests)}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  githubInfo: {
                    ...current.githubInfo,
                    collaborationInterests: splitList(value),
                  },
                }))
              }
            />
            <TextField
              label="Fun fact"
              value={draft.githubInfo.funFact}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  githubInfo: { ...current.githubInfo, funFact: value },
                }))
              }
            />
            <TextField
              label="Favorite repositories"
              value={joinList(draft.githubInfo.favoriteRepositories)}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  githubInfo: {
                    ...current.githubInfo,
                    favoriteRepositories: splitList(value),
                  },
                }))
              }
            />
            <TextField
              label="Pinned projects"
              value={joinList(draft.githubInfo.pinnedProjects)}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  githubInfo: {
                    ...current.githubInfo,
                    pinnedProjects: splitList(value),
                  },
                }))
              }
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">LinkedIn Branding</h3>
            <TextField
              label="Headline"
              value={draft.linkedinInfo.headline}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  linkedinInfo: { ...current.linkedinInfo, headline: value },
                }))
              }
            />
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/80">
              <input
                type="checkbox"
                checked={draft.linkedinInfo.openToWork}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    linkedinInfo: {
                      ...current.linkedinInfo,
                      openToWork: event.target.checked,
                    },
                  }))
                }
                className="size-4 rounded border-white/20 bg-transparent accent-red-500"
              />
              Open to work
            </label>
          </div>
        </section>
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.12),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-4 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Profile Studio
            </h1>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-100">
              <Sparkles size={12} />
              Progress builder
            </span>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
            Save every step, resume later, and watch your profile grow through a circular progress board and step tracker.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.28em] text-white/40">Status</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {profile?.onboardingCompleted
              ? "Completed"
              : `Step ${activeStep} in progress`}
          </p>
          <p className="text-xs text-white/45">
            {lastSavedAt
              ? `Last saved ${new Date(lastSavedAt).toLocaleTimeString()}`
              : "Not saved yet"}
          </p>

        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className={`${cardBase} xl:sticky xl:top-6 h-fit space-y-6`}>
          <ProgressRing
            progress={progress}
            completedSteps={profile?.completedSteps?.length ?? 0}
            totalSteps={totalSteps}
            currentStep={activeStep}
          />

          <div className="space-y-3">
            {onboardingStepLabels.map((item) => (
              <StepBadge
                key={item.step}
                title={item.title}
                description={item.description}
                status={stepStatus(item.step)}
                active={activeStep === item.step}
                stepNumber={item.step}
                onClick={() => setActiveStep(item.step)}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/55">Completion</span>
              <span className="text-sm font-semibold text-white">{progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-6 text-white/45">
              {profile?.completedSteps?.length ?? 0} of {totalSteps} steps completed. Your profile can be resumed at any time.
            </p>
          </div>
        </aside>

        <main className={`${cardBase} space-y-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/40">
                {currentStepConfig.title}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                {currentStepConfig.description}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveStep((step) => Math.max(step - 1, 1))}
                disabled={activeStep === 1}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-rose-400 px-4 py-2 text-sm font-semibold text-white transition hover:from-red-400 hover:to-rose-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {success}
            </div>
          ) : null}

          {renderStepEditor()}

          {showRepoModal ? (
            <FindRepoModal
              repos={githubData?.repositories ?? []}
              loading={githubLoading}
              onSelect={handleRepoSelect}
              onClose={() => {
                setShowRepoModal(false);
                setActiveProjectIndex(null);
              }}
            />
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">

            <div className="flex items-center gap-3">
              {activeStep < 5 ? (
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save and continue
                  <ChevronRight size={16} />
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                  <CheckCircle2 size={16} />
                  Ready for dashboard generation
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
