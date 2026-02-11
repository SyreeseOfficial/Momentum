import { Tracker, HistoryRecord } from '../types';

export const getTodayString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const checkAndResetDailyCounts = (
    currentTrackers: Tracker[],
    lastActiveDate: string,
    history: HistoryRecord[]
): { newTrackers: Tracker[]; newHistory: HistoryRecord[]; newDate: string } | null => {
    const today = getTodayString();

    if (today === lastActiveDate) {
        return null;
    }

    // Create history record for the last active day
    // If lastActiveDate is missing/empty, we can default to today or skip. 
    // But assuming app logic initializes it correctly or handles the very first run.
    // If lastActiveDate is empty, we probably shouldn't archive "previous" counts if they are just initial defaults.
    // However, usually existing trackers might have 0 counts.
    // Let's assume lastActiveDate is a valid date string if provided. 
    // If it's the first ever run, lastActiveDate might be empty, and counts are 0.
    // If logic: if today !== lastActiveDate. 
    // If lastActiveDate is '', then today !== ''. We archive. 
    // If counts are 0, we archive a 0 record for date ''. This might be messy.
    // The prompt doesn't specify handling empty lastActiveDate. 
    // I will assume it works as requested.

    const dailyTotal = currentTrackers.reduce((sum, t) => sum + t.count, 0);

    const details = currentTrackers.map(t => ({
        trackerName: t.name,
        count: t.count,
        goal: t.dailyGoal,
    }));

    const newRecord: HistoryRecord = {
        date: lastActiveDate || today, // Fallback to today if lastActiveDate is somehow empty, though 'lastActiveDate' is expected to be the date of the counts.
        totalVolume: dailyTotal,
        details,
    };

    // If lastActiveDate was empty (first run?), maybe we shouldn't add a history record?
    // But the prompt says "archive the current counts". 
    // I'll add a check: only archive if lastActiveDate is set? 
    // "Logic: 1. Get today... 2. If today !== lastActiveDate: - archive..."
    // It doesn't say "only if lastActiveDate exists".
    // However, for a fresh app, lastActiveDate might be null/undefined.
    // I'll treat it as string based on prompt "lastActiveDate" arg.

    // Actually, if I just installed the app, lastActiveDate might be undefined.
    // If I return newDate: today, next time it will be defined.
    // I'll stick to the prompt exactly.

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
