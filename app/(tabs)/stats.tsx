import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useTrackers } from '../../src/context/TrackerContext';
import { useStreaks } from '../../src/hooks/useStreaks';
import { theme } from '../../src/constants/theme';
import {
    calculateTodayVolume,
    calculate7DayVolume,
    calculate14DayVolume,
    calculate30DayVolume,
    calculateDailyMomentum,
    calculateEffortSplit,
    calculateDailyAverages,
    calculateBestDay,
    calculateGoalCompletionRate,
    calculateConsistencyScore,
    calculatePaceIndicator,
    calculateDayOfWeekPatterns,
    calculateWeekComparison,
    calculateActivityHeatmap,
    calculatePerTrackerHistory,
} from '../../src/utils/statsLogic';

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
    return <Text style={styles.sectionTitle}>{title}</Text>;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
    return (
        <View style={styles.card}>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={[styles.cardValue, accent ? { color: accent } : null]}>{value}</Text>
            {sub ? <Text style={styles.cardSubtext}>{sub}</Text> : null}
        </View>
    );
}

function ConsistencyRing({ score }: { score: number }) {
    const color = score >= 75 ? theme.colors.success : score >= 40 ? theme.colors.accent : theme.colors.danger;
    return (
        <View style={styles.consistencyContainer}>
            <View style={[styles.consistencyRing, { borderColor: color }]}>
                <Text style={[styles.consistencyScore, { color }]}>{score}</Text>
                <Text style={styles.consistencyLabel}>/ 100</Text>
            </View>
            <Text style={styles.consistencyDesc}>Consistency Score</Text>
        </View>
    );
}

function Heatmap({ cells }: { cells: { date: string; volume: number; intensity: number }[] }) {
    const getColor = (intensity: number) => {
        if (intensity === 0) return '#2A2A2A';
        if (intensity < 0.25) return '#312E81';
        if (intensity < 0.5) return '#4338CA';
        if (intensity < 0.75) return '#6366F1';
        return '#818CF8';
    };

    // Split into weeks (columns)
    const weeks: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
    }

    return (
        <View style={styles.heatmapWrapper}>
            <View style={styles.heatmapGrid}>
                {weeks.map((week, wi) => (
                    <View key={wi} style={styles.heatmapCol}>
                        {week.map((cell, di) => (
                            <View
                                key={di}
                                style={[styles.heatmapCell, { backgroundColor: getColor(cell.intensity) }]}
                            />
                        ))}
                    </View>
                ))}
            </View>
            <View style={styles.heatmapLegend}>
                <Text style={styles.heatmapLegendLabel}>Less</Text>
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                    <View key={v} style={[styles.heatmapLegendCell, { backgroundColor: getColor(v) }]} />
                ))}
                <Text style={styles.heatmapLegendLabel}>More</Text>
            </View>
        </View>
    );
}

