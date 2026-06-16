import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tracker, HistoryLog, HistoryRecord, AchievementId, AppPreferences, DEFAULT_PREFERENCES, EnergyLevel, EnergyLog } from '../types';
import { saveData, loadData, clearAllData as clearStorage } from '../utils/storage';
import { checkAndResetDailyCounts } from '../utils/dateLogic';
import {
    registerForPushNotificationsAsync,
    scheduleDailyReminder,
    cancelAllNotifications
} from '../utils/notifications';

interface TrackerContextType {
    trackers: Tracker[];
    history: HistoryLog;
    isLoading: boolean;
    unlockedAchievements: AchievementId[];
    addTracker: (name: string, dailyGoal: number, emoji?: string) => void;
    editTracker: (id: string, updates: { name: string; dailyGoal: number; emoji?: string }) => void;
    archiveTracker: (id: string) => void;
    unarchiveTracker: (id: string) => void;
    incrementTracker: (id: string) => void;
    decrementTracker: (id: string) => void;
    deleteTracker: (id: string) => void;
    saveHistoryRecord: (record: HistoryRecord) => void;
    deleteHistoryRecord: (date: string) => void;
    clearAllData: () => void;
    notificationEnabled: boolean;
    notificationTime: Date | null;
    toggleNotification: (enabled: boolean) => Promise<void>;
    updateNotificationTime: (date: Date) => Promise<void>;
    resetToday: () => void;
    unlockAchievement: (id: AchievementId) => void;
    preferences: AppPreferences;
    updatePreference: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void;
    factoryReset: () => Promise<void>;
    energyLog: EnergyLog;
    logEnergy: (level: EnergyLevel) => void;
    todayEnergy: EnergyLevel | null;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const useTrackers = () => {
    const context = useContext(TrackerContext);
    if (!context) {
        throw new Error('useTrackers must be used within a TrackerProvider');
    }
    return context;
};

interface TrackerProviderProps {
    children: ReactNode;
}

export const TrackerProvider = ({ children }: TrackerProviderProps) => {
    const [trackers, setTrackers] = useState<Tracker[]>([]);
    const [history, setHistory] = useState<HistoryLog>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [notificationEnabled, setNotificationEnabled] = useState<boolean>(false);
    const [notificationTime, setNotificationTime] = useState<Date | null>(null);
    const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementId[]>([]);
    const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
    const [energyLog, setEnergyLog] = useState<EnergyLog>([]);

    // Load data on mount
    useEffect(() => {
        const load = async () => {
            try {
                const loadedTrackers = await loadData<Tracker[]>('trackers') || [];
                const loadedHistory = await loadData<HistoryLog>('history') || [];
                const loadedDate = await loadData<string>('lastActiveDate') || '';
                const loadedNotificationEnabled = await loadData<boolean>('notificationEnabled') || false;
                const loadedNotificationTime = await loadData<string>('notificationTime');
                const loadedAchievements = await loadData<AchievementId[]>('achievements') || [];
                const loadedPreferences = await loadData<AppPreferences>('preferences') || DEFAULT_PREFERENCES;
                const loadedEnergyLog = await loadData<EnergyLog>('energyLog') || [];

                setNotificationEnabled(loadedNotificationEnabled);
                if (loadedNotificationTime) {
                    setNotificationTime(new Date(loadedNotificationTime));
                }
                setUnlockedAchievements(loadedAchievements);
                setPreferences(loadedPreferences);
                setEnergyLog(loadedEnergyLog);

                const result = checkAndResetDailyCounts(loadedTrackers, loadedDate, loadedHistory, loadedPreferences.dayResetHour);

                if (result) {
                    setTrackers(result.newTrackers);
                    setHistory(result.newHistory);
                    saveData('lastActiveDate', result.newDate);
                } else {
                    setTrackers(loadedTrackers);
                    setHistory(loadedHistory);
                }
            } catch (error) {
                console.error("Failed to load tracker data", error);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Save data whenever trackers, history, or achievements change
    useEffect(() => {
        if (!isLoading) {
            saveData('trackers', trackers);
            saveData('history', history);
            saveData('achievements', unlockedAchievements);
        }
    }, [trackers, history, unlockedAchievements, isLoading]);

    const addTracker = (name: string, dailyGoal: number, emoji?: string) => {
        const newTracker: Tracker = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            count: 0,
            dailyGoal,
            sortOrder: trackers.length,
            isActive: true,
            emoji: emoji || undefined,
        };
        setTrackers((prev) => [...prev, newTracker]);
    };

    const editTracker = (id: string, updates: { name: string; dailyGoal: number; emoji?: string }) => {
        setTrackers(prev =>
            prev.map(t => t.id === id ? { ...t, ...updates } : t)
        );
    };

    const archiveTracker = (id: string) => {
        setTrackers((prev) =>
            prev.map((tracker) =>
                tracker.id === id ? { ...tracker, isArchived: true } : tracker
            )
        );
    };

    const unarchiveTracker = (id: string) => {
        setTrackers((prev) =>
            prev.map((tracker) =>
                tracker.id === id ? { ...tracker, isArchived: false } : tracker
            )
        );
    };

    const incrementTracker = (id: string) => {
        setTrackers((prev) =>
            prev.map((tracker) =>
                tracker.id === id ? { ...tracker, count: tracker.count + 1 } : tracker
            )
        );
    };

    const decrementTracker = (id: string) => {
        setTrackers((prev) =>
            prev.map((tracker) =>
                tracker.id === id ? { ...tracker, count: Math.max(0, tracker.count - 1) } : tracker
            )
        );
    };

    const deleteTracker = (id: string) => {
        setTrackers((prev) => prev.filter((tracker) => tracker.id !== id));
    };

    const saveHistoryRecord = (record: HistoryRecord) => {
        setHistory((prev) => {
            const existingIndex = prev.findIndex((r) => r.date === record.date);
            if (existingIndex >= 0) {
                const newHistory = [...prev];
                newHistory[existingIndex] = record;
                return newHistory;
            } else {
                return [...prev, record];
            }
        });
    };

    const deleteHistoryRecord = (date: string) => {
        setHistory((prev) => prev.filter((record) => record.date !== date));
    };

    const clearAllData = async () => {
        try {
            await clearStorage();
            setTrackers([]);
            setHistory([]);
            setNotificationEnabled(false);
            setNotificationTime(null);
            await cancelAllNotifications();
            saveData('lastActiveDate', ''); // Clear last active date
        } catch (e) {
            console.error("Failed to clear data", e);
        }
    };

    const toggleNotification = async (enabled: boolean) => {
        setNotificationEnabled(enabled);
        saveData('notificationEnabled', enabled);

        if (enabled) {
            await registerForPushNotificationsAsync();
            if (notificationTime) {
                await scheduleDailyReminder(notificationTime);
            } else {
                // Default to 9 AM if no time set
                const now = new Date();
                now.setHours(9, 0, 0, 0);
                setNotificationTime(now);
                saveData('notificationTime', now.toISOString());
                await scheduleDailyReminder(now);
            }
        } else {
            await cancelAllNotifications();
        }
    };

    const updateNotificationTime = async (date: Date) => {
        setNotificationTime(date);
        saveData('notificationTime', date.toISOString());
        if (notificationEnabled) {
            await scheduleDailyReminder(date);
        }
    };

    const resetToday = () => {
        setTrackers((prev) =>
            prev.map((tracker) => ({ ...tracker, count: 0 }))
        );
    };

    const unlockAchievement = (id: AchievementId) => {
        setUnlockedAchievements((prev) => {
            if (!prev.includes(id)) {
                return [...prev, id];
            }
            return prev;
        });
    };

    const updatePreference = <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
        setPreferences(prev => {
            const updated = { ...prev, [key]: value };
            saveData('preferences', updated);
            return updated;
        });
    };

    const factoryReset = async () => {
        try {
            await clearStorage();
            setTrackers([]);
            setHistory([]);
            setNotificationEnabled(false);
            setNotificationTime(null);
            setUnlockedAchievements([]);
            setPreferences(DEFAULT_PREFERENCES);
            setEnergyLog([]);
            await cancelAllNotifications();
            saveData('lastActiveDate', '');
        } catch (e) {
            console.error('Failed to factory reset', e);
        }
    };

    const logEnergy = (level: EnergyLevel) => {
        const today = new Date().toISOString().split('T')[0];
        setEnergyLog(prev => {
            const filtered = prev.filter(e => e.date !== today);
            const updated = [...filtered, { date: today, level }];
            saveData('energyLog', updated);
            return updated;
        });
    };

    const todayEnergy: EnergyLevel | null = (() => {
        const today = new Date().toISOString().split('T')[0];
        return energyLog.find(e => e.date === today)?.level ?? null;
    })();

    return (
        <TrackerContext.Provider
            value={{
                trackers,
                history,
                isLoading,
                unlockedAchievements,
                addTracker,
                editTracker,
                archiveTracker,
                unarchiveTracker,
                incrementTracker,
                decrementTracker,
                deleteTracker,
                saveHistoryRecord,
                deleteHistoryRecord,
                clearAllData,
                notificationEnabled,
                notificationTime,
                toggleNotification,
                updateNotificationTime,
                resetToday,
                unlockAchievement,
                preferences,
                updatePreference,
                factoryReset,
                energyLog,
                logEnergy,
                todayEnergy,
            }}
        >
            {children}
        </TrackerContext.Provider>
    );
};
