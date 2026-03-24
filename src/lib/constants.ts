import { LifeArea } from "@/generated/prisma/client";

export const HABIT_CAP = 12;
export const HABIT_SOFT_CAP = 8;

export const LIFE_AREAS: {
  area: LifeArea;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    area: "HEALTH",
    label: "Health",
    icon: "heart",
    description: "Physical fitness, sleep, nutrition",
  },
  {
    area: "KNOWLEDGE",
    label: "Knowledge",
    icon: "book",
    description: "Learning, reading, skill development",
  },
  {
    area: "SOCIAL",
    label: "Social",
    icon: "users",
    description: "Relationships, community, communication",
  },
  {
    area: "CREATIVITY",
    label: "Creativity",
    icon: "sparkles",
    description: "Art, music, writing, building",
  },
  {
    area: "FINANCE",
    label: "Finance",
    icon: "coins",
    description: "Saving, investing, earning, budgeting",
  },
];

export const SUGGESTED_HABITS: Record<string, string[]> = {
  HEALTH: ["Exercise 30 minutes", "Drink 8 glasses of water", "Sleep by 11pm"],
  KNOWLEDGE: ["Read 20 pages", "Practice a skill", "Watch an educational video"],
  SOCIAL: ["Call a friend", "Check in on someone", "Meet someone new"],
  CREATIVITY: ["Write for 15 minutes", "Draw or sketch", "Work on a project"],
  FINANCE: ["Review spending", "Save something", "Track expenses"],
};

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
