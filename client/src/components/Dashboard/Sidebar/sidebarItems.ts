import {
  BarChart3,
  FileText,
  FolderGit2,
  LayoutDashboard,
  Palette,
  ScrollText,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

export type SidebarItem = {
  name: string;
  route: string;
  icon: LucideIcon | null;
  section?: string;
};

export const sidebarItems: SidebarItem[] = [
  {
    name: "Dashboard",
    route: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Users",
    route: "/dashboard/users",
    icon: Users,
  },
  {
    name: "Profile Studio",
    route: "/dashboard/profile-studio",
    icon: Palette,
  },
  {
    name: "Resume Builder",
    route: "/dashboard/resume-builder",
    icon: FileText,
  },
  {
    name: "My Resumes",
    route: "/dashboard/resume",
    icon: ScrollText,
  },
  {
    name: "Repositories",
    route: "/dashboard/repositories",
    icon: FolderGit2,
  },
  {
    name: "Analytics",
    route: "/dashboard/analytics",
    icon: BarChart3,
  },
  { name: "divider", route: "", icon: null },
  {
    name: "Strike Recovery",
    route: "/dashboard/strike-recovery",
    icon: Sparkles,
    section: "Special Features",
  },
  {
    name: "README Intelligence",
    route: "/dashboard/readme-intelligence",
    icon: Sparkles,
    section: "Special Features",
  },
];