function MiniBarChart({ data, goal }: { data: { date: string; count: number }[]; goal: number }) {
    const max = Math.max(...data.map(d => d.count), goal, 1);
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <View style={styles.miniChart}>
            {data.map((d, i) => {
                const heightPct = d.count / max;
                const isToday = i === data.length - 1;
                const metGoal = d.count >= goal;
                const barColor = metGoal ? theme.colors.success : isToday ? theme.colors.accent : theme.colors.secondary;
                const dow = new Date(d.date + 'T12:00:00').getDay();
                return (
                    <View key={i} style={styles.miniBarWrapper}>
                        <View style={styles.miniBarTrack}>
                            <View
                                style={[
                                    styles.miniBarFill,
                                    { height: `${Math.max(heightPct * 100, 4)}%`, backgroundColor: barColor }
                                ]}
                            />
                        </View>
                        <Text style={[styles.miniBarLabel, isToday ? { color: theme.colors.text } : null]}>
                            {dayLabels[dow]}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

function DayOfWeekChart({ patterns, weekStartDay }: { patterns: { name: string; avg: number; normalized: number }[]; weekStartDay: 'sunday' | 'monday' }) {
    const ordered = weekStartDay === 'monday' ? [...patterns.slice(1), patterns[0]] : patterns;
    const maxDay = ordered.reduce((best, d) => d.avg > best.avg ? d : best, ordered[0]);
    return (
        <View style={styles.dowChart}>
            {ordered.map(day => (
                <View key={day.name} style={styles.dowBarWrapper}>
                    <View style={styles.dowBarTrack}>
                        <View
                            style={[
                                styles.dowBarFill,
                                {
                                    height: `${Math.max(day.normalized * 100, 2)}%`,
                                    backgroundColor: day.name === maxDay.name ? theme.colors.accent : theme.colors.secondary
                                }
                            ]}
                        />
                    </View>
                    <Text style={styles.dowLabel}>{day.name}</Text>
                    <Text style={styles.dowAvg}>{day.avg}</Text>
                </View>
            ))}
        </View>
    );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function StatsScreen() {
    const insets = useSafeAreaInsets();
    const { trackers, history, preferences, updatePreference } = useTrackers();
    const { currentStreak, bestStreak } = useStreaks();

    const stats = useMemo(() => {
        const todayVolume = calculateTodayVolume(trackers);
        const sevenDayVolume = calculate7DayVolume(trackers, history);
        const fourteenDayVolume = calculate14DayVolume(trackers, history);
        const thirtyDayVolume = calculate30DayVolume(trackers, history);
        const momentum = calculateDailyMomentum(trackers, history);
        const effortSplit = calculateEffortSplit(trackers);
        const dailyAvgs = calculateDailyAverages(trackers, history);
        const bestDay = calculateBestDay(trackers, history);
        const goalCompletionRate = calculateGoalCompletionRate(trackers, history, 30);
        const consistencyScore = calculateConsistencyScore(currentStreak, goalCompletionRate, trackers, history);
        const pace = calculatePaceIndicator(trackers, history);
        const dowPatterns = calculateDayOfWeekPatterns(trackers, history);
        const weekComparison = calculateWeekComparison(trackers, history);
        const heatmapCells = calculateActivityHeatmap(trackers, history, preferences.heatmapWeeks);
        const perTrackerHistory = calculatePerTrackerHistory(trackers, history, 7);

        return {
            todayVolume,
            sevenDayVolume,
            fourteenDayVolume,
            thirtyDayVolume,
            momentum,
            effortSplit,
            dailyAvgs,
            bestDay,
            goalCompletionRate,
            consistencyScore,
            pace,
            dowPatterns,
            weekComparison,
            heatmapCells,
            perTrackerHistory,
        };
    }, [trackers, history, currentStreak, preferences.heatmapWeeks]);

    const getMomentumDetails = (momentum: number | null) => {
        if (momentum === null) return { icon: 'remove-outline', color: theme.colors.secondary, text: 'No data for yesterday' };
        if (momentum > 0) return { icon: 'trending-up-outline', color: theme.colors.success, text: `${momentum.toFixed(0)}% increase` };
        if (momentum < 0) return { icon: 'trending-down-outline', color: theme.colors.danger, text: `${Math.abs(momentum).toFixed(0)}% decrease` };
        return { icon: 'remove-outline', color: theme.colors.secondary, text: 'Same as yesterday' };
    };

    const momentumDetails = getMomentumDetails(stats.momentum);

    const weekChangeColor = stats.weekComparison.change === null
        ? theme.colors.secondary
        : stats.weekComparison.change >= 0 ? theme.colors.success : theme.colors.danger;

    const weekChangeText = stats.weekComparison.change === null
        ? 'No prior week data'
        : stats.weekComparison.change >= 0
            ? `+${stats.weekComparison.change}% vs last week`
            : `${stats.weekComparison.change}% vs last week`;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Stats</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* ── Streak + Consistency ── */}
                <View style={styles.row}>
                    <StatCard
                        label="Current Streak"
                        value={`${currentStreak}d`}
                        sub="Consecutive perfect days"
                        accent={currentStreak > 0 ? theme.colors.accent : undefined}
                    />
                    <StatCard
                        label="Best Streak"
                        value={`${bestStreak}d`}
                        sub="All-time record"
                    />
                </View>

                <View style={[styles.row, { alignItems: 'center' }]}>
                    <ConsistencyRing score={stats.consistencyScore} />
                    <View style={styles.consistencyStats}>
                        <View style={styles.consistencyStatRow}>
                            <Text style={styles.consistencyStatLabel}>Goal rate (30d)</Text>
                            <Text style={styles.consistencyStatValue}>
                                {stats.goalCompletionRate !== null ? `${stats.goalCompletionRate}%` : '—'}
                            </Text>
                        </View>
                        <View style={styles.dividerLine} />
                        <View style={styles.consistencyStatRow}>
                            <Text style={styles.consistencyStatLabel}>Best day ever</Text>
                            <Text style={styles.consistencyStatValue}>
                                {stats.bestDay
                                    ? `${stats.bestDay.volume} actions`
                                    : '—'}
                            </Text>
                        </View>
                        {stats.bestDay ? (
                            <Text style={styles.bestDayDate}>
                                {stats.bestDay.date === getTodayStringLocal()
                                    ? 'Today!'
                                    : format(parseISO(stats.bestDay.date), 'MMM d, yyyy')}
                            </Text>
                        ) : null}
                    </View>
                </View>

                {/* ── Volume ── */}
                <View>
                    <SectionTitle title="Volume" />
                    <View style={styles.row}>
                        <StatCard label="Today" value={stats.todayVolume} sub="Actions" />
                        <StatCard label="7-Day Total" value={stats.sevenDayVolume} sub={`~${stats.dailyAvgs.avg7}/day avg`} />
                    </View>
                    <View style={[styles.row, { marginTop: theme.spacing.m }]}>
                        <StatCard label="14-Day Total" value={stats.fourteenDayVolume} sub={`~${stats.dailyAvgs.avg14}/day avg`} />
                        <StatCard label="30-Day Total" value={stats.thirtyDayVolume} sub={`~${stats.dailyAvgs.avg30}/day avg`} />
                    </View>
                </View>

                {/* ── Momentum + Pace ── */}
                <View>
                    <SectionTitle title="Momentum & Pace" />
                    <View style={styles.momentumCard}>
                        <View style={[styles.iconContainer, { backgroundColor: momentumDetails.color + '20' }]}>
                            <Ionicons name={momentumDetails.icon as any} size={24} color={momentumDetails.color} />
                        </View>
                        <View style={styles.momentumInfo}>
                            <Text style={styles.momentumText}>{momentumDetails.text}</Text>
                            <Text style={styles.momentumSubtext}>Compared to yesterday's volume</Text>
                        </View>
                    </View>
                    <View style={[styles.row, { marginTop: theme.spacing.m }]}>
                        <StatCard
                            label="Projected Week"
                            value={stats.pace.projectedWeek}
                            sub="At current 7d pace"
                            accent={theme.colors.accent}
                        />
                        <StatCard
                            label="Projected Month"
                            value={stats.pace.projectedMonth}
                            sub="At current 7d pace"
                            accent={theme.colors.accent}
                        />
                    </View>
                </View>

                {/* ── This Week vs Last Week ── */}
                <View>
                    <SectionTitle title="Week Comparison" />
                    <View style={styles.surface}>
                        <View style={styles.weekRow}>
                            <View style={styles.weekCol}>
                                <Text style={styles.weekLabel}>This Week</Text>
                                <Text style={[styles.weekValue, { color: theme.colors.text }]}>{stats.weekComparison.thisWeek}</Text>
                            </View>
                            <View style={styles.weekDivider} />
                            <View style={styles.weekCol}>
                                <Text style={styles.weekLabel}>Last Week</Text>
                                <Text style={[styles.weekValue, { color: theme.colors.secondary }]}>{stats.weekComparison.lastWeek}</Text>
                            </View>
                        </View>
                        <Text style={[styles.weekChange, { color: weekChangeColor }]}>{weekChangeText}</Text>
                    </View>
                </View>

                {/* ── Activity Heatmap ── */}
                <View>
                    <View style={styles.sectionHeaderRow}>
                        <SectionTitle title="Activity Heatmap" />
                        <View style={styles.heatmapToggleRow}>
                            {([4, 8, 12, 24] as const).map(w => (
                                <TouchableOpacity
                                    key={w}
                                    style={[styles.heatmapToggle, preferences.heatmapWeeks === w && styles.heatmapToggleActive]}
                                    onPress={() => updatePreference('heatmapWeeks', w)}
                                >
                                    <Text style={[styles.heatmapToggleText, preferences.heatmapWeeks === w && styles.heatmapToggleTextActive]}>
                                        {w}w
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={styles.surface}>
                        <Heatmap cells={stats.heatmapCells} />
                    </View>
                </View>

                {/* ── Day of Week Patterns ── */}
                <View>
                    <SectionTitle title="Day of Week Patterns" />
                    <View style={styles.surface}>
                        <Text style={styles.dowSubtext}>Average daily volume by weekday</Text>
                        <DayOfWeekChart patterns={stats.dowPatterns} weekStartDay={preferences.weekStartDay} />
                    </View>
                </View>

                {/* ── Per-Tracker History ── */}
                {stats.perTrackerHistory.length > 0 && (
                    <View>
                        <SectionTitle title="Tracker Trends (7 Days)" />
                        {stats.perTrackerHistory.map(tracker => {
                            const t = trackers.find(tr => tr.name === tracker.trackerName);
                            const goal = t?.dailyGoal ?? 1;
                            return (
                                <View key={tracker.trackerName} style={[styles.surface, { marginBottom: theme.spacing.m }]}>
                                    <View style={styles.trackerChartHeader}>
                                        <Text style={styles.trackerChartName}>{tracker.trackerName}</Text>
                                        <Text style={styles.trackerChartGoal}>Goal: {goal}/day</Text>
                                    </View>
                                    <MiniBarChart data={tracker.data} goal={goal} />
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* ── Effort Split ── */}
                <View>
                    <SectionTitle title="Today's Effort Split" />
                    <View style={styles.surface}>
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
                </View>

            </ScrollView>
        </View>
    );
}

function getTodayStringLocal() {
    const now = new Date();
    return now.toISOString().split('T')[0];
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
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: theme.fontSizes.l,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: theme.spacing.m,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    heatmapToggleRow: {
        flexDirection: 'row',
        gap: 4,
    },
    heatmapToggle: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: theme.colors.surface,
    },
    heatmapToggleActive: {
        backgroundColor: theme.colors.accent,
    },
    heatmapToggleText: {
        fontSize: 11,
        color: theme.colors.secondary,
        fontWeight: '600',
    },
    heatmapToggleTextActive: {
        color: '#fff',
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
        textAlign: 'center',
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
        textAlign: 'center',
    },
    surface: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.m,
    },

    // Consistency
    consistencyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.m,
    },
    consistencyRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
    },
    consistencyScore: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    consistencyLabel: {
        fontSize: 10,
        color: theme.colors.secondary,
    },
    consistencyDesc: {
        fontSize: 11,
        color: theme.colors.secondary,
        marginTop: 6,
        textAlign: 'center',
    },
    consistencyStats: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.m,
        gap: theme.spacing.s,
    },
    consistencyStatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    consistencyStatLabel: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
    },
    consistencyStatValue: {
        fontSize: theme.fontSizes.m,
        fontWeight: '600',
        color: theme.colors.text,
    },
    bestDayDate: {
        fontSize: 10,
        color: theme.colors.accent,
        textAlign: 'right',
    },
    dividerLine: {
        height: 1,
        backgroundColor: theme.colors.background,
    },

    // Momentum
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

    // Week Comparison
    weekRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginBottom: theme.spacing.m,
    },
    weekCol: {
        alignItems: 'center',
        flex: 1,
    },
    weekLabel: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    weekValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    weekDivider: {
        width: 1,
        height: 48,
        backgroundColor: theme.colors.background,
    },
    weekChange: {
        fontSize: theme.fontSizes.s,
        textAlign: 'center',
        fontWeight: '600',
    },

    // Heatmap
    heatmapWrapper: {
        gap: theme.spacing.s,
    },
    heatmapGrid: {
        flexDirection: 'row',
        gap: 3,
    },
    heatmapCol: {
        flex: 1,
        gap: 3,
    },
    heatmapCell: {
        aspectRatio: 1,
        borderRadius: 2,
    },
    heatmapLegend: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
    },
    heatmapLegendLabel: {
        fontSize: 10,
        color: theme.colors.secondary,
    },
    heatmapLegendCell: {
        width: 10,
        height: 10,
        borderRadius: 2,
    },

    // Day of Week
    dowSubtext: {
        fontSize: 11,
        color: theme.colors.secondary,
        marginBottom: theme.spacing.m,
    },
    dowChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 80,
        gap: 6,
    },
    dowBarWrapper: {
        flex: 1,
        alignItems: 'center',
        height: '100%',
    },
    dowBarTrack: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: theme.colors.background,
    },
    dowBarFill: {
        width: '100%',
        borderRadius: 3,
    },
    dowLabel: {
        fontSize: 10,
        color: theme.colors.secondary,
        marginTop: 4,
    },
    dowAvg: {
        fontSize: 9,
        color: theme.colors.secondary,
        opacity: 0.7,
    },

    // Per-tracker mini chart
    trackerChartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.m,
    },
    trackerChartName: {
        fontSize: theme.fontSizes.m,
        fontWeight: '600',
        color: theme.colors.text,
    },
    trackerChartGoal: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
    },
    miniChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 60,
        gap: 4,
    },
    miniBarWrapper: {
        flex: 1,
        alignItems: 'center',
        height: '100%',
    },
    miniBarTrack: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
        backgroundColor: theme.colors.background,
        borderRadius: 3,
        overflow: 'hidden',
    },
    miniBarFill: {
        width: '100%',
        borderRadius: 3,
    },
    miniBarLabel: {
        fontSize: 9,
        color: theme.colors.secondary,
        marginTop: 3,
    },

    // Effort Split
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
        backgroundColor: theme.colors.background,
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
