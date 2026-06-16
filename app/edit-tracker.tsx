import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrackers } from '../src/context/TrackerContext';
import { useAppTheme } from '../src/context/ThemeContext';
import { Theme } from '../src/constants/theme';
import { TrackerType } from '../src/types';

const QUICK_EMOJIS = ['💧', '🏃', '📚', '💪', '🧘', '✍️', '🎯', '💡', '🌱', '🔥'];

const TRACKER_TYPES: { type: TrackerType; label: string; desc: string }[] = [
    { type: 'count', label: 'Count', desc: 'Tap to increment a number' },
    { type: 'boolean', label: 'Yes/No', desc: 'Did I do it today?' },
    { type: 'negative', label: 'Limit', desc: 'Stay under a daily max' },
    { type: 'timer', label: 'Timer', desc: 'Track minutes spent' },
];

export default function EditTrackerScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { trackers, editTracker } = useTrackers();
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const tracker = trackers.find(t => t.id === id);

    const [name, setName] = useState(tracker?.name ?? '');
    const [goal, setGoal] = useState(String(tracker?.dailyGoal ?? ''));
    const [emoji, setEmoji] = useState(tracker?.emoji ?? '');
    const [trackerType, setTrackerType] = useState<TrackerType>(tracker?.trackerType ?? 'count');
    const [timerIncrement, setTimerIncrement] = useState(String(tracker?.timerIncrement ?? 30));

    if (!tracker) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={{ color: theme.colors.text, padding: 16 }}>Tracker not found.</Text>
            </SafeAreaView>
        );
    }

    const isBoolean = trackerType === 'boolean';
    const isTimer = trackerType === 'timer';
    const isNegative = trackerType === 'negative';
    const goalLabel = isTimer ? 'Daily Goal (minutes)' : isNegative ? 'Daily Limit' : isBoolean ? undefined : 'Daily Goal';

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Please enter a tracker name.');
            return;
        }
        const effectiveGoal = isBoolean ? 1 : parseInt(goal, 10);
        if (!isBoolean && (isNaN(effectiveGoal) || effectiveGoal <= 0)) {
            Alert.alert('Validation Error', 'Please enter a valid goal.');
            return;
        }
        editTracker(id, {
            name: name.trim(),
            dailyGoal: effectiveGoal,
            emoji: emoji.trim() || undefined,
            trackerType,
            timerIncrement: isTimer ? parseInt(timerIncrement, 10) || 30 : undefined,
        });
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Edit Tracker</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Tracker Type</Text>
                    <View style={styles.typeGrid}>
                        {TRACKER_TYPES.map(t => (
                            <TouchableOpacity
                                key={t.type}
                                style={[styles.typeCard, trackerType === t.type && styles.typeCardSelected]}
                                onPress={() => setTrackerType(t.type)}
                            >
                                <Text style={[styles.typeLabel, trackerType === t.type && styles.typeLabelSelected]}>{t.label}</Text>
                                <Text style={styles.typeDesc}>{t.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Tracker Name</Text>
                    <TextInput style={styles.input} placeholder="e.g. Drink Water" placeholderTextColor={theme.colors.secondary} value={name} onChangeText={setName} autoFocus />
                </View>

                {!isBoolean && (
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>{goalLabel}</Text>
                        <TextInput style={styles.input} placeholder={isTimer ? 'e.g. 60' : 'e.g. 8'} placeholderTextColor={theme.colors.secondary} value={goal} onChangeText={setGoal} keyboardType="numeric" />
                    </View>
                )}

                {isTimer && (
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Minutes per tap</Text>
                        <TextInput style={styles.input} placeholder="30" placeholderTextColor={theme.colors.secondary} value={timerIncrement} onChangeText={setTimerIncrement} keyboardType="numeric" />
                    </View>
                )}

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Emoji <Text style={styles.optional}>(optional)</Text></Text>
                    <View style={styles.emojiRow}>
                        <TextInput style={[styles.input, styles.emojiInput]} placeholder="💧" placeholderTextColor={theme.colors.secondary} value={emoji} onChangeText={t => setEmoji(t.slice(0, 2))} />
                        {emoji ? <TouchableOpacity onPress={() => setEmoji('')} style={styles.clearEmoji}><Text style={styles.clearEmojiText}>✕</Text></TouchableOpacity> : null}
                    </View>
                    <View style={styles.quickEmojis}>
                        {QUICK_EMOJIS.map(e => (
                            <TouchableOpacity key={e} style={[styles.emojiChip, emoji === e && styles.emojiChipSelected]} onPress={() => setEmoji(emoji === e ? '' : e)}>
                                <Text style={styles.emojiChipText}>{e}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function createStyles(theme: Theme) { return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.m, paddingBottom: 60 },
    title: { fontSize: theme.fontSizes.xl, fontWeight: 'bold', color: theme.colors.primary, marginBottom: theme.spacing.xl, marginTop: theme.spacing.m },
    formGroup: { marginBottom: theme.spacing.l },
    label: { fontSize: theme.fontSizes.m, color: theme.colors.secondary, marginBottom: theme.spacing.s },
    optional: { fontSize: theme.fontSizes.s, opacity: 0.6 },
    input: { backgroundColor: theme.colors.surface, color: theme.colors.primary, padding: theme.spacing.m, borderRadius: 8, fontSize: theme.fontSizes.m, borderWidth: 1, borderColor: '#333' },
    typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s },
    typeCard: { flex: 1, minWidth: '45%', backgroundColor: theme.colors.surface, borderRadius: 10, padding: theme.spacing.m, borderWidth: 1, borderColor: '#333' },
    typeCardSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent + '20' },
    typeLabel: { fontSize: theme.fontSizes.m, fontWeight: '600', color: theme.colors.text, marginBottom: 2 },
    typeLabelSelected: { color: theme.colors.accent },
    typeDesc: { fontSize: 11, color: theme.colors.secondary },
    emojiRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.s },
    emojiInput: { width: 80, textAlign: 'center', fontSize: 24 },
    clearEmoji: { padding: theme.spacing.s },
    clearEmojiText: { color: theme.colors.secondary, fontSize: 16 },
    quickEmojis: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.s, marginTop: theme.spacing.m },
    emojiChip: { backgroundColor: theme.colors.surface, borderRadius: 8, padding: theme.spacing.s, borderWidth: 1, borderColor: '#333' },
    emojiChipSelected: { borderColor: theme.colors.accent, backgroundColor: theme.colors.accent + '20' },
    emojiChipText: { fontSize: 22 },
    buttonContainer: { flexDirection: 'row', marginTop: theme.spacing.l, gap: theme.spacing.m },
    saveButton: { flex: 1, backgroundColor: theme.colors.accent, padding: theme.spacing.m, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: '#FFFFFF', fontSize: theme.fontSizes.m, fontWeight: 'bold' },
    cancelButton: { flex: 1, padding: theme.spacing.m, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.secondary },
    cancelButtonText: { color: theme.colors.secondary, fontSize: theme.fontSizes.m, fontWeight: '600' },
}); }
