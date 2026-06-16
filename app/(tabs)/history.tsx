import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTrackers } from '../../src/context/TrackerContext';
import { theme } from '../../src/constants/theme';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { HistoryRecord } from '../../src/types';
import { useAccentColor } from '../../src/hooks/useAccentColor';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isPerfectDay = (record: HistoryRecord, trackers: ReturnType<typeof useTrackers>['trackers']) =>
    record.details.length > 0 && record.details.every(d => {
        const t = trackers.find(tr => tr.name === d.trackerName);
        if (t?.trackerType === 'negative') return d.count < d.goal;
        return d.count >= d.goal;
    });

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

// ─── List Item ────────────────────────────────────────────────────────────────

const HistoryItem = ({ item, trackers }: { item: HistoryRecord; trackers: ReturnType<typeof useTrackers>['trackers'] }) => {
    const router = useRouter();
    const perfect = isPerfectDay(item, trackers);
    return (
        <TouchableOpacity
            style={[styles.itemContainer, { borderLeftColor: perfect ? theme.colors.success : theme.colors.accent }]}
            onPress={() => router.push({ pathname: '/edit-history', params: { date: item.date } })}
        >
            <View style={styles.itemHeader}>
                <Text style={styles.itemDate}>{format(parseISO(item.date), 'EEE, MMM d')}</Text>
                <Text style={styles.itemVolume}>Total: {item.totalVolume}</Text>
            </View>
            <View style={styles.itemList}>
                {item.details.map((detail, i) => (
                    <Text key={i} style={styles.itemDetailText}>
                        • {detail.trackerName}: {detail.count} / {detail.goal}
                    </Text>
                ))}
            </View>
        </TouchableOpacity>
    );
};

