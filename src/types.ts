export type CharacterData = {
  id: string;
  name: string;
  stats: StatData[];
  events: EventData[];
};

export type StatData = {
  id: string;
  area: string;
  label: string;
  current: number;
  max: number;
  habits: HabitData[];
  consequence: { id: string; message: string; resolvedAt: string | null } | null;
};

export type HabitData = {
  id: string;
  name: string;
  frequency: string;
  weeklyTarget: number;
  statId: string;
  checkIns: { id: string; date: string }[];
};

export type EventData = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};
