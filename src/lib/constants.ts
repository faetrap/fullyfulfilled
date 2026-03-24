import { LifeArea } from "@/generated/prisma/client";

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


export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
