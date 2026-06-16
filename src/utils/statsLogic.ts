import { Tracker, HistoryRecord } from '../types';
import { getTodayString } from './dateLogic';

export const calculateTodayVolume = (trackers: Tracker[]): number => {
    return trackers.reduce((total, tracker) => total + tracker.count, 0);
};

export const calculate7DayVolume = (trackers: Tracker[], history: HistoryRecord[]): number => {
    const todayVolume = calculateTodayVolume(trackers);
    const today = getTodayString();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const splitDate = sevenDaysAgo.toISOString().split('T')[0];
    const historyVolume = history.filter(record => record.date >= splitDate && record.date < today)
        .reduce((total, record) => total + record.totalVolume, 0);
    return todayVolume + historyVolume;
};

export const calculate14DayVolume = (trackers: Tracker[], history: HistoryRecord[]): number => {
    const todayVolume = calculateTodayVolume(trackers);
    const today = getTodayString();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    const splitDate = fourteenDaysAgo.toISOString().split('T')[0];
    const historyVolume = history.filter(record => record.date >= splitDate && record.date < today)
        .reduce((total, record) => total + record.totalVolume, 0);
    return todayVolume + historyVolume;
};

export const calculate30DayVolume = (trackers: Tracker[], history: HistoryRecord[]): number => {
    const todayVolume = calculateTodayVolume(trackers);
    const today = getTodayString();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const splitDate = thirtyDaysAgo.toISOString().split('T')[0];
    const historyVolume = history.filter(record => record.date >= splitDate && record.date < today)
        .reduce((total, record) => total + record.totalVolume, 0);
    return todayVolume + historyVolume;
};

export const calculateDailyMomentum = (trackers: Tracker[], history: HistoryRecord[]): number | null => {
    const todayVolume = calculateTodayVolume(trackers);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    const yesterdayRecord = history.find(r => r.date === yesterdayString);
    const yesterdayVolume = yesterdayRecord ? yesterdayRecord.totalVolume : 0;
    if (yesterdayVolume === 0) {
        return todayVolume > 0 ? 100 : 0;
    }
    return ((todayVolume - yesterdayVolume) / yesterdayVolume) * 100;
};

export const getMomentumDirection = (todayVolume: number, yesterdayVolume: number): 'up' | 'down' | 'equal' => {
    if (todayVolume > yesterdayVolume) return 'up';
    if (todayVolume < yesterdayVolume) return 'down';
    return 'equal';
};

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

export const calculateDailyAverages = (trackers: Tracker[], history: HistoryRecord[]) => {
    const todayVolume = calculateTodayVolume(trackers);
    const today = getTodayString();

    const getAvg = (daysBack: number) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - (daysBack - 1));
        const splitDate = cutoff.toISOString().split('T')[0];
        const historyVolume = history
            .filter(r => r.date >= splitDate && r.date < today)
            .reduce((sum, r) => sum + r.totalVolume, 0);
        return Math.round((todayVolume + historyVolume) / daysBack);
    };

    return {
        avg7: getAvg(7),
        avg14: getAvg(14),
        avg30: getAvg(30),
    };
};

export const calculateBestDay = (trackers: Tracker[], history: HistoryRecord[]): { date: string; volume: number } | null => {
    const today = getTodayString();
    const todayVolume = calculateTodayVolume(trackers);

    let best: { date: string; volume: number } | null = null;

    history.forEach(record => {
        if (!best || record.totalVolume > best.volume) {
            best = { date: record.date, volume: record.totalVolume };
        }
    });

    if (todayVolume > (best?.volume ?? 0)) {
        best = { date: today, volume: todayVolume };
    }

    return best;
};

export const calculateGoalCompletionRate = (trackers: Tracker[], history: HistoryRecord[], days = 30): number | null => {
    const today = getTodayString();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    const splitDate = cutoff.toISOString().split('T')[0];

    const activeTrackers = trackers.filter(t => t.isActive);
    const isTodayComplete = activeTrackers.length > 0 && activeTrackers.every(t => t.count >= t.dailyGoal);

    const relevantHistory = history.filter(r => r.date >= splitDate && r.date < today);
    const perfectHistoryDays = relevantHistory.filter(r =>
        r.details.length > 0 && r.details.every(d => d.count >= d.goal)
    ).length;

    const perfectDays = perfectHistoryDays + (isTodayComplete ? 1 : 0);
    const totalDays = relevantHistory.length + 1; // +1 for today

    if (totalDays === 0) return null;
    return Math.round((perfectDays / totalDays) * 100);
};

