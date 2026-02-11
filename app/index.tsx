import React from 'react';
import { StyleSheet, Text, View, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { theme } from '../src/constants/theme';
import { useTrackers } from '../src/context/TrackerContext';
import { TrackerCard } from '../src/components/TrackerCard';

export default function HomeScreen() {
    const { trackers, incrementTracker, decrementTracker } = useTrackers();
    const today = new Date();
    const dateString = format(today, 'EEE, MMM d').toUpperCase();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.date}>{dateString}</Text>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        paddingHorizontal: theme.spacing.m,
        paddingTop: theme.spacing.m,
        paddingBottom: theme.spacing.l,
    },
    date: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        fontWeight: '600',
        letterSpacing: 1.5,
        marginBottom: theme.spacing.s,
    },
    title: {
        fontSize: theme.fontSizes.xl,
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: theme.spacing.m,
        paddingBottom: theme.spacing.xl,
    }
});
