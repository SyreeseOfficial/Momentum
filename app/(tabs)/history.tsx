import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTrackers } from '../../src/context/TrackerContext';
import { theme } from '../../src/constants/theme';
import { format, parseISO, subDays, isAfter, startOfDay } from 'date-fns';
import { HistoryRecord } from '../../src/types';


// --- Components ---

const HistoryHeader = ({ weeklyVolume }: { weeklyVolume: number }) => (
    <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Weekly Volume</Text>
            <Text style={styles.headerValue}>{weeklyVolume}</Text>
            <Text style={styles.headerSubtitle}>Total volume in the last 7 days</Text>
        </View>
    </View>
);

const HistoryItem = ({ item }: { item: HistoryRecord }) => {
    const date = parseISO(item.date);
    const formattedDate = format(date, 'EEE, MMM d');

    return (
        <View style={styles.itemContainer}>
            <View style={styles.itemHeader}>
                <Text style={styles.itemDate}>{formattedDate}</Text>
                <Text style={styles.itemVolume}>Total Volume: {item.totalVolume}</Text>
            </View>
            <View style={styles.itemList}>
                {item.details.map((detail, index) => (
                    <Text key={index} style={styles.itemDetailText}>
                        • {detail.trackerName}: {detail.count} / {detail.goal}
                    </Text>
                ))}
            </View>
        </View>
    );
};

// --- Main Screen ---

export default function HistoryScreen() {
    const { history } = useTrackers();
    const router = useRouter();

    const sortedHistory = useMemo(() => {
        return [...history].sort((a, b) => {
            const dateA = parseISO(a.date);
            const dateB = parseISO(b.date);
            return dateB.getTime() - dateA.getTime();
        });
    }, [history]);

    const weeklyVolume = useMemo(() => {
        const today = startOfDay(new Date());
        const sevenDaysAgo = subDays(today, 7);

        return history
            .filter((record) => {
                const recordDate = parseISO(record.date);
                return isAfter(recordDate, sevenDaysAgo);
            })
            .reduce((sum, record) => sum + record.totalVolume, 0);
    }, [history]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.topBar}>
                <Text style={styles.screenTitle}>History</Text>
            </View>

            <FlatList
                data={sortedHistory}
                keyExtractor={(item) => item.date}
                renderItem={({ item }) => <HistoryItem item={item} />}
                ListHeaderComponent={<HistoryHeader weeklyVolume={weeklyVolume} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No history yet.</Text>
                        <Text style={styles.emptySubtext}>Complete your daily goals to see them here.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surface,
    },
    backButton: {
        padding: theme.spacing.s,
    },
    screenTitle: {
        fontSize: theme.fontSizes.l,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    listContent: {
        padding: theme.spacing.m,
        paddingBottom: 100, // Extra padding for bottom
    },
    // Header Widget Styles
    headerContainer: {
        marginBottom: theme.spacing.l,
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: theme.spacing.l,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    headerContent: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.secondary,
        marginBottom: theme.spacing.s,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerValue: {
        fontSize: 48, // Big Prominent Number
        fontWeight: 'bold',
        color: theme.colors.accent,
        marginBottom: theme.spacing.s,
    },
    headerSubtitle: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
    },
    // History Item Styles
    itemContainer: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: 12,
        marginBottom: theme.spacing.m,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary, // Or dynamic based on goal met?
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingBottom: theme.spacing.s,
    },
    itemDate: {
        fontSize: theme.fontSizes.m,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    itemVolume: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.accent,
        fontWeight: '600',
    },
    itemList: {
        marginTop: theme.spacing.s,
    },
    itemDetailText: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        marginBottom: 4,
        lineHeight: 20,
    },
    // Empty State
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.xl * 2,
    },
    emptyText: {
        fontSize: theme.fontSizes.l,
        fontWeight: 'bold',
        color: theme.colors.secondary,
        marginBottom: theme.spacing.s,
    },
    emptySubtext: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.secondary,
        textAlign: 'center',
        opacity: 0.7,
    },
});
