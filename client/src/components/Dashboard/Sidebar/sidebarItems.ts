import {
  BarChart3,
  FileText,
  FolderGit2,
  LayoutDashboard,
  Palette,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react";

export const sidebarItems = [
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
  {
    name: "Admins",
    route: "/dashboard/admins",
    icon: Shield,
  },
  {
    name: "Settings",
    route: "/dashboard/settings",
    icon: Settings,
  },
];
