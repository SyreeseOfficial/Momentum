import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { theme } from '../../src/constants/theme';
import { useTrackers } from '../../src/context/TrackerContext';
import { useStreaks } from '../../src/hooks/useStreaks';
import { TrackerCard } from '../../src/components/TrackerCard';
import { AchievementUnlock } from '../../src/components/AchievementUnlock';
import { AchievementsView } from '../../src/components/AchievementsView';
import { Confetti } from '../../src/components/Confetti';
import { Ionicons } from '@expo/vector-icons';
import { detectNewAchievements, ACHIEVEMENTS } from '../../src/utils/achievements';
import { calculateTodayVolume, calculateConsistencyScore, calculateGoalCompletionRate } from '../../src/utils/statsLogic';
import { isWeekendDay } from '../../src/utils/dateLogic';
import { useAccentColor } from '../../src/hooks/useAccentColor';
import { Achievement, EnergyLevel, ENERGY_LABELS, isTrackerGoalMet } from '../../src/types';

export default function HomeScreen() {
    const router = useRouter();
    const { trackers, history, incrementTracker, decrementTracker, unlockedAchievements, unlockAchievement, archiveTracker, deleteTracker, preferences, logEnergy, todayEnergy } = useTrackers();
    const accentColor = useAccentColor();
    const isWeekend = isWeekendDay();
    const { gridColumns } = preferences;

    const sortedActiveTrackers = useMemo(() => {
        const filtered = trackers.filter(t => !t.isArchived);
        switch (preferences.sortPreference) {
            case 'alphabetical':
                return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
            case 'goalProximity':
                return [...filtered].sort((a, b) => (b.count / b.dailyGoal) - (a.count / a.dailyGoal));
            case 'frequency':
                return [...filtered].sort((a, b) => b.count - a.count);
            default:
                return [...filtered].sort((a, b) => a.sortOrder - b.sortOrder);
        }
    }, [trackers, preferences.sortPreference]);

    const getEffectiveGoal = (dailyGoal: number) =>
        isWeekend && preferences.weekendGoalEnabled
            ? Math.max(1, Math.round(dailyGoal * preferences.weekendGoalMultiplier))
            : dailyGoal;
    const { currentStreak, bestStreak } = useStreaks();
    const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const today = new Date();
    const dateString = format(today, 'EEE, MMM d').toUpperCase();

    const allGoalsMet = useMemo(() => {
        return sortedActiveTrackers.length > 0 && sortedActiveTrackers
            .filter(t => t.isActive)
            .every(t => {
                const effectiveGoal = getEffectiveGoal(t.dailyGoal);
                if (t.trackerType === 'negative') return t.count < effectiveGoal;
                return t.count >= effectiveGoal;
            });
    }, [sortedActiveTrackers, isWeekend, preferences.weekendGoalEnabled, preferences.weekendGoalMultiplier]);

    // Detect new achievements
    useEffect(() => {
        const totalVolume = calculateTodayVolume(trackers);
        const goalCompletionRate = calculateGoalCompletionRate(trackers, history, 30);
        const consistencyScore = calculateConsistencyScore(currentStreak, goalCompletionRate, trackers, history);

        const newAchievements = detectNewAchievements({
            trackers,
            history,
            currentStreak,
            totalVolume,
            goalCompletionRate: goalCompletionRate ?? 0,
            consistencyScore,
            unlockedAchievements,
        });

        newAchievements.forEach(id => {
            const achievement = ACHIEVEMENTS[id];
            if (achievement) {
                unlockAchievement(id);
                setUnlockedAchievement({ ...achievement, unlockedAt: new Date().toISOString() });
            }
        });
    }, [trackers, history, currentStreak]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {showCelebration && allGoalsMet && <Confetti duration={2500} />}

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.date}>{dateString}</Text>
                    <View style={styles.streakContainer}>
                        <Text style={styles.streakText}>🔥 {currentStreak}</Text>
                        <Text style={[styles.streakText, { marginLeft: 12 }]}>🏆 {bestStreak}</Text>
                        <TouchableOpacity
                            style={styles.achievementsButton}
                            onPress={() => setShowAchievements(true)}
                        >
                            <Ionicons name="trophy-outline" size={20} color={theme.colors.accent} />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.title}>Dailies</Text>
            </View>

            {/* Energy Logger */}
            <View style={styles.energyRow}>
                <Text style={styles.energyLabel}>
                    {todayEnergy ? ENERGY_LABELS[todayEnergy].label : 'How are you feeling?'}
                </Text>
                <View style={styles.energyButtons}>
                    {([1, 2, 3, 4, 5] as EnergyLevel[]).map(level => (
                        <TouchableOpacity
                            key={level}
                            style={[styles.energyBtn, todayEnergy === level && { backgroundColor: accentColor + '30', borderColor: accentColor }]}
                            onPress={() => logEnergy(level)}
                        >
                            <Text style={styles.energyEmoji}>{ENERGY_LABELS[level].emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <FlatList
                key={gridColumns}
                data={sortedActiveTrackers}
                keyExtractor={(item) => item.id}
                numColumns={gridColumns}
                columnWrapperStyle={gridColumns > 1 ? styles.columnWrapper : undefined}
                renderItem={({ item }) => {
                    const effectiveGoal = getEffectiveGoal(item.dailyGoal);
                    return (
                        <View style={gridColumns > 1 ? { flex: 1 } : undefined}>
                            <TrackerCard
                                name={item.name}
                                count={item.count}
                                goal={effectiveGoal}
                                emoji={item.emoji}
                                trackerType={item.trackerType}
                                timerIncrement={item.timerIncrement}
                                onIncrement={() => {
                                    incrementTracker(item.id);
                                    const updated = sortedActiveTrackers.map(t =>
                                        t.id === item.id ? { ...t, count: t.count + 1 } : t
                                    );
                                    const allMet = updated.filter(t => t.isActive).every(t => {
                                        const eg = getEffectiveGoal(t.dailyGoal);
                                        return t.trackerType === 'negative' ? t.count < eg : t.count >= eg;
                                    });
                                    if (allMet) setShowCelebration(true);
                                }}
                                onDecrement={() => decrementTracker(item.id)}
                                onEdit={() => router.push({ pathname: '/edit-tracker', params: { id: item.id } })}
                                onArchive={() => archiveTracker(item.id)}
                                onDelete={() =>
                                    Alert.alert('Delete Tracker', `Delete "${item.name}"? This cannot be undone.`, [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Delete', style: 'destructive', onPress: () => deleteTracker(item.id) },
                                    ])
                                }
                            />
                        </View>
                    );
                }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: accentColor }]}
                onPress={() => router.push('/add-tracker')}
                activeOpacity={0.8}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>

            <AchievementUnlock achievement={unlockedAchievement} onDismiss={() => setUnlockedAchievement(null)} />

            <Modal visible={showAchievements} transparent animationType="slide">
                <SafeAreaView style={styles.modalContainer} edges={['top']}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Achievements</Text>
                        <TouchableOpacity onPress={() => setShowAchievements(false)}>
                            <Ionicons name="close" size={28} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                    <AchievementsView unlockedAchievements={unlockedAchievements} />
                </SafeAreaView>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surface,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    date: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        fontWeight: '600',
        letterSpacing: 1.5,
    },
    streakContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
    },
    streakText: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    achievementsButton: {
        padding: 4,
    },
    title: {
        fontSize: theme.fontSizes.xl,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.xl + 80,
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing.xl,
        right: theme.spacing.m,
        backgroundColor: theme.colors.accent,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
    },
    fabText: {
        fontSize: 32,
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginTop: -2,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surface,
    },
    modalTitle: {
        fontSize: theme.fontSizes.xl,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    columnWrapper: {
        gap: theme.spacing.s,
    },
    energyRow: {
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    energyLabel: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        flex: 1,
    },
    energyButtons: {
        flexDirection: 'row',
        gap: 6,
    },
    energyBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    energyEmoji: {
        fontSize: 20,
    },
});
