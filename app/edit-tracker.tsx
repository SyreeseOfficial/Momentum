import React from 'react';
import { Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrackers } from '../src/context/TrackerContext';
import { useAppTheme } from '../src/context/ThemeContext';
import { TrackerForm } from '../src/components/TrackerForm';

export default function EditTrackerScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { trackers, editTracker } = useTrackers();
    const theme = useAppTheme();

    const tracker = trackers.find(t => t.id === id);
    if (!tracker) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
                <Text style={{ color: theme.colors.text, padding: 16 }}>Tracker not found.</Text>
            </SafeAreaView>
        );
    }

    return (
        <TrackerForm
            title="Edit Tracker"
            saveLabel="Save Changes"
            initialValues={{
                name: tracker.name,
                goal: String(tracker.dailyGoal),
                emoji: tracker.emoji ?? '',
                trackerType: tracker.trackerType,
                timerIncrement: String(tracker.timerIncrement ?? 30),
            }}
            onSave={({ name, effectiveGoal, emoji, trackerType, timerIncrement }) => {
                editTracker(id, { name, dailyGoal: effectiveGoal, emoji, trackerType, timerIncrement });
                router.back();
            }}
            onCancel={() => router.back()}
        />
    );
}
