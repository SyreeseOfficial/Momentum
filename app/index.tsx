import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { theme } from '../src/constants/theme';
import { useTrackers } from '../src/context/TrackerContext';

export default function HomeScreen() {
    const { trackers } = useTrackers();
    const today = new Date();
    const dateString = format(today, 'EEE, MMM d').toUpperCase();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.date}>{dateString}</Text>
                <Text style={styles.title}>Daily Consistency</Text>
            </View>
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
});
