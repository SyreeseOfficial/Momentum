import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useTrackers } from '../context/TrackerContext';
import { useAccentColor } from '../hooks/useAccentColor';

interface TrackerCardProps {
    name: string;
    count: number;
    goal: number;
    emoji?: string;
    onIncrement: () => void;
    onDecrement: () => void;
    onEdit: () => void;
    onArchive: () => void;
    onDelete: () => void;
}

export const TrackerCard: React.FC<TrackerCardProps> = ({
    name, count, goal, emoji, onIncrement, onDecrement, onEdit, onArchive, onDelete,
}) => {
    const { preferences } = useTrackers();
    const accentColor = useAccentColor();
    const { showEmojiOnCard, showGoalOnCard, cardStyle } = preferences;
    const isMinimal = cardStyle === 'minimal';

    const handleIncrement = () => {
        if (count + 1 === goal) {
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

    const { gridColumns } = preferences;
    const isCompact = gridColumns === 2;
    const isMicro = gridColumns === 3;

    const percentage = Math.min(Math.max((count / goal) * 100, 0), 100);
    const isGoalMet = percentage >= 100;
    const barColor = isGoalMet ? theme.colors.success : accentColor;

    return (
        <View style={[
            styles.card,
            isMinimal && styles.cardMinimal,
            isCompact && styles.cardCompact,
            isMicro && styles.cardMicro,
        ]}>
            {showEmojiOnCard && emoji ? (
                <Text style={[styles.emoji, (isMinimal || isCompact) && styles.emojiMinimal, isMicro && styles.emojiMicro]}>{emoji}</Text>
            ) : null}
            <Text style={[styles.name, (isMinimal || isCompact) && styles.nameMinimal, isMicro && styles.nameMicro]}>{name}</Text>
            <Text style={[styles.count, isMinimal && styles.countMinimal, isCompact && styles.countCompact, isMicro && styles.countMicro]}>{count}</Text>
            {showGoalOnCard && !isMinimal && !isCompact && !isMicro ? (
                <Text style={styles.goal}>Goal: {goal}</Text>
            ) : null}

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
    cardMinimal: {
        paddingVertical: 10,
    },
    cardCompact: {
        paddingVertical: theme.spacing.s,
        paddingHorizontal: theme.spacing.s,
    },
    cardMicro: {
        paddingVertical: 6,
        paddingHorizontal: 6,
    },
    emoji: {
        fontSize: 28,
        marginBottom: 2,
    },
    emojiMinimal: {
        fontSize: 20,
    },
    emojiMicro: {
        fontSize: 16,
    },
    name: {
        color: theme.colors.secondary,
        fontSize: theme.fontSizes.s,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    nameMinimal: {
        fontSize: 11,
    },
    nameMicro: {
        fontSize: 9,
    },
    count: {
        color: theme.colors.primary,
        fontSize: 48,
        fontWeight: 'bold',
        marginVertical: 4,
    },
    countMinimal: {
        fontSize: 32,
        marginVertical: 2,
    },
    countCompact: {
        fontSize: 36,
        marginVertical: 2,
    },
    countMicro: {
        fontSize: 26,
        marginVertical: 1,
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
