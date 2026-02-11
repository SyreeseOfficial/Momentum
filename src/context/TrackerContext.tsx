import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Tracker, HistoryLog } from '../types';

interface TrackerContextType {
    trackers: Tracker[];
    history: HistoryLog;
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

    const addTracker = (name: string, dailyGoal: number) => {
        const newTracker: Tracker = {
            id: Date.now().toString(),
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
