import React from 'react';
import { StyleSheet, Text, View, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { theme } from '../../src/constants/theme';
import { useTrackers } from '../../src/context/TrackerContext';
import { useStreaks } from '../../src/hooks/useStreaks';
import { TrackerCard } from '../../src/components/TrackerCard';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
    const router = useRouter();
    const { trackers, incrementTracker, decrementTracker } = useTrackers();
    const { currentStreak, bestStreak } = useStreaks();
    const today = new Date();
    const dateString = format(today, 'EEE, MMM d').toUpperCase();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.date}>{dateString}</Text>
                    <View style={styles.streakContainer}>
                        <Text style={styles.streakText}>🔥 {currentStreak}</Text>
                        <Text style={[styles.streakText, { marginLeft: 12 }]}>🏆 {bestStreak}</Text>
                    </View>
                </View>
                <Text style={styles.title}>Daily Consistency</Text>
            </View>

            <FlatList
                data={trackers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TrackerCard
                        name={item.name}
                        count={item.count}
                        goal={item.dailyGoal}
                        onIncrement={() => incrementTracker(item.id)}
                        onDecrement={() => decrementTracker(item.id)}
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
    },
    streakText: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    title: {
        fontSize: theme.fontSizes.xl,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.xl + 80, // Extra padding for FAB
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
});
