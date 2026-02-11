export interface Tracker {
    id: string;
    name: string;
    count: number;
    dailyGoal: number;
    sortOrder: number;
    isActive: boolean;
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
