import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tracker, HistoryLog, HistoryRecord } from '../types';
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
    addTracker: (name: string, dailyGoal: number) => void;
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

    // Load data on mount
    useEffect(() => {
        const load = async () => {
            try {
                const loadedTrackers = await loadData<Tracker[]>('trackers') || [];
                const loadedHistory = await loadData<HistoryLog>('history') || [];
                const loadedDate = await loadData<string>('lastActiveDate') || '';
                const loadedNotificationEnabled = await loadData<boolean>('notificationEnabled') || false;
                const loadedNotificationTime = await loadData<string>('notificationTime');

                setNotificationEnabled(loadedNotificationEnabled);
                if (loadedNotificationTime) {
                    setNotificationTime(new Date(loadedNotificationTime));
                }

                const result = checkAndResetDailyCounts(loadedTrackers, loadedDate, loadedHistory);

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

    // Save data whenever trackers or history changes
    useEffect(() => {
        if (!isLoading) {
            saveData('trackers', trackers);
            saveData('history', history);
        }
    }, [trackers, history, isLoading]);

    const addTracker = (name: string, dailyGoal: number) => {
        const newTracker: Tracker = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            count: 0,
            dailyGoal,
            sortOrder: trackers.length,
            isActive: true,
        };
        setTrackers((prev) => [...prev, newTracker]);
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

    return (
        <TrackerContext.Provider
            value={{
                trackers,
                history,
                isLoading,
                addTracker,
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
            }}
        >
            {children}
        </TrackerContext.Provider>
    );
};
