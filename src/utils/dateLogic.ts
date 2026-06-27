import { Tracker, HistoryRecord } from '../types';

export const getTodayString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Returns the "effective" date accounting for a custom day reset hour.
// e.g. if resetHour=4 and it's currently 2am, we're still "yesterday" in the app.
export const getEffectiveDateString = (resetHour: number = 0): string => {
    const now = new Date();
    if (resetHour > 0 && now.getHours() < resetHour) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const year = yesterday.getFullYear();
        const month = String(yesterday.getMonth() + 1).padStart(2, '0');
        const day = String(yesterday.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return getTodayString();
};

export const dateToString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const isWeekendDay = (): boolean => {
    const dow = new Date().getDay();
    return dow === 0 || dow === 6;
};

export const checkAndResetDailyCounts = (
    currentTrackers: Tracker[],
    lastActiveDate: string,
    history: HistoryRecord[],
    resetHour: number = 0
): { newTrackers: Tracker[]; newHistory: HistoryRecord[]; newDate: string } | null => {
    const today = getEffectiveDateString(resetHour);

    if (today === lastActiveDate) {
        return null;
    }

    const dailyTotal = currentTrackers.reduce((sum, t) => sum + t.count, 0);

    const details = currentTrackers.map(t => ({
        trackerName: t.name,
        count: t.count,
        goal: t.dailyGoal,
    }));

    const newRecord: HistoryRecord = {
        date: lastActiveDate || today,
        totalVolume: dailyTotal,
        details,
    };

    const newHistory = [...history, newRecord];

    const newTrackers = currentTrackers.map(t => ({
        ...t,
        count: 0,
    }));

    return {
        newTrackers,
        newHistory,
        newDate: today,
    };
};
