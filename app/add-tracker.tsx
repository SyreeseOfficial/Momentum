import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTrackers } from '../src/context/TrackerContext';
import { theme } from '../src/constants/theme';

export default function AddTrackerScreen() {
    const router = useRouter();
    const { addTracker } = useTrackers();
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Please enter a tracker name.');
            return;
        }

        const goalNumber = parseInt(goal, 10);
        if (isNaN(goalNumber) || goalNumber <= 0) {
            Alert.alert('Validation Error', 'Please enter a valid daily goal (number greater than 0).');
            return;
        }

        addTracker(name.trim(), goalNumber);
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>New Tracker</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Tracker Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Drink Water"
                        placeholderTextColor={theme.colors.secondary}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Daily Goal</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 8"
                        placeholderTextColor={theme.colors.secondary}
                        value={goal}
                        onChangeText={setGoal}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save Tracker</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        padding: theme.spacing.m,
    },
    title: {
        fontSize: theme.fontSizes.xl,
        fontWeight: 'bold',
        color: theme.colors.primary,
        marginBottom: theme.spacing.xl,
        marginTop: theme.spacing.m,
    },
    formGroup: {
        marginBottom: theme.spacing.l,
    },
    label: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.secondary,
        marginBottom: theme.spacing.s,
    },
    input: {
        backgroundColor: theme.colors.surface,
        color: theme.colors.primary,
        padding: theme.spacing.m,
        borderRadius: 8,
        fontSize: theme.fontSizes.m,
        borderWidth: 1,
        borderColor: '#333',
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: theme.spacing.l,
        gap: theme.spacing.m,
    },
    saveButton: {
        flex: 1,
        backgroundColor: theme.colors.accent,
        padding: theme.spacing.m,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: theme.fontSizes.m,
        fontWeight: 'bold',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: 'transparent',
        padding: theme.spacing.m,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.secondary,
    },
    cancelButtonText: {
        color: theme.colors.secondary,
        fontSize: theme.fontSizes.m,
        fontWeight: '600',
    },
});
