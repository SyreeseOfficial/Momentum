import { Tracker, HistoryRecord, EnergyEntry, EnergyLevel } from '../types';
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

export const calculateTrackerTrend = (data: number[]): 'up' | 'down' | 'flat' => {
    const n = data.length;
    if (n < 3) return 'flat';
    const sumX = data.reduce((s, _, i) => s + i, 0);
    const sumY = data.reduce((s, v) => s + v, 0);
    const sumXY = data.reduce((s, v, i) => s + i * v, 0);
    const sumX2 = data.reduce((s, _, i) => s + i * i, 0);
    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return 'flat';
    const slope = (n * sumXY - sumX * sumY) / denom;
    if (slope > 0.15) return 'up';
    if (slope < -0.15) return 'down';
    return 'flat';
};

export const calculateVarianceScore = (
    trackers: Tracker[],
    history: HistoryRecord[],
    days = 30
): { overall: number; perTracker: { name: string; score: number }[] } => {
    const today = getTodayString();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    const splitDate = cutoff.toISOString().split('T')[0];
    const relevantHistory = history.filter(r => r.date >= splitDate && r.date < today);

    const scoreTracker = (tracker: Tracker) => {
        const counts: number[] = [];
        for (let i = days - 1; i >= 1; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const record = relevantHistory.find(r => r.date === dateStr);
            const detail = record?.details.find(d => d.trackerName === tracker.name);
            counts.push(detail?.count ?? 0);
        }
        counts.push(tracker.count);

        const nonZeroCounts = counts.filter(c => c > 0);
        if (nonZeroCounts.length < 2) return nonZeroCounts.length === 0 ? 0 : 50;

        const mean = nonZeroCounts.reduce((s, v) => s + v, 0) / nonZeroCounts.length;
        if (mean === 0) return 0;
        const variance = nonZeroCounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / nonZeroCounts.length;
        const stddev = Math.sqrt(variance);
        const cv = stddev / mean; // coefficient of variation
        return Math.round(Math.max(0, 100 - cv * 100));
    };

    const active = trackers.filter(t => t.isActive && !t.isArchived);
    const perTracker = active.map(t => ({ name: t.name, score: scoreTracker(t) }));
    const overall = perTracker.length > 0
        ? Math.round(perTracker.reduce((s, t) => s + t.score, 0) / perTracker.length)
        : 0;

    return { overall, perTracker };
};

export const calculateCorrelationMatrix = (
    trackers: Tracker[],
    history: HistoryRecord[],
    days = 30
): { names: string[]; matrix: number[][] } => {
    const active = trackers.filter(t => t.isActive && !t.isArchived).slice(0, 6);
    if (active.length < 2) return { names: [], matrix: [] };

    const today = getTodayString();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (days - 1));
    const splitDate = cutoff.toISOString().split('T')[0];
    const relevantHistory = history.filter(r => r.date >= splitDate && r.date < today);

    const trackerCounts = active.map(tracker => {
        const counts: number[] = [];
        for (let i = days - 1; i >= 1; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const record = relevantHistory.find(r => r.date === dateStr);
            const detail = record?.details.find(d => d.trackerName === tracker.name);
            counts.push(detail?.count ?? 0);
        }
        counts.push(tracker.count);
        return counts;
    });

    const pearson = (a: number[], b: number[]): number => {
        const n = a.length;
        const meanA = a.reduce((s, v) => s + v, 0) / n;
        const meanB = b.reduce((s, v) => s + v, 0) / n;
        const num = a.reduce((s, v, i) => s + (v - meanA) * (b[i] - meanB), 0);
        const denA = Math.sqrt(a.reduce((s, v) => s + Math.pow(v - meanA, 2), 0));
        const denB = Math.sqrt(b.reduce((s, v) => s + Math.pow(v - meanB, 2), 0));
        if (denA === 0 || denB === 0) return 0;
        return Math.round((num / (denA * denB)) * 100) / 100;
    };

    const matrix = trackerCounts.map((a, i) =>
        trackerCounts.map((b, j) => i === j ? 1 : pearson(a, b))
    );

    return { names: active.map(t => t.name), matrix };
};

