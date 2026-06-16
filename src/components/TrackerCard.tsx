import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useTrackers } from '../context/TrackerContext';
import { useAccentColor } from '../hooks/useAccentColor';
import { TrackerType } from '../types';

interface TrackerCardProps {
    name: string;
    count: number;
    goal: number;
    emoji?: string;
    trackerType?: TrackerType;
    timerIncrement?: number;
    onIncrement: () => void;
    onDecrement: () => void;
    onEdit: () => void;
    onArchive: () => void;
    onDelete: () => void;
}

const formatMinutes = (mins: number): string => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const TrackerCard: React.FC<TrackerCardProps> = ({
    name, count, goal, emoji, trackerType = 'count', timerIncrement = 30,
    onIncrement, onDecrement, onEdit, onArchive, onDelete,
}) => {
    const { preferences } = useTrackers();
    const accentColor = useAccentColor();
    const { showEmojiOnCard, showGoalOnCard, cardStyle, gridColumns } = preferences;
    const isMinimal = cardStyle === 'minimal';
    const isCompact = gridColumns === 2;
    const isMicro = gridColumns === 3;

    const isNegative = trackerType === 'negative';
    const isBoolean = trackerType === 'boolean';
    const isTimer = trackerType === 'timer';

    const isGoalMet = isNegative ? count < goal : count >= goal;

    const handleIncrement = () => {
        const willMeetGoal = isNegative
            ? false
            : isBoolean
                ? count === 0
                : isTimer
                    ? count + timerIncrement >= goal
                    : count + 1 >= goal;
        if (willMeetGoal) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onIncrement();
    };

    const handleDecrement = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onDecrement();
    };

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(name, undefined, [
            { text: 'Edit', onPress: onEdit },
            { text: 'Archive', onPress: onArchive },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    // Progress bar
    let percentage: number;
    let barColor: string;
    if (isNegative) {
        percentage = count === 0 ? 100 : Math.max(0, (1 - count / goal) * 100);
        barColor = isGoalMet ? theme.colors.success : theme.colors.danger;
    } else if (isBoolean) {
        percentage = count >= 1 ? 100 : 0;
        barColor = isGoalMet ? theme.colors.success : accentColor;
    } else {
        percentage = Math.min((count / goal) * 100, 100);
        barColor = isGoalMet ? theme.colors.success : accentColor;
    }

    // Count display
    let countDisplay: string;
    if (isBoolean) {
        countDisplay = count >= 1 ? '✓' : '✗';
    } else if (isTimer) {
        countDisplay = formatMinutes(count);
    } else {
        countDisplay = String(count);
    }

    // Goal subtext
    let goalText: string;
    if (isNegative) {
        const remaining = Math.max(0, goal - count);
        goalText = `${remaining} remaining`;
    } else if (isTimer) {
        goalText = `Goal: ${formatMinutes(goal)}`;
    } else if (isBoolean) {
        goalText = isGoalMet ? 'Done!' : 'Not done';
    } else {
        goalText = `Goal: ${goal}`;
    }

    const countColor = isBoolean
        ? isGoalMet ? theme.colors.success : theme.colors.danger
        : theme.colors.primary;

    const showGoal = showGoalOnCard && !isMinimal && !isCompact && !isMicro;

    return (
        <View style={[
            styles.card,
            isMinimal && styles.cardMinimal,
            isCompact && styles.cardCompact,
            isMicro && styles.cardMicro,
        ]}>
            {showEmojiOnCard && emoji ? (
                <Text style={[styles.emoji, (isMinimal || isCompact) && styles.emojiSmall, isMicro && styles.emojiMicro]}>{emoji}</Text>
            ) : null}
            <Text style={[styles.name, (isMinimal || isCompact) && styles.nameSmall, isMicro && styles.nameMicro]}>{name}</Text>
            <Text style={[
                styles.count,
                { color: countColor },
                isMinimal && styles.countMinimal,
                isCompact && styles.countCompact,
                isMicro && styles.countMicro,
                isTimer && styles.countTimer,
                isBoolean && styles.countBoolean,
            ]}>
                {countDisplay}
            </Text>
            {showGoal ? <Text style={styles.goal}>{goalText}</Text> : null}

            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: barColor }]} />
            </View>

            {isBoolean ? (
                // Boolean: whole card is a toggle
                <TouchableOpacity
                    style={styles.fullTap}
                    onPress={handleIncrement}
                    onLongPress={handleLongPress}
                    activeOpacity={0.7}
                />
            ) : (
                <>
                    <TouchableOpacity style={styles.decrementControl} onPress={handleDecrement} onLongPress={handleLongPress} activeOpacity={0.7} />
                    <TouchableOpacity style={styles.incrementControl} onPress={handleIncrement} onLongPress={handleLongPress} activeOpacity={0.7} />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: theme.spacing.m,
        marginVertical: theme.spacing.s,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    cardMinimal: { paddingVertical: 10 },
    cardCompact: { paddingVertical: theme.spacing.s, paddingHorizontal: theme.spacing.s },
    cardMicro: { paddingVertical: 6, paddingHorizontal: 6 },
    emoji: { fontSize: 28, marginBottom: 2 },
    emojiSmall: { fontSize: 20 },
    emojiMicro: { fontSize: 16 },
    name: {
        color: theme.colors.secondary,
        fontSize: theme.fontSizes.s,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
        textAlign: 'center',
    },
    nameSmall: { fontSize: 11 },
    nameMicro: { fontSize: 9 },
    count: {
        color: theme.colors.primary,
        fontSize: 48,
        fontWeight: 'bold',
        marginVertical: 4,
        textAlign: 'center',
    },
    countMinimal: { fontSize: 32, marginVertical: 2 },
    countCompact: { fontSize: 36, marginVertical: 2 },
    countMicro: { fontSize: 26, marginVertical: 1 },
    countTimer: { fontSize: 30, marginVertical: 4 },
    countBoolean: { fontSize: 40 },
    goal: {
        color: theme.colors.secondary,
        fontSize: theme.fontSizes.s,
        marginTop: 4,
        marginBottom: 8,
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 4,
        backgroundColor: '#333333',
    },
    progressBarFill: { height: '100%' },
    decrementControl: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', zIndex: 1 },
    incrementControl: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '70%', zIndex: 1 },
    fullTap: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 1 },
});
