import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTrackers } from '../../src/context/TrackerContext';
import { theme } from '../../src/constants/theme';
import {
    calculateTodayVolume,
    calculate7DayVolume,
    calculate14DayVolume,
    calculate30DayVolume,
    calculateDailyMomentum,
    calculateEffortSplit
} from '../../src/utils/statsLogic';

export default function StatsScreen() {
    const insets = useSafeAreaInsets();
    const { trackers, history } = useTrackers();

    const stats = useMemo(() => {
        const todayVolume = calculateTodayVolume(trackers);
        const sevenDayVolume = calculate7DayVolume(trackers, history);
        const fourteenDayVolume = calculate14DayVolume(trackers, history);
        const thirtyDayVolume = calculate30DayVolume(trackers, history);
        const momentum = calculateDailyMomentum(trackers, history);
        const effortSplit = calculateEffortSplit(trackers);

        return {
            todayVolume,
            sevenDayVolume,
            fourteenDayVolume,
            thirtyDayVolume,
            momentum,
            effortSplit
        };
    }, [trackers, history]);

    const getMomentumDetails = (momentum: number | null) => {
        if (momentum === null) return { icon: 'remove-outline', color: theme.colors.secondary, text: 'No data for yesterday' };
        if (momentum > 0) return { icon: 'trending-up-outline', color: theme.colors.success, text: `${momentum.toFixed(0)}% increase` };
        if (momentum < 0) return { icon: 'trending-down-outline', color: theme.colors.danger, text: `${Math.abs(momentum).toFixed(0)}% decrease` };
        return { icon: 'remove-outline', color: theme.colors.secondary, text: 'Same as yesterday' };
    };

    const momentumDetails = getMomentumDetails(stats.momentum);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Business Dashboard</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Volume Section */}
                <View style={styles.row}>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>Today's Work</Text>
                        <Text style={styles.cardValue}>{stats.todayVolume}</Text>
                        <Text style={styles.cardSubtext}>Actions completed</Text>
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>7-Day Volume</Text>
                        <Text style={styles.cardValue}>{stats.sevenDayVolume}</Text>
                        <Text style={styles.cardSubtext}>Rolling total</Text>
                    </View>
                </View>

                {/* Extended Volume Section */}
                <View style={styles.row}>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>14-Day Volume</Text>
                        <Text style={styles.cardValue}>{stats.fourteenDayVolume}</Text>
                        <Text style={styles.cardSubtext}>Rolling total</Text>
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>30-Day Volume</Text>
                        <Text style={styles.cardValue}>{stats.thirtyDayVolume}</Text>
                        <Text style={styles.cardSubtext}>Rolling total</Text>
                    </View>
                </View>

                {/* Momentum Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Daily Momentum</Text>
                    <View style={styles.momentumCard}>
                        <View style={[styles.iconContainer, { backgroundColor: momentumDetails.color + '20' }]}>
                            <Ionicons name={momentumDetails.icon as any} size={24} color={momentumDetails.color} />
                        </View>
                        <View style={styles.momentumInfo}>
                            <Text style={styles.momentumText}>{momentumDetails.text}</Text>
                            <Text style={styles.momentumSubtext}>Compared to yesterday's volume</Text>
                        </View>
                    </View>
                </View>

                {/* Effort Split Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Effort Split</Text>
                    {stats.effortSplit.length > 0 ? (
                        stats.effortSplit.map((item, index) => (
                            <View key={item.name} style={styles.splitRow}>
                                <View style={styles.splitInfo}>
                                    <Text style={styles.splitName}>{item.name}</Text>
                                    <Text style={styles.splitPercentage}>{item.percentage}%</Text>
                                </View>
                                <View style={styles.progressBarContainer}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                width: `${item.percentage}%`,
                                                backgroundColor: index === 0 ? theme.colors.accent : theme.colors.secondary
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No effort recorded today yet.</Text>
                    )}
                </View>
            </ScrollView>
        </View>
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
    headerTitle: {
        fontSize: theme.fontSizes.xl,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    content: {
        padding: theme.spacing.m,
        gap: theme.spacing.l,
    },
    row: {
        flexDirection: 'row',
        gap: theme.spacing.m,
    },
    card: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.m,
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cardValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    cardSubtext: {
        fontSize: 10,
        color: theme.colors.secondary,
    },
    section: {
        gap: theme.spacing.s,
    },
    sectionTitle: {
        fontSize: theme.fontSizes.l,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
    },
    momentumCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.m,
        alignItems: 'center',
        gap: theme.spacing.m,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    momentumInfo: {
        flex: 1,
    },
    momentumText: {
        fontSize: theme.fontSizes.m,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    momentumSubtext: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
    },
    splitRow: {
        marginBottom: theme.spacing.m,
    },
    splitInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    splitName: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.text,
    },
    splitPercentage: {
        fontSize: theme.fontSizes.m,
        fontWeight: '600',
        color: theme.colors.secondary,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: theme.colors.surface,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    emptyText: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.secondary,
        fontStyle: 'italic',
    },
});
