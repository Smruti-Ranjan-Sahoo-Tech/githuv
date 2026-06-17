import type { Request, Response } from "express";

import { User } from "../../models/user.model";
import { UserProfile, type IUserProfile } from "../../models/userProfile.model";

const ONBOARDING_STEPS = {
  step1: 1,
  step2: 2,
  step3: 3,
  step4: 4,
  step5: 5,
} as const;

type StepKey = keyof typeof ONBOARDING_STEPS;

class BadRequestError extends Error {}

function getAuthUser(req: Request) {
  if (!req.user?.firebaseUID) {
    throw new Error("Unauthorized");
  }

  return req.user;
}

async function getUserAndProfile(req: Request) {
  const authUser = getAuthUser(req);
  const user = await User.findOne({ firebaseUID: authUser.firebaseUID });

  if (!user) {
    throw new Error("User not found");
  }

  const profile = await UserProfile.findOneAndUpdate(
    { firebaseUID: authUser.firebaseUID },
    {
      $set: { user: user._id },
      $setOnInsert: {
        firebaseUID: authUser.firebaseUID,
        currentStep: 1,
        completedSteps: [],
        onboardingCompleted: false,
      },
    },
    { upsert: true, new: true },
  );

  return { user, profile };
}

function asString(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value.trim();
  }

  return fallback;
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function asStringArray(value: unknown, fallback: string[] = []) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return fallback;
}

function asObject<T extends Record<string, unknown>>(
  value: unknown,
  fallback: T
): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  return value as T;
}

function getBodySection<T extends Record<string, unknown>>(
  body: unknown,
  key: string
): T {
  const source = asObject<Record<string, unknown>>(body, {});
  const nested = source[key];

  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as T;
  }

  return source as T;
}

function getArraySection(body: unknown, key: string) {
  const source = asObject<Record<string, unknown>>(body, {});
  const nested = source[key];

  if (Array.isArray(nested)) {
    return nested;
  }

  return Array.isArray(body) ? body : [];
}

function dedupeNumbers(values: number[]) {
  return [...new Set(values)].sort((a, b) => a - b);
}

