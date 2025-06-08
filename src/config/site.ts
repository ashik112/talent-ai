import type { SidebarMenuItemProps } from "@/components/layout/sidebar-nav-item";
import { BarChart3, FileText, BotMessageSquare, UploadCloud, Briefcase, CalendarClock, FileSignature, Settings } from "lucide-react";

export type SiteConfig = {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  mainNav: SidebarMenuItemProps[];
};

export const siteConfig: SiteConfig = {
  name: "TalentAI",
  description: "AI-powered hiring platform for tech startups.",
  url: "https://talentai.example.com",
  ogImage: "https://talentai.example.com/og.jpg",
  mainNav: [
    {
      href: "/",
      icon: BarChart3,
      label: "Dashboard",
      tooltip: "Analytics Dashboard"
    },
    {
      href: "/job-description",
      icon: FileText,
      label: "JD Generator",
      tooltip: "Generate Job Descriptions"
    },
    {
      href: "/resume-scoring",
      icon: UploadCloud,
      label: "Resume Scoring",
      tooltip: "Score Resumes"
    },
    {
      href: "/candidate-screening",
      icon: BotMessageSquare,
      label: "Screen Candidates",
      tooltip: "Automated Candidate Screening"
    },
    {
      href: "/job-posting",
      icon: Briefcase,
      label: "Job Posting",
      tooltip: "Automated Job Posting"
    },
    {
      href: "/interview-scheduling",
      icon: CalendarClock,
      label: "Scheduling",
      tooltip: "Interview Scheduling"
    },
    {
      href: "/offer-letters",
      icon: FileSignature,
      label: "Offer Letters",
      tooltip: "Generate Offer Letters"
    },
    // Example of a settings link, can be expanded later
    // {
    //   href: "/settings",
    //   icon: Settings,
    //   label: "Settings",
    //   tooltip: "Application Settings"
    // },
  ],
};
