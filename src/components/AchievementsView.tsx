import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { theme } from '../constants/theme';
import { ACHIEVEMENTS } from '../utils/achievements';
import { AchievementId } from '../types';

interface AchievementsViewProps {
    unlockedAchievements: AchievementId[];
    onClose?: () => void;
}

export const AchievementsView = ({ unlockedAchievements, onClose }: AchievementsViewProps) => {
    const achievements = Object.values(ACHIEVEMENTS);
    const unlockedSet = new Set(unlockedAchievements);
    const unlockedCount = unlockedAchievements.length;
    const totalCount = achievements.length;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Achievements</Text>
                <Text style={styles.progress}>
                    {unlockedCount} / {totalCount} unlocked
                </Text>
            </View>

            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${(unlockedCount / totalCount) * 100}%` }
                    ]}
                />
            </View>

            <View style={styles.grid}>
                {achievements.map(achievement => {
                    const isUnlocked = unlockedSet.has(achievement.id);
                    return (
                        <View key={achievement.id} style={styles.achievementCard}>
                            <View style={[styles.iconContainer, !isUnlocked && styles.iconContainerLocked]}>
                                <Text style={styles.icon}>{achievement.icon}</Text>
                            </View>
                            <Text style={[styles.achievementName, !isUnlocked && styles.lockedText]}>
                                {achievement.name}
                            </Text>
                            <Text style={[styles.achievementDesc, !isUnlocked && styles.lockedText]}>
                                {achievement.description}
                            </Text>
                            {isUnlocked && <Text style={styles.unlockedBadge}>✓</Text>}
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.m,
        paddingBottom: 100,
    },
    header: {
        marginBottom: theme.spacing.l,
    },
    headerTitle: {
        fontSize: theme.fontSizes.xl,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 8,
    },
    progress: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.secondary,
    },
    progressBar: {
        height: 6,
        backgroundColor: theme.colors.surface,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: theme.spacing.l,
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.accent,
        borderRadius: 3,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.s,
    },
    achievementCard: {
        flex: 1,
        minWidth: '30%',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.m,
        alignItems: 'center',
        minHeight: 140,
        position: 'relative',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: theme.colors.accent + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.s,
    },
    iconContainerLocked: {
        backgroundColor: theme.colors.background,
    },
    icon: {
        fontSize: 28,
    },
    achievementName: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: 4,
    },
    achievementDesc: {
        fontSize: 10,
        color: theme.colors.secondary,
        textAlign: 'center',
    },
    lockedText: {
        opacity: 0.5,
    },
    unlockedBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        fontSize: 20,
        color: theme.colors.success,
    },
});
