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

export interface AppPreferences {
    weekStartDay: 'sunday' | 'monday';
    sortPreference: 'custom' | 'alphabetical' | 'goalProximity' | 'frequency';
    dayResetHour: number;
    heatmapWeeks: 4 | 8 | 12 | 24;
    weekendGoalEnabled: boolean;
    weekendGoalMultiplier: number;
    // Phase 2
    accentColor: string;
    showEmojiOnCard: boolean;
    showGoalOnCard: boolean;
    cardStyle: 'detailed' | 'minimal';
}

export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface EnergyEntry {
    date: string;
    level: EnergyLevel;
}

export type EnergyLog = EnergyEntry[];

export const ENERGY_LABELS: Record<EnergyLevel, { emoji: string; label: string }> = {
    1: { emoji: '😴', label: 'Exhausted' },
    2: { emoji: '😔', label: 'Low' },
    3: { emoji: '😐', label: 'Okay' },
    4: { emoji: '😊', label: 'Good' },
    5: { emoji: '🔥', label: 'Fired up' },
};

export const DEFAULT_PREFERENCES: AppPreferences = {
    weekStartDay: 'sunday',
    sortPreference: 'custom',
    dayResetHour: 0,
    heatmapWeeks: 12,
    weekendGoalEnabled: false,
    weekendGoalMultiplier: 0.5,
    accentColor: '#6366F1',
    showEmojiOnCard: true,
    showGoalOnCard: true,
    cardStyle: 'detailed',
};
