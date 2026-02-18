import { useMemo } from 'react';
import { useTrackers } from '../context/TrackerContext';
import { HistoryRecord } from '../types';
import { parseISO, subDays, isSameDay, format, startOfDay } from 'date-fns';

export const useStreaks = () => {
    const { history, trackers } = useTrackers();

    const stats = useMemo(() => {
        // Sort history by date descending (newest first)
        const sortedHistory = [...history].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // 1. Calculate Current Streak
        let currentStreak = 0;
        const today = new Date();
        const yesterday = subDays(today, 1);

        // Check today's status
        const activeTrackers = trackers.filter(t => t.isActive);
        const isTodayPerfect = activeTrackers.length > 0 && activeTrackers.every(t => t.count >= t.dailyGoal);

        // If today is perfect, streak includes today. 
        // If not, we check if yesterday was perfect to see if streak is "alive" (but not incremented for today yet).
        // Actually, "Current Streak" usually means "consecutive days ending yesterday or today".
        // If I did it yesterday, I have a streak of 1. If I do it today, it becomes 2.
        // If I missed yesterday, streak is 0.

        // Let's look for the most recent perfect day.
        // It must be Today or Yesterday to maintain a streak.

        let streakStartDate: Date | null = null;

        // Check if history has a record for today (unlikely with current logic, but possible)
        // or check live trackers for today.

        let pointerDate = startOfDay(today);
        let streakBroken = false;

        // First, check if today is perfect from live data
        if (isTodayPerfect) {
            currentStreak++;
            pointerDate = subDays(pointerDate, 1);
        } else {
            // If today is not perfect, we check if yesterday was perfect.
            // If yesterday is not perfect either, streak is 0.
            // But we need to verify against history.
        }

        // Iterate backwards through history to add to streak
        // We need to match pointerDate

        for (let i = 0; pointerDate; i++) {
            // Find record for pointerDate
            const dateStr = format(pointerDate, 'yyyy-MM-dd'); // Matches getTodayString format? 
            // Wait, getTodayString uses 'yyyy-MM-dd' (e.g. 2023-01-01)
            // History record date is ISO string full? types says "ISO string" but often stripped.
            // Let's check dateLogic.ts: getTodayString returns "year-month-day".
            // Context loads it.

            // In dateLogic, getTodayString returns 'YYYY-MM-DD'.
            // In TrackerContext, we save using lastActiveDate which is from getTodayString().
            // History records use this date.

            // So we should compare YYYY-MM-DD strings.
            const pointerDateStr = format(pointerDate, 'yyyy-MM-dd');

            const record = sortedHistory.find(h => h.date === pointerDateStr);

            if (record) {
                // Check if this record was perfect
                // A record is perfect if all tracked items in it met their goals.
                const isRecordPerfect = record.details.length > 0 && record.details.every(d => d.count >= d.goal);

                if (isRecordPerfect) {
                    currentStreak++;
                    pointerDate = subDays(pointerDate, 1);
                    continue;
                }
            }

            // If we are checking Today and it wasn't valid (already handled above), pass.
            // If we are checking Yesterday and it wasn't in history OR wasn't perfect...
            // wait. If today is NOT perfect, we haven't incremented currentStreak.
            // We check yesterday. If yesterday is perfect, streak is valid. 
            // If yesterday is NOT perfect, streak is 0.

            // Refined Logic:
            // 1. List all "perfect dates".
            // 2. See if today or yesterday is a perfect date.
            // 3. Count backwards consecutive perfect dates.

            break; // Stop if not found or not perfect
        }

        // Re-implementing simplified logic:
        const perfectDates = new Set<string>();

        // Add today if perfect
        if (isTodayPerfect) {
            perfectDates.add(format(today, 'yyyy-MM-dd'));
        }

        // Add perfect days from history
        sortedHistory.forEach(h => {
            if (h.details.length > 0 && h.details.every(d => d.count >= d.goal)) {
                perfectDates.add(h.date);
            }
        });

        let tempCurrentStreak = 0;
        let checkDate = startOfDay(today);

        // If today is not perfect, we allow the streak to start from yesterday
        if (!perfectDates.has(format(checkDate, 'yyyy-MM-dd'))) {
            checkDate = subDays(checkDate, 1);
        }

        // Now count backwards
        while (perfectDates.has(format(checkDate, 'yyyy-MM-dd'))) {
            tempCurrentStreak++;
            checkDate = subDays(checkDate, 1);
        }

        currentStreak = tempCurrentStreak;


        // 2. Calculate Best Streak
        // Sort all perfect dates
        const sortedPerfectDates = Array.from(perfectDates).sort();

        let maxStreak = 0;
        let tempStreak = 0;
        let prevDate: Date | null = null;

        sortedPerfectDates.forEach(dateStr => {
            const currentDate = parseISO(dateStr); // 'yyyy-MM-dd' parses correctly? Yes
            // wait, parseISO expects ISO format. 'yyyy-MM-dd' is partial. 
            // new Date('yyyy-mm-dd') works usually but timezone issues.
            // Best to use parse from date-fns or manually.
            // given format is yyyy-MM-dd, we can append T00:00:00 to be safe or use string comparison?
            // Actually, since we sorted strings, we can just step through.

            if (!prevDate) {
                tempStreak = 1;
            } else {
                // Check if current is 1 day after prev
                const diff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
                if (Math.round(diff) === 1) {
                    tempStreak++;
                } else {
                    tempStreak = 1;
                }
            }
            if (tempStreak > maxStreak) maxStreak = tempStreak;
            prevDate = currentDate;
        });

        return {
            currentStreak,
            bestStreak: Math.max(currentStreak, maxStreak)
        };

    }, [history, trackers]);

    return stats;
};