async function saveStep(
  req: Request,
  res: Response,
  step: StepKey,
  updater: (profile: IUserProfile, body: Record<string, unknown>) => void
) {
  try {
    const { profile } = await getUserAndProfile(req);
    const body = asObject<Record<string, unknown>>(req.body, {});

    updater(profile, body);

    const stepNumber = ONBOARDING_STEPS[step];
    profile.completedSteps = dedupeNumbers([
      ...profile.completedSteps,
      stepNumber,
    ]);
    profile.currentStep = Math.max(profile.currentStep, Math.min(stepNumber + 1, 5));

    if (step === "step5") {
      profile.onboardingCompleted = true;
      profile.currentStep = 5;
    }

    await profile.save();

    if (step === "step5") {
      return res.status(200).json({
        success: true,
        onboardingCompleted: true,
      });
    }

    return res.status(200).json({
      success: true,
      currentStep: Math.min(stepNumber + 1, 5),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save onboarding data";

    if (message === "Unauthorized") {
      return res.status(401).json({ success: false, message });
    }

    if (error instanceof BadRequestError) {
      return res.status(400).json({ success: false, message });
    }

    return res.status(500).json({
      success: false,
      message,
    });
  }
}

export default class onboarding {
  static async getMe(req: Request, res: Response) {
    try {
      const { profile } = await getUserAndProfile(req);

      return res.status(200).json({
        success: true,
        profile,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load onboarding profile";

      if (message === "Unauthorized") {
        return res.status(401).json({ success: false, message });
      }

      return res.status(500).json({
        success: false,
        message,
      });
    }
  }

  static async step1(req: Request, res: Response) {
    return saveStep(req, res, "step1", (profile, body) => {
      const personalInfo = getBodySection<Record<string, unknown>>(body, "personalInfo");

      const fullName = asString(personalInfo.fullName ?? body.fullName);
      const email = asString(personalInfo.email ?? body.email);
      const githubUrl = asString(personalInfo.githubUrl ?? body.githubUrl);

      if (!fullName || !email || !githubUrl) {
        throw new BadRequestError("Full name, email, and GitHub URL are required");
      }

      profile.personalInfo = {
        ...profile.personalInfo,
        fullName,
        currentRole: asString(personalInfo.currentRole ?? body.currentRole, profile.personalInfo.currentRole ?? ""),
        email,
        phone: asString(personalInfo.phone ?? body.phone, profile.personalInfo.phone ?? ""),
        location: asString(personalInfo.location ?? body.location, profile.personalInfo.location ?? ""),
        githubUrl,
        linkedinUrl: asString(personalInfo.linkedinUrl ?? body.linkedinUrl, profile.personalInfo.linkedinUrl ?? ""),
        portfolioUrl: asString(personalInfo.portfolioUrl ?? body.portfolioUrl, profile.personalInfo.portfolioUrl ?? ""),
        profileImage: asString(personalInfo.profileImage ?? body.profileImage, profile.personalInfo.profileImage ?? ""),
      };
    });
  }

  static async step2(req: Request, res: Response) {
    return saveStep(req, res, "step2", (profile, body) => {
      const summary = getBodySection<Record<string, unknown>>(body, "summary");
      const skills = getBodySection<Record<string, unknown>>(body, "skills");

      profile.summary = {
        ...profile.summary,
        headline: asString(summary.headline ?? body.headline, profile.summary.headline ?? ""),
        about: asString(summary.about ?? body.about, profile.summary.about ?? ""),
        currentlyLearning: asStringArray(
          summary.currentlyLearning ?? body.currentlyLearning,
          profile.summary.currentlyLearning ?? []
        ),
        interests: asStringArray(summary.interests ?? body.interests, profile.summary.interests ?? []),
        careerGoal: asString(summary.careerGoal ?? body.careerGoal, profile.summary.careerGoal ?? ""),
      };

      profile.skills = {
        ...profile.skills,
        frontend: asStringArray(skills.frontend ?? body.frontend, profile.skills.frontend ?? []),
        backend: asStringArray(skills.backend ?? body.backend, profile.skills.backend ?? []),
        database: asStringArray(skills.database ?? body.database, profile.skills.database ?? []),
        cloud: asStringArray(skills.cloud ?? body.cloud, profile.skills.cloud ?? []),
        devops: asStringArray(skills.devops ?? body.devops, profile.skills.devops ?? []),
        tools: asStringArray(skills.tools ?? body.tools, profile.skills.tools ?? []),
        languages: asStringArray(skills.languages ?? body.languages, profile.skills.languages ?? []),
      };
    });
  }

  static async step3(req: Request, res: Response) {
    return saveStep(req, res, "step3", (profile, body) => {
      const projectList = getArraySection(body, "projects");

      profile.projects = projectList.map((project) => {
        const item = asObject<Record<string, unknown>>(project, {});

        return {
          title: asString(item.title),
          description: asString(item.description),
          techStack: asStringArray(item.techStack),
          githubUrl: asString(item.githubUrl),
          liveUrl: asString(item.liveUrl),
          role: asString(item.role),
          features: asStringArray(item.features),
          challenges: asString(item.challenges),
          startDate: asString(item.startDate),
          endDate: asString(item.endDate),
        };
      });
    });
  }

  static async step4(req: Request, res: Response) {
    return saveStep(req, res, "step4", (profile, body) => {
      const experienceList = getArraySection(body, "experience");
      const educationList = getArraySection(body, "education");

      profile.experience = experienceList.map((item) => {
        const entry = asObject<Record<string, unknown>>(item, {});

        return {
          company: asString(entry.company),
          position: asString(entry.position),
          location: asString(entry.location),
          startDate: asString(entry.startDate),
          endDate: asString(entry.endDate),
          responsibilities: asStringArray(entry.responsibilities),
          achievements: asStringArray(entry.achievements),
        };
      });

      profile.education = educationList.map((item) => {
        const entry = asObject<Record<string, unknown>>(item, {});

        return {
          degree: asString(entry.degree),
          college: asString(entry.college),
          location: asString(entry.location),
          cgpa: asString(entry.cgpa),
          startYear: asString(entry.startYear),
          endYear: asString(entry.endYear),
        };
      });
    });
  }

  static async step5(req: Request, res: Response) {
    return saveStep(req, res, "step5", (profile, body) => {
      const githubInfo = getBodySection<Record<string, unknown>>(body, "githubInfo");
      const linkedinInfo = getBodySection<Record<string, unknown>>(body, "linkedinInfo");

      const certificationList = getArraySection(body, "certifications");
      const achievementList = getArraySection(body, "achievements");
      const openSourceList = getArraySection(body, "opensource");

      profile.certifications = certificationList.map((item) => {
        const entry = asObject<Record<string, unknown>>(item, {});

        return {
          title: asString(entry.title),
          issuer: asString(entry.issuer),
          credentialUrl: asString(entry.credentialUrl),
        };
      });

      profile.achievements = achievementList.map((item) => {
        const entry = asObject<Record<string, unknown>>(item, {});

        return {
          title: asString(entry.title),
          description: asString(entry.description),
        };
      });

      profile.opensource = openSourceList.map((item) => {
        const entry = asObject<Record<string, unknown>>(item, {});

        return {
          repository: asString(entry.repository),
          contributionType: asString(entry.contributionType),
          contributionUrl: asString(entry.contributionUrl),
        };
      });

      profile.githubInfo = {
        ...profile.githubInfo,
        currentFocus: asString(githubInfo.currentFocus ?? body.currentFocus, profile.githubInfo.currentFocus ?? ""),
        collaborationInterests: asStringArray(
          githubInfo.collaborationInterests ?? body.collaborationInterests,
          profile.githubInfo.collaborationInterests ?? []
        ),
        funFact: asString(githubInfo.funFact ?? body.funFact, profile.githubInfo.funFact ?? ""),
        favoriteRepositories: asStringArray(
          githubInfo.favoriteRepositories ?? body.favoriteRepositories,
          profile.githubInfo.favoriteRepositories ?? []
        ),
        pinnedProjects: asStringArray(
          githubInfo.pinnedProjects ?? body.pinnedProjects,
          profile.githubInfo.pinnedProjects ?? []
        ),
      };

      profile.linkedinInfo = {
        ...profile.linkedinInfo,
        headline: asString(linkedinInfo.headline ?? body.headline, profile.linkedinInfo.headline ?? ""),
        openToWork: asBoolean(linkedinInfo.openToWork ?? body.openToWork, profile.linkedinInfo.openToWork ?? false),
      };
    });
  }
}