export const calculateMilestones = (
    trackers: Tracker[],
    history: HistoryRecord[],
    currentStreak: number
): { streakMilestone: number | null; daysToStreak: number; volumeMilestone: number | null; actionsToVolume: number } => {
    const allTimeVolume = history.reduce((s, r) => s + r.totalVolume, 0) + calculateTodayVolume(trackers);

    const streakMilestones = [7, 14, 30, 60, 100, 365];
    const nextStreakMilestone = streakMilestones.find(m => m > currentStreak) ?? null;

    const volumeMilestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
    const nextVolumeMilestone = volumeMilestones.find(m => m > allTimeVolume) ?? null;

    return {
        streakMilestone: nextStreakMilestone,
        daysToStreak: nextStreakMilestone ? nextStreakMilestone - currentStreak : 0,
        volumeMilestone: nextVolumeMilestone,
        actionsToVolume: nextVolumeMilestone ? nextVolumeMilestone - allTimeVolume : 0,
    };
};

export const calculateEnergyStats = (
    energyLog: EnergyEntry[],
    history: HistoryRecord[],
    trackers: Tracker[]
) => {
    const today = getTodayString();
    const todayEntry = energyLog.find(e => e.date === today);

    const buildDates = (n: number) => Array.from({ length: n }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (n - 1 - i));
        return d.toISOString().split('T')[0];
    });

    const last7 = buildDates(7);
    const last30 = buildDates(30);

    const getLevel = (date: string): EnergyLevel | null =>
        energyLog.find(e => e.date === date)?.level ?? null;

    const avgOf = (dates: string[]) => {
        const vals = dates.map(getLevel).filter(Boolean) as number[];
        return vals.length > 0 ? +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : null;
    };

    const history7 = last7.map(date => ({ date, level: getLevel(date) }));

    const entries30 = last30.map(date => ({ date, level: getLevel(date) })).filter(e => e.level !== null) as { date: string; level: EnergyLevel }[];

    const levelCounts = ([1, 2, 3, 4, 5] as EnergyLevel[]).map(l => ({
        level: l,
        count: entries30.filter(e => e.level === l).length,
    }));
    const mostCommonLevel = entries30.length > 0
        ? levelCounts.reduce((best, l) => l.count > best.count ? l : best).level
        : null;

    // Energy vs volume correlation
    const paired = entries30.map(e => {
        const vol = e.date === today
            ? trackers.reduce((s, t) => s + t.count, 0)
            : history.find(h => h.date === e.date)?.totalVolume ?? null;
        return vol !== null ? { energy: e.level, volume: vol } : null;
    }).filter(Boolean) as { energy: number; volume: number }[];

    let energyVolumeCorrelation: number | null = null;
    if (paired.length >= 3) {
        const n = paired.length;
        const mE = paired.reduce((s, p) => s + p.energy, 0) / n;
        const mV = paired.reduce((s, p) => s + p.volume, 0) / n;
        const num = paired.reduce((s, p) => s + (p.energy - mE) * (p.volume - mV), 0);
        const dE = Math.sqrt(paired.reduce((s, p) => s + Math.pow(p.energy - mE, 2), 0));
        const dV = Math.sqrt(paired.reduce((s, p) => s + Math.pow(p.volume - mV, 2), 0));
        if (dE > 0 && dV > 0) energyVolumeCorrelation = Math.round((num / (dE * dV)) * 100) / 100;
    }

    // Volume by energy level (average volume on each energy level day)
    const volumeByLevel = ([1, 2, 3, 4, 5] as EnergyLevel[]).map(level => {
        const dayVols = paired.filter(p => p.energy === level).map(p => p.volume);
        return {
            level,
            avgVolume: dayVols.length > 0 ? Math.round(dayVols.reduce((s, v) => s + v, 0) / dayVols.length) : null,
            count: dayVols.length,
        };
    });

    return {
        todayLevel: todayEntry?.level ?? null,
        avg7: avgOf(last7),
        avg30: avgOf(last30),
        history7,
        mostCommonLevel,
        energyVolumeCorrelation,
        volumeByLevel,
        totalLogged: entries30.length,
    };
};
