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
import { Achievement } from '../../src/types';

export default function HomeScreen() {
    const router = useRouter();
    const { trackers, history, incrementTracker, decrementTracker, unlockedAchievements, unlockAchievement, archiveTracker, deleteTracker } = useTrackers();
    const activeTrackers = trackers.filter(t => !t.isArchived);
    const { currentStreak, bestStreak } = useStreaks();
    const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const today = new Date();
    const dateString = format(today, 'EEE, MMM d').toUpperCase();

    const allGoalsMet = useMemo(() => {
        return activeTrackers.length > 0 && activeTrackers.filter(t => t.isActive).every(t => t.count >= t.dailyGoal);
    }, [activeTrackers]);

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

            <FlatList
                data={activeTrackers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TrackerCard
                        name={item.name}
                        count={item.count}
                        goal={item.dailyGoal}
                        emoji={item.emoji}
                        onIncrement={() => {
                            incrementTracker(item.id);
                            const updated = activeTrackers.map(t =>
                                t.id === item.id ? { ...t, count: t.count + 1 } : t
                            );
                            const allMet = updated.filter(t => t.isActive).every(t => t.count >= t.dailyGoal);
                            if (allMet) setShowCelebration(true);
                        }}
                        onDecrement={() => decrementTracker(item.id)}
                        onArchive={() => archiveTracker(item.id)}
                        onDelete={() =>
                            Alert.alert('Delete Tracker', `Delete "${item.name}"? This cannot be undone.`, [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => deleteTracker(item.id) },
                            ])
                        }
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
                style={styles.fab}
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
});