// ─── Calendar ────────────────────────────────────────────────────────────────

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function CalendarView({ history, trackers, accentColor }: {
    history: HistoryRecord[];
    trackers: ReturnType<typeof useTrackers>['trackers'];
    accentColor: string;
}) {
    const router = useRouter();
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());

    const historyMap = useMemo(() => {
        const map = new Map<string, HistoryRecord>();
        history.forEach(r => map.set(r.date, r));
        return map;
    }, [history]);

    const totalDays = daysInMonth(year, month);
    const startDow = firstDayOfMonth(year, month);
    const todayStr = today.toISOString().split('T')[0];

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    // Build grid cells: nulls for leading empty, then 1..totalDays
    const cells: (number | null)[] = [
        ...Array(startDow).fill(null),
        ...Array.from({ length: totalDays }, (_, i) => i + 1),
    ];
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);

    const getDateStr = (day: number) => {
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${year}-${m}-${d}`;
    };

    return (
        <View>
            {/* Month Nav */}
            <View style={styles.calNav}>
                <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
                    <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.calNavTitle}>{MONTHS[month]} {year}</Text>
                <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.calRow}>
                {DAYS.map((d, i) => <Text key={i} style={styles.calDayHeader}>{d}</Text>)}
            </View>

            {/* Day grid */}
            {Array.from({ length: cells.length / 7 }, (_, row) => (
                <View key={row} style={styles.calRow}>
                    {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                        if (!day) return <View key={col} style={styles.calCell} />;
                        const dateStr = getDateStr(day);
                        const isFuture = dateStr > todayStr;
                        const isToday = dateStr === todayStr;
                        const record = historyMap.get(dateStr);
                        const perfect = record ? isPerfectDay(record, trackers) : false;
                        const hasData = !!record && record.totalVolume > 0;

                        let dotColor = 'transparent';
                        if (!isFuture && hasData) dotColor = perfect ? theme.colors.success : accentColor;

                        return (
                            <TouchableOpacity
                                key={col}
                                style={[
                                    styles.calCell,
                                    isToday && { backgroundColor: accentColor + '25', borderRadius: 20 },
                                ]}
                                onPress={() => record && router.push({ pathname: '/edit-history', params: { date: dateStr } })}
                                disabled={isFuture || !record}
                            >
                                <Text style={[
                                    styles.calDayNum,
                                    isFuture && { opacity: 0.25 },
                                    isToday && { color: accentColor, fontWeight: 'bold' },
                                ]}>{day}</Text>
                                <View style={[styles.calDot, { backgroundColor: dotColor }]} />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}

            {/* Legend */}
            <View style={styles.calLegend}>
                <View style={[styles.calDot, { backgroundColor: theme.colors.success }]} />
                <Text style={styles.calLegendText}>All goals met</Text>
                <View style={[styles.calDot, { backgroundColor: accentColor, marginLeft: 12 }]} />
                <Text style={styles.calLegendText}>Partial</Text>
            </View>
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function HistoryScreen() {
    const { history, trackers } = useTrackers();
    const router = useRouter();
    const accentColor = useAccentColor();
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [search, setSearch] = useState('');
    const [filterPerfect, setFilterPerfect] = useState(false);

    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => b.date.localeCompare(a.date));
    }, [history]);

    const filteredHistory = useMemo(() => {
        let result = sortedHistory;
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            result = result.filter(r =>
                r.date.includes(q) ||
                r.details.some(d => d.trackerName.toLowerCase().includes(q))
            );
        }
        if (filterPerfect) {
            result = result.filter(r => isPerfectDay(r, trackers));
        }
        return result;
    }, [sortedHistory, search, filterPerfect, trackers]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.topBar}>
                <Text style={styles.screenTitle}>History</Text>
                <View style={styles.topBarRight}>
                    {/* List / Calendar toggle */}
                    <View style={styles.viewToggle}>
                        <TouchableOpacity
                            style={[styles.viewToggleBtn, view === 'list' && { backgroundColor: accentColor }]}
                            onPress={() => setView('list')}
                        >
                            <Ionicons name="list-outline" size={16} color={view === 'list' ? '#fff' : theme.colors.secondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.viewToggleBtn, view === 'calendar' && { backgroundColor: accentColor }]}
                            onPress={() => setView('calendar')}
                        >
                            <Ionicons name="calendar-outline" size={16} color={view === 'calendar' ? '#fff' : theme.colors.secondary} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/edit-history')}>
                        <Ionicons name="add-circle-outline" size={28} color={accentColor} />
                    </TouchableOpacity>
                </View>
            </View>

            {view === 'calendar' ? (
                <FlatList
                    data={[]}
                    renderItem={null}
                    ListHeaderComponent={
                        <View style={styles.calendarWrapper}>
                            <CalendarView history={history} trackers={trackers} accentColor={accentColor} />
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            ) : (
                <>
                    {/* Search + Filter */}
                    <View style={styles.searchRow}>
                        <View style={styles.searchInputWrapper}>
                            <Ionicons name="search-outline" size={16} color={theme.colors.secondary} style={{ marginRight: 6 }} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by tracker or date..."
                                placeholderTextColor={theme.colors.secondary}
                                value={search}
                                onChangeText={setSearch}
                                clearButtonMode="while-editing"
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.filterBtn, filterPerfect && { backgroundColor: theme.colors.success }]}
                            onPress={() => setFilterPerfect(f => !f)}
                        >
                            <Ionicons name="checkmark-circle-outline" size={18} color={filterPerfect ? '#fff' : theme.colors.secondary} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={filteredHistory}
                        keyExtractor={item => item.date}
                        renderItem={({ item }) => <HistoryItem item={item} trackers={trackers} />}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>{search || filterPerfect ? 'No results.' : 'No history yet.'}</Text>
                                <Text style={styles.emptySubtext}>{!search && !filterPerfect ? 'Complete your daily goals to see them here.' : 'Try a different search or filter.'}</Text>
                            </View>
                        }
                    />
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: theme.colors.surface },
    screenTitle: { fontSize: theme.fontSizes.xl, fontWeight: 'bold', color: theme.colors.text },
    topBarRight: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.m },
    viewToggle: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 8, padding: 2 },
    viewToggleBtn: { padding: 6, borderRadius: 6 },

    // Search
    searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.s, gap: theme.spacing.s, borderBottomWidth: 1, borderBottomColor: theme.colors.surface },
    searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 10, paddingHorizontal: theme.spacing.s, paddingVertical: 8 },
    searchInput: { flex: 1, fontSize: theme.fontSizes.s, color: theme.colors.text },
    filterBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },

    // Calendar
    calendarWrapper: { padding: theme.spacing.m },
    calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.m },
    calNavBtn: { padding: 8 },
    calNavTitle: { fontSize: theme.fontSizes.l, fontWeight: 'bold', color: theme.colors.text },
    calRow: { flexDirection: 'row', marginBottom: 4 },
    calDayHeader: { flex: 1, textAlign: 'center', fontSize: 11, color: theme.colors.secondary, fontWeight: '600', paddingVertical: 4 },
    calCell: { flex: 1, alignItems: 'center', paddingVertical: 4 },
    calDayNum: { fontSize: theme.fontSizes.s, color: theme.colors.text },
    calDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
    calLegend: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.m, gap: 4 },
    calLegendText: { fontSize: 11, color: theme.colors.secondary },

    // List
    listContent: { padding: theme.spacing.m, paddingBottom: 100 },
    itemContainer: { backgroundColor: theme.colors.surface, padding: theme.spacing.m, borderRadius: 12, marginBottom: theme.spacing.m, borderLeftWidth: 4, borderLeftColor: theme.colors.accent },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.s, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: theme.spacing.s },
    itemDate: { fontSize: theme.fontSizes.m, fontWeight: 'bold', color: theme.colors.primary },
    itemVolume: { fontSize: theme.fontSizes.s, color: theme.colors.accent, fontWeight: '600' },
    itemList: { marginTop: theme.spacing.s },
    itemDetailText: { fontSize: theme.fontSizes.s, color: theme.colors.secondary, marginBottom: 4, lineHeight: 20 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.xl * 2 },
    emptyText: { fontSize: theme.fontSizes.l, fontWeight: 'bold', color: theme.colors.secondary, marginBottom: theme.spacing.s },
    emptySubtext: { fontSize: theme.fontSizes.m, color: theme.colors.secondary, textAlign: 'center', opacity: 0.7 },
});
