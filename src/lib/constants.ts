import { LifeArea } from "@/generated/prisma";

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
    area: "DISCIPLINE",
    label: "Discipline",
    icon: "shield",
    description: "Routines, consistency, self-control",
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

export const CHARACTER_CLASSES = [
  { id: "warrior", name: "Warrior", description: "Strength through discipline" },
  { id: "scholar", name: "Scholar", description: "Knowledge is power" },
  { id: "monk", name: "Monk", description: "Balance in all things" },
  { id: "rogue", name: "Rogue", description: "Adapt, improvise, overcome" },
  { id: "wanderer", name: "Wanderer", description: "The journey is the destination" },
];

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
