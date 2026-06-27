import { Achievement, AchievementId } from '../types';

export const ACHIEVEMENTS: Record<AchievementId, Omit<Achievement, 'unlockedAt'>> = {
    first_tracker: { id: 'first_tracker', name: 'First Step', description: 'Create your first tracker', icon: '🎯' },
    first_goal: { id: 'first_goal', name: 'Goal Getter', description: 'Hit a daily goal for the first time', icon: '✓' },
    first_week: { id: 'first_week', name: 'Week Warrior', description: 'Complete your first full week', icon: '📅' },
    streak_7: { id: 'streak_7', name: '7-Day Streak', description: 'Maintain a 7-day streak', icon: '🔥' },
    streak_30: { id: 'streak_30', name: 'Month Master', description: 'Maintain a 30-day streak', icon: '🌟' },
    streak_100: { id: 'streak_100', name: 'Century Club', description: 'Maintain a 100-day streak', icon: '💯' },
    actions_100: { id: 'actions_100', name: 'Century of Actions', description: 'Complete 100 total actions', icon: '🚀' },
    actions_500: { id: 'actions_500', name: '500 Club', description: 'Complete 500 total actions', icon: '⚡' },
    actions_1000: { id: 'actions_1000', name: 'Unstoppable', description: 'Complete 1000 total actions', icon: '👑' },
    perfect_week: { id: 'perfect_week', name: 'Perfect Week', description: 'Hit all goals for 7 consecutive days', icon: '✨' },
    perfect_month: { id: 'perfect_month', name: 'Perfect Month', description: 'Hit all goals for 30 consecutive days', icon: '🏆' },
    consistency_75: { id: 'consistency_75', name: 'Consistent Pro', description: 'Achieve 75+ consistency score', icon: '💪' },
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

const CONDITIONS: Record<AchievementId, (ctx: DetectionContext) => boolean> = {
    first_tracker: ctx => ctx.trackers.some(t => t.isActive),
    first_goal: ctx => ctx.trackers.some(t => t.isActive && t.count >= t.dailyGoal),
    first_week: ctx => ctx.history.length >= 7,
    streak_7: ctx => ctx.currentStreak >= 7,
    streak_30: ctx => ctx.currentStreak >= 30,
    streak_100: ctx => ctx.currentStreak >= 100,
    actions_100: ctx => ctx.totalVolume >= 100,
    actions_500: ctx => ctx.totalVolume >= 500,
    actions_1000: ctx => ctx.totalVolume >= 1000,
    perfect_week: ctx => ctx.currentStreak >= 7,
    perfect_month: ctx => ctx.currentStreak >= 30,
    consistency_75: ctx => ctx.consistencyScore >= 75,
};

export const detectNewAchievements = (context: DetectionContext): AchievementId[] =>
    (Object.keys(CONDITIONS) as AchievementId[])
        .filter(id => !context.unlockedAchievements.includes(id) && CONDITIONS[id](context));

export const getAchievementById = (id: AchievementId): Achievement | null => {
    const ach = ACHIEVEMENTS[id];
    return ach ? { ...ach, unlockedAt: new Date().toISOString() } : null;
};
