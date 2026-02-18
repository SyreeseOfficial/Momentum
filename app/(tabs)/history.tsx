import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTrackers } from '../../src/context/TrackerContext';
import { theme } from '../../src/constants/theme';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { HistoryRecord } from '../../src/types';


// --- Components ---



const HistoryItem = ({ item }: { item: HistoryRecord }) => {
    const router = useRouter();
    const date = parseISO(item.date);
    const formattedDate = format(date, 'EEE, MMM d');

    return (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => router.push({ pathname: "/edit-history", params: { date: item.date } })}
        >
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
        </TouchableOpacity>
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



    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.topBar}>
                <Text style={styles.screenTitle}>History</Text>
                <TouchableOpacity onPress={() => router.push("/edit-history")}>
                    <Ionicons name="add-circle-outline" size={28} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={sortedHistory}
                keyExtractor={(item) => item.date}
                renderItem={({ item }) => <HistoryItem item={item} />}
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
