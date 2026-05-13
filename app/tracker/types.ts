export type CooldownCategory = "3h" | "12h" | "1_day" | "3_days" | "7_days";

export type Instance = {
  id: string;
  name: string;
  minLevel: number;
  cooldownCategory: CooldownCategory;
  wiki: string;
  coins?: number;
};

export type TrackerItem = {
  id: string;
  name: string;
  cd: number;
  cdLabel: string;
  note?: string;
  wiki?: string;
  coins?: number;
};

export type Category = {
  id: string;
  title: string;
  color: string;
  items: TrackerItem[];
};

export type CustomItem = {
  id: string;
  name: string;
  cd: number;
  cdLabel: string;
  note?: string;
  doneAt: number | null;
};

export type CharState = {
  id: string;
  name: string;
  instances: Record<string, number>;
  notes: Record<string, string>;
  custom: CustomItem[];
  addedInstances: TrackerItem[];
  removedInstanceIds: string[];
  collapsed: Record<string, boolean>;
  order: Record<string, string[]>;
};

export type AppState = {
  activeChar: string;
  chars: CharState[];
};
