export interface Tracker {
    id: string;
    name: string;
    count: number;
    dailyGoal: number;
    sortOrder: number;
    isActive: boolean;
    emoji?: string;
    isArchived?: boolean;
}

export interface HistoryRecord {
    date: string; // ISO string
    totalVolume: number;
    details: {
        trackerName: string;
        count: number;
        goal: number;
    }[];
}

export type HistoryLog = HistoryRecord[];

export type AchievementId =
    | 'first_tracker'
    | 'first_goal'
    | 'first_week'
    | 'streak_7'
    | 'streak_30'
    | 'streak_100'
    | 'actions_100'
    | 'actions_500'
    | 'actions_1000'
    | 'perfect_week'
    | 'perfect_month'
    | 'consistency_75';

export interface Achievement {
    id: AchievementId;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string; // ISO date when unlocked
}

export interface AchievementsState {
    unlocked: AchievementId[];
}