export const calculateConsistencyScore = (
    currentStreak: number,
    goalCompletionRate: number | null,
    trackers: Tracker[],
    history: HistoryRecord[]
): number => {
    const rate = goalCompletionRate ?? 0;
    const streakBonus = Math.min(currentStreak * 2, 30); // up to 30 points from streak
    const rateScore = rate * 0.7; // up to 70 points from completion rate
    return Math.min(100, Math.round(rateScore + streakBonus));
};

export const calculatePaceIndicator = (trackers: Tracker[], history: HistoryRecord[]) => {
    const avg7 = calculateDailyAverages(trackers, history).avg7;
    const projectedMonth = avg7 * 30;
    const projectedWeek = avg7 * 7;
    return { projectedWeek, projectedMonth, dailyAvg: avg7 };
};

export const calculateDayOfWeekPatterns = (trackers: Tracker[], history: HistoryRecord[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daySums: number[] = new Array(7).fill(0);
    const dayCounts: number[] = new Array(7).fill(0);

    const today = getTodayString();
    const todayVolume = calculateTodayVolume(trackers);
    const todayDow = new Date().getDay();
    daySums[todayDow] += todayVolume;
    dayCounts[todayDow]++;

    history.filter(r => r.date < today).forEach(record => {
        const dow = new Date(record.date + 'T12:00:00').getDay();
        daySums[dow] += record.totalVolume;
        dayCounts[dow]++;
    });

    const averages = dayNames.map((name, i) => ({
        name,
        avg: dayCounts[i] > 0 ? Math.round(daySums[i] / dayCounts[i]) : 0,
    }));

    const maxAvg = Math.max(...averages.map(d => d.avg), 1);
    return averages.map(d => ({ ...d, normalized: d.avg / maxAvg }));
};

export const calculateWeekComparison = (trackers: Tracker[], history: HistoryRecord[]) => {
    const today = getTodayString();
    const todayVolume = calculateTodayVolume(trackers);

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - 6);
    const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];

    const lastWeekStart = new Date();
    lastWeekStart.setDate(lastWeekStart.getDate() - 13);
    const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0];

    const thisWeekHistory = history.filter(r => r.date >= thisWeekStartStr && r.date < today);
    const lastWeekHistory = history.filter(r => r.date >= lastWeekStartStr && r.date < thisWeekStartStr);

    const thisWeek = thisWeekHistory.reduce((sum, r) => sum + r.totalVolume, 0) + todayVolume;
    const lastWeek = lastWeekHistory.reduce((sum, r) => sum + r.totalVolume, 0);

    const change = lastWeek === 0 ? null : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

    return { thisWeek, lastWeek, change };
};

export const calculateActivityHeatmap = (
    trackers: Tracker[],
    history: HistoryRecord[],
    weeks = 12
): { date: string; volume: number; intensity: number }[] => {
    const today = new Date();
    const todayStr = getTodayString();
    const todayVolume = calculateTodayVolume(trackers);

    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (totalDays - 1));

    // Find max for normalization
    const allVolumes = history.map(r => r.totalVolume);
    if (todayVolume > 0) allVolumes.push(todayVolume);
    const maxVolume = Math.max(...allVolumes, 1);

    const historyMap = new Map(history.map(r => [r.date, r.totalVolume]));
    historyMap.set(todayStr, todayVolume);

    const cells: { date: string; volume: number; intensity: number }[] = [];
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const volume = historyMap.get(dateStr) ?? 0;
        cells.push({ date: dateStr, volume, intensity: volume / maxVolume });
    }

    return cells;
};

export const calculatePerTrackerHistory = (
    trackers: Tracker[],
    history: HistoryRecord[],
    days = 7
): { trackerName: string; data: { date: string; count: number }[] }[] => {
    const today = getTodayString();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    const splitDate = cutoff.toISOString().split('T')[0];

    const relevantHistory = history.filter(r => r.date >= splitDate && r.date < today);

    return trackers
        .filter(t => t.isActive)
        .map(tracker => {
            const data: { date: string; count: number }[] = [];

            for (let i = days - 1; i >= 1; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const record = relevantHistory.find(r => r.date === dateStr);
                const detail = record?.details.find(d => d.trackerName === tracker.name);
                data.push({ date: dateStr, count: detail?.count ?? 0 });
            }

            // Today
            data.push({ date: today, count: tracker.count });

            return { trackerName: tracker.name, data };
        });
};
