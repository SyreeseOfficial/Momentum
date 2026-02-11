import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';

interface TrackerCardProps {
    name: string;
    count: number;
    goal: number;
    onIncrement: () => void;
    onDecrement: () => void;
}

export const TrackerCard: React.FC<TrackerCardProps> = ({
    name,
    count,
    goal,
    // onIncrement and onDecrement will be used when we add buttons
    onIncrement,
    onDecrement
}) => {
    const handleIncrement = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onIncrement();
    };

    const handleDecrement = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onDecrement();
    };
    // Calculate percentage (clamped between 0 and 100)
    const percentage = Math.min(Math.max((count / goal) * 100, 0), 100);
    const isGoalMet = percentage >= 100;
    const barColor = isGoalMet ? theme.colors.success : theme.colors.accent;

    return (
        <View style={styles.card}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.goal}>Goal: {goal}</Text>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View
                    style={[
                        styles.progressBarFill,
                        {
                            width: `${percentage}%`,
                            backgroundColor: barColor
                        }
                    ]}
                />
            </View>

            {/* Control Surface */}
            <TouchableOpacity
                style={styles.decrementControl}
                onPress={handleDecrement}
                activeOpacity={0.7}
            />
            <TouchableOpacity
                style={styles.incrementControl}
                onPress={handleIncrement}
                activeOpacity={0.7}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface, // #1E1E1E
        borderRadius: 16,
        padding: theme.spacing.m,
        marginVertical: theme.spacing.s,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden', // Ensure progress bar doesn't overflow rounded corners
        position: 'relative',
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
        fontSize: 48, // LARGE explicit size for the count
        fontWeight: 'bold',
        marginVertical: 4,
    },
    goal: {
        color: theme.colors.secondary,
        fontSize: theme.fontSizes.s,
        marginTop: 4,
        marginBottom: 8, // Add some space for the progress bar
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#333333', // Dark Grey background for the bar
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
