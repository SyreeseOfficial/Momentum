import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';

interface TrackerCardProps {
    name: string;
    count: number;
    goal: number;
    emoji?: string;
    onIncrement: () => void;
    onDecrement: () => void;
    onArchive: () => void;
    onDelete: () => void;
}

export const TrackerCard: React.FC<TrackerCardProps> = ({
    name,
    count,
    goal,
    emoji,
    onIncrement,
    onDecrement,
    onArchive,
    onDelete,
}) => {
    const handleIncrement = () => {
        const newCount = count + 1;
        if (newCount === goal) {
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
            { text: 'Archive', onPress: onArchive },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const percentage = Math.min(Math.max((count / goal) * 100, 0), 100);
    const isGoalMet = percentage >= 100;
    const barColor = isGoalMet ? theme.colors.success : theme.colors.accent;

    return (
        <View style={styles.card}>
            {emoji ? (
                <Text style={styles.emoji}>{emoji}</Text>
            ) : null}
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.goal}>Goal: {goal}</Text>

            <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: barColor }]} />
            </View>

            <TouchableOpacity
                style={styles.decrementControl}
                onPress={handleDecrement}
                onLongPress={handleLongPress}
                activeOpacity={0.7}
            />
            <TouchableOpacity
                style={styles.incrementControl}
                onPress={handleIncrement}
                onLongPress={handleLongPress}
                activeOpacity={0.7}
            />
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
    emoji: {
        fontSize: 28,
        marginBottom: 2,
    },
    name: {
        color: theme.colors.secondary,
        fontSize: theme.fontSizes.s,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    count: {
        color: theme.colors.primary,
        fontSize: 48,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    goal: {
        color: theme.colors.secondary,
        fontSize: theme.fontSizes.s,
        marginTop: 4,
        marginBottom: 8,
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#333333',
    },
    progressBarFill: {
        height: '100%',
    },
    decrementControl: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '30%',
        zIndex: 1,
    },
    incrementControl: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '70%',
        zIndex: 1,
    },
});
