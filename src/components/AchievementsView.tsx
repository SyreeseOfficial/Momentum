import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { ACHIEVEMENTS } from '../utils/achievements';
import { AchievementId, ThemeColors } from '../types';

interface AchievementsViewProps {
    unlockedAchievements: AchievementId[];
    onClose?: () => void;
}

export const AchievementsView = ({ unlockedAchievements, onClose }: AchievementsViewProps) => {
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme.colors), [theme.colors]);
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

function createStyles(colors: ThemeColors) {
    return StyleSheet.create({
        container: { padding: 16, paddingBottom: 100 },
        header: { marginBottom: 24 },
        headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
        progress: { fontSize: 16, color: colors.secondary },
        progressBar: { height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden', marginBottom: 24 },
        progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
        grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        achievementCard: { flex: 1, minWidth: '30%', backgroundColor: colors.surface, borderRadius: 12, padding: 16, alignItems: 'center', minHeight: 140, position: 'relative' },
        iconContainer: { width: 56, height: 56, borderRadius: 12, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
        iconContainerLocked: { backgroundColor: colors.background },
        icon: { fontSize: 28 },
        achievementName: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 4 },
        achievementDesc: { fontSize: 10, color: colors.secondary, textAlign: 'center' },
        lockedText: { opacity: 0.5 },
        unlockedBadge: { position: 'absolute', top: 8, right: 8, fontSize: 20, color: colors.success },
    });
}
