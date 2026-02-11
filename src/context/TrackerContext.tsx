import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tracker, HistoryLog } from '../types';
import { saveData, loadData } from '../utils/storage';
import { checkAndResetDailyCounts } from '../utils/dateLogic';

interface TrackerContextType {
    trackers: Tracker[];
    history: HistoryLog;
    isLoading: boolean;
    addTracker: (name: string, dailyGoal: number) => void;
    incrementTracker: (id: string) => void;
    decrementTracker: (id: string) => void;
    deleteTracker: (id: string) => void;
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

    // Load data on mount
    useEffect(() => {
        const load = async () => {
            try {
                const loadedTrackers = await loadData<Tracker[]>('trackers') || [];
                const loadedHistory = await loadData<HistoryLog>('history') || [];
                const loadedDate = await loadData<string>('lastActiveDate') || '';

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
            }}
        >
            {children}
        </TrackerContext.Provider>
    );
};
