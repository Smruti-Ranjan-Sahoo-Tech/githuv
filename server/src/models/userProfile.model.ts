import mongoose, { type Document, Schema } from "mongoose";

export interface PersonalInfo {
  fullName?: string;
  currentRole?: string;
  email?: string;
  phone?: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  profileImage?: string;
}

export interface Summary {
  headline?: string;
  about?: string;
  currentlyLearning?: string[];
  interests?: string[];
  careerGoal?: string;
}

export interface Skills {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  cloud?: string[];
  devops?: string[];
  tools?: string[];
  languages?: string[];
}

export interface Project {
  title?: string;
  description?: string;
  techStack?: string[];
  githubUrl?: string;
  liveUrl?: string;
  role?: string;
  features?: string[];
  challenges?: string;
  startDate?: string;
  endDate?: string;
}

export interface Experience {
  company?: string;
  position?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  responsibilities?: string[];
  achievements?: string[];
}

export interface Education {
  degree?: string;
  college?: string;
  location?: string;
  cgpa?: string;
  startYear?: string;
  endYear?: string;
}

export interface Certification {
  title?: string;
  issuer?: string;
  credentialUrl?: string;
}

export interface Achievement {
  title?: string;
  description?: string;
}

export interface OpenSource {
  repository?: string;
  contributionType?: string;
  contributionUrl?: string;
}

export interface GithubInfo {
  currentFocus?: string;
  collaborationInterests?: string[];
  funFact?: string;
  favoriteRepositories?: string[];
  pinnedProjects?: string[];
}

export interface LinkedinInfo {
  headline?: string;
  openToWork?: boolean;
}

export interface StrikeRecovery {
  startDate?: string;
  endDate?: string;
  totalCommits?: number;
  uniqueDays?: number;
  longestStreak?: number;
  repository?: string;
  owner?: string;
  recoveredAt?: string;
}

export interface IUserProfile extends Document {
  user: mongoose.Types.ObjectId;
  firebaseUID: string;
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
  strikeRecovery?: StrikeRecovery;
  createdAt: Date;
  updatedAt: Date;
}

const stringArray = {
  type: [String],
  default: [],
};

const personalInfoSchema = new Schema<PersonalInfo>(
  {
    fullName: { type: String, trim: true, default: "" },
    currentRole: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    githubUrl: { type: String, trim: true, default: "" },
    linkedinUrl: { type: String, trim: true, default: "" },
    portfolioUrl: { type: String, trim: true, default: "" },
    profileImage: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const summarySchema = new Schema<Summary>(
  {
    headline: { type: String, trim: true, default: "" },
    about: { type: String, trim: true, default: "" },
    currentlyLearning: { ...stringArray },
    interests: { ...stringArray },
    careerGoal: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const skillsSchema = new Schema<Skills>(
  {
    frontend: { ...stringArray },
    backend: { ...stringArray },
    database: { ...stringArray },
    cloud: { ...stringArray },
    devops: { ...stringArray },
    tools: { ...stringArray },
    languages: { ...stringArray },
  },
  { _id: false }
);

const projectSchema = new Schema<Project>(
  {
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    techStack: { ...stringArray },
    githubUrl: { type: String, trim: true, default: "" },
    liveUrl: { type: String, trim: true, default: "" },
    role: { type: String, trim: true, default: "" },
    features: { ...stringArray },
    challenges: { type: String, trim: true, default: "" },
    startDate: { type: String, trim: true, default: "" },
    endDate: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const experienceSchema = new Schema<Experience>(
  {
    company: { type: String, trim: true, default: "" },
    position: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    startDate: { type: String, trim: true, default: "" },
    endDate: { type: String, trim: true, default: "" },
    responsibilities: { ...stringArray },
    achievements: { ...stringArray },
  },
  { _id: false }
);

const educationSchema = new Schema<Education>(
  {
    degree: { type: String, trim: true, default: "" },
    college: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    cgpa: { type: String, trim: true, default: "" },
    startYear: { type: String, trim: true, default: "" },
    endYear: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const certificationSchema = new Schema<Certification>(
  {
    title: { type: String, trim: true, default: "" },
    issuer: { type: String, trim: true, default: "" },
    credentialUrl: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const achievementSchema = new Schema<Achievement>(
  {
    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const openSourceSchema = new Schema<OpenSource>(
  {
    repository: { type: String, trim: true, default: "" },
    contributionType: { type: String, trim: true, default: "" },
    contributionUrl: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const githubInfoSchema = new Schema<GithubInfo>(
  {
    currentFocus: { type: String, trim: true, default: "" },
    collaborationInterests: { ...stringArray },
    funFact: { type: String, trim: true, default: "" },
    favoriteRepositories: { ...stringArray },
    pinnedProjects: { ...stringArray },
  },
  { _id: false }
);

const linkedinInfoSchema = new Schema<LinkedinInfo>(
  {
    headline: { type: String, trim: true, default: "" },
    openToWork: { type: Boolean, default: false },
  },
  { _id: false }
);

const strikeRecoverySchema = new Schema<StrikeRecovery>(
  {
    startDate: { type: String, trim: true, default: "" },
    endDate: { type: String, trim: true, default: "" },
    totalCommits: { type: Number, default: 0 },
    uniqueDays: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    repository: { type: String, trim: true, default: "" },
    owner: { type: String, trim: true, default: "" },
    recoveredAt: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const userProfileSchema = new Schema<IUserProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    completedSteps: {
      type: [Number],
      default: [],
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    personalInfo: {
      type: personalInfoSchema,
      default: () => ({}),
    },
    summary: {
      type: summarySchema,
      default: () => ({}),
    },
    skills: {
      type: skillsSchema,
      default: () => ({}),
    },
    projects: {
      type: [projectSchema],
      default: [],
    },
    experience: {
      type: [experienceSchema],
      default: [],
    },
    education: {
      type: [educationSchema],
      default: [],
    },
    certifications: {
      type: [certificationSchema],
      default: [],
    },
    achievements: {
      type: [achievementSchema],
      default: [],
    },
    opensource: {
      type: [openSourceSchema],
      default: [],
    },
    githubInfo: {
      type: githubInfoSchema,
      default: () => ({}),
    },
    linkedinInfo: {
      type: linkedinInfoSchema,
      default: () => ({}),
    },
    strikeRecovery: {
      type: strikeRecoverySchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export const UserProfile = mongoose.model<IUserProfile>("UserProfile", userProfileSchema);
