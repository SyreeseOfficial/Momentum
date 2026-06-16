import { Achievement, AchievementId } from '../types';

export const ACHIEVEMENTS: Record<AchievementId, Omit<Achievement, 'unlockedAt'>> = {
    first_tracker: {
        id: 'first_tracker',
        name: 'First Step',
        description: 'Create your first tracker',
        icon: '🎯',
    },
    first_goal: {
        id: 'first_goal',
        name: 'Goal Getter',
        description: 'Hit a daily goal for the first time',
        icon: '✓',
    },
    first_week: {
        id: 'first_week',
        name: 'Week Warrior',
        description: 'Complete your first full week',
        icon: '📅',
    },
    streak_7: {
        id: 'streak_7',
        name: '7-Day Streak',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
    },
    streak_30: {
        id: 'streak_30',
        name: 'Month Master',
        description: 'Maintain a 30-day streak',
        icon: '🌟',
    },
    streak_100: {
        id: 'streak_100',
        name: 'Century Club',
        description: 'Maintain a 100-day streak',
        icon: '💯',
    },
    actions_100: {
        id: 'actions_100',
        name: 'Century of Actions',
        description: 'Complete 100 total actions',
        icon: '🚀',
    },
    actions_500: {
        id: 'actions_500',
        name: '500 Club',
        description: 'Complete 500 total actions',
        icon: '⚡',
    },
    actions_1000: {
        id: 'actions_1000',
        name: 'Unstoppable',
        description: 'Complete 1000 total actions',
        icon: '👑',
    },
    perfect_week: {
        id: 'perfect_week',
        name: 'Perfect Week',
        description: 'Hit all goals for 7 consecutive days',
        icon: '✨',
    },
    perfect_month: {
        id: 'perfect_month',
        name: 'Perfect Month',
        description: 'Hit all goals for 30 consecutive days',
        icon: '🏆',
    },
    consistency_75: {
        id: 'consistency_75',
        name: 'Consistent Pro',
        description: 'Achieve 75+ consistency score',
        icon: '💪',
    },
};

interface DetectionContext {
    trackers: any[];
    history: any[];
    currentStreak: number;
    totalVolume: number;
    goalCompletionRate: number | null;
    consistencyScore: number;
    unlockedAchievements: AchievementId[];
}

export const detectNewAchievements = (context: DetectionContext): AchievementId[] => {
    const newAchievements: AchievementId[] = [];
    const { trackers, history, currentStreak, totalVolume, goalCompletionRate, consistencyScore, unlockedAchievements } = context;

    // first_tracker: at least one tracker exists
    if (
        !unlockedAchievements.includes('first_tracker') &&
        trackers.some(t => t.isActive)
    ) {
        newAchievements.push('first_tracker');
    }

    // first_goal: at least one tracker hit goal today
    if (
        !unlockedAchievements.includes('first_goal') &&
        trackers.some(t => t.isActive && t.count >= t.dailyGoal)
    ) {
        newAchievements.push('first_goal');
    }

    // first_week: history has 7+ days with entries
    if (
        !unlockedAchievements.includes('first_week') &&
        history.length >= 7
    ) {
        newAchievements.push('first_week');
    }

    // streak_7
    if (
        !unlockedAchievements.includes('streak_7') &&
        currentStreak >= 7
    ) {
        newAchievements.push('streak_7');
    }

    // streak_30
    if (
        !unlockedAchievements.includes('streak_30') &&
        currentStreak >= 30
    ) {
        newAchievements.push('streak_30');
    }

    // streak_100
    if (
        !unlockedAchievements.includes('streak_100') &&
        currentStreak >= 100
    ) {
        newAchievements.push('streak_100');
    }

    // actions_100
    if (
        !unlockedAchievements.includes('actions_100') &&
        totalVolume >= 100
    ) {
        newAchievements.push('actions_100');
    }

    // actions_500
    if (
        !unlockedAchievements.includes('actions_500') &&
        totalVolume >= 500
    ) {
        newAchievements.push('actions_500');
    }

    // actions_1000
    if (
        !unlockedAchievements.includes('actions_1000') &&
        totalVolume >= 1000
    ) {
        newAchievements.push('actions_1000');
    }

    // perfect_week: 7 consecutive perfect days (checked from streak logic)
    if (
        !unlockedAchievements.includes('perfect_week') &&
        currentStreak >= 7
    ) {
        // This is a proxy: if streak >= 7, they've had 7 perfect days
        newAchievements.push('perfect_week');
    }

    // perfect_month: 30 consecutive perfect days
    if (
        !unlockedAchievements.includes('perfect_month') &&
        currentStreak >= 30
    ) {
        newAchievements.push('perfect_month');
    }

    // consistency_75
    if (
        !unlockedAchievements.includes('consistency_75') &&
        consistencyScore >= 75
    ) {
        newAchievements.push('consistency_75');
    }

    return newAchievements;
};

export const getAchievementById = (id: AchievementId): Achievement | null => {
    const ach = ACHIEVEMENTS[id];
    return ach ? { ...ach, unlockedAt: new Date().toISOString() } : null;
};
