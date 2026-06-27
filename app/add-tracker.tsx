import React from 'react';
import { useRouter } from 'expo-router';
import { useTrackers } from '../src/context/TrackerContext';
import { TrackerForm } from '../src/components/TrackerForm';

export default function AddTrackerScreen() {
    const router = useRouter();
    const { addTracker } = useTrackers();

    return (
        <TrackerForm
            title="New Tracker"
            saveLabel="Save Tracker"
            onSave={({ name, effectiveGoal, emoji, trackerType, timerIncrement }) => {
                addTracker(name, effectiveGoal, emoji, trackerType, timerIncrement);
                router.back();
            }}
            onCancel={() => router.back()}
        />
    );
}
