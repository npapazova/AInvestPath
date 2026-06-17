export const GOAL_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type GoalPriority = (typeof GOAL_PRIORITIES)[number];

export const GOAL_STATUSES = [
  "ACTIVE",
  "ON_TRACK",
  "AT_RISK",
  "COMPLETED",
  "ARCHIVED",
] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const ACTIVE_GOAL_STATUSES: GoalStatus[] = [
  "ACTIVE",
  "ON_TRACK",
  "AT_RISK",
  "COMPLETED",
];
