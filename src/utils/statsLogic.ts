import { Tracker, HistoryRecord } from '../types';
import { getTodayString } from './dateLogic';

/**
 * Calculates the total volume of work done today across all trackers.
 */
export const calculateTodayVolume = (trackers: Tracker[]): number => {
    return trackers.reduce((total, tracker) => total + tracker.count, 0);
};

/**
 * Calculates the total volume of work done in the last 7 days (inclusive of today).
 */
export const calculate7DayVolume = (trackers: Tracker[], history: HistoryRecord[]): number => {
    const todayVolume = calculateTodayVolume(trackers);
    const today = getTodayString();

    // Get last 6 days from history
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const splitDate = sevenDaysAgo.toISOString().split('T')[0];

    const historyVolume = history.filter(record => {
        return record.date >= splitDate && record.date < today;
    }).reduce((total, record) => total + record.totalVolume, 0);

    return todayVolume + historyVolume;
};

/**
 * Calculates the total volume of work done in the last 14 days (inclusive of today).
 */
export const calculate14DayVolume = (trackers: Tracker[], history: HistoryRecord[]): number => {
    const todayVolume = calculateTodayVolume(trackers);
    const today = getTodayString();

    // Get last 13 days from history
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    const splitDate = fourteenDaysAgo.toISOString().split('T')[0];

    const historyVolume = history.filter(record => {
        return record.date >= splitDate && record.date < today;
    }).reduce((total, record) => total + record.totalVolume, 0);

    return todayVolume + historyVolume;
};

/**
 * Calculates the total volume of work done in the last 30 days (inclusive of today).
 */
export const calculate30DayVolume = (trackers: Tracker[], history: HistoryRecord[]): number => {
    const todayVolume = calculateTodayVolume(trackers);
    const today = getTodayString();

    // Get last 29 days from history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const splitDate = thirtyDaysAgo.toISOString().split('T')[0];

    const historyVolume = history.filter(record => {
        return record.date >= splitDate && record.date < today;
    }).reduce((total, record) => total + record.totalVolume, 0);

    return todayVolume + historyVolume;
};

/**
 * Calculates the percentage change in work volume from yesterday to today.
 * Returns null if there was no work yesterday.
 */
export const calculateDailyMomentum = (trackers: Tracker[], history: HistoryRecord[]): number | null => {
    const todayVolume = calculateTodayVolume(trackers);
    const today = getTodayString();

    // Find yesterday's record
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    const yesterdayRecord = history.find(r => r.date === yesterdayString);
    const yesterdayVolume = yesterdayRecord ? yesterdayRecord.totalVolume : 0;

    if (yesterdayVolume === 0) {
        return todayVolume > 0 ? 100 : 0; // If yesterday was 0 and today is > 0, treat as 100% improvement or infinite? 
        // Let's settle on: if yesterday 0, today > 0, it's a fresh start, maybe just return null or handle in UI?
        // Prompt asks for "higher or lower". 
        // If yesterday 0, today 5 -> Higher.
        // If yesterday 0, today 0 -> Same.
        // Let's return the difference percentage.
        // If yesterday is 0, we can't divide by 0. 
        // Let's return a simple indicator or special value.
        // Actually, returning the *percentage change* is standard.
        // (Today - Yesterday) / Yesterday * 100
    }

    return ((todayVolume - yesterdayVolume) / yesterdayVolume) * 100;
};

/**
 * Logic to determine if momentum is "up", "down", or "stable".
 */
export const getMomentumDirection = (todayVolume: number, yesterdayVolume: number): 'up' | 'down' | 'equal' => {
    if (todayVolume > yesterdayVolume) return 'up';
    if (todayVolume < yesterdayVolume) return 'down';
    return 'equal';
};

/**
 * Calculates the effort split (percentage of total work) for each tracker.
 * Returns an array sorted by percentage descending.
 */
export const calculateEffortSplit = (trackers: Tracker[]): { name: string; percentage: number; count: number }[] => {
    const totalVolume = calculateTodayVolume(trackers);
    if (totalVolume === 0) return [];

    return trackers
        .map(tracker => ({
            name: tracker.name,
            percentage: Math.round((tracker.count / totalVolume) * 100),
            count: tracker.count
        }))
        .sort((a, b) => b.percentage - a.percentage);
};
