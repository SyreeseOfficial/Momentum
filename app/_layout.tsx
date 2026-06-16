import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TrackerProvider } from '../src/context/TrackerContext';
import { ThemeProvider, useAppTheme } from '../src/context/ThemeContext';
import { useTrackers } from '../src/context/TrackerContext';
import * as LocalAuthentication from 'expo-local-authentication';

function AppLockGate({ children }: { children: React.ReactNode }) {
    const { preferences } = useTrackers();
    const theme = useAppTheme();
    const [locked, setLocked] = useState(preferences.appLockEnabled);

    useEffect(() => {
        if (preferences.appLockEnabled) {
            setLocked(true);
            authenticate();
        } else {
            setLocked(false);
        }
    }, [preferences.appLockEnabled]);

    // Re-lock when app comes back from background
    useEffect(() => {
        const sub = AppState.addEventListener('change', state => {
            if (state === 'active' && preferences.appLockEnabled) {
                setLocked(true);
                authenticate();
            }
        });
        return () => sub.remove();
    }, [preferences.appLockEnabled]);

    const authenticate = async () => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!hasHardware || !isEnrolled) { setLocked(false); return; }
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock Momentum',
                fallbackLabel: 'Use PIN',
                cancelLabel: 'Cancel',
            });
            if (result.success) setLocked(false);
        } catch {
            setLocked(false);
        }
    };

    if (locked) {
        return (
            <View style={[lockStyles.container, { backgroundColor: theme.colors.background }]}>
                <Text style={[lockStyles.icon]}>🔒</Text>
                <Text style={[lockStyles.title, { color: theme.colors.text }]}>Momentum is locked</Text>
                <TouchableOpacity style={[lockStyles.btn, { backgroundColor: theme.colors.accent }]} onPress={authenticate}>
                    <Text style={lockStyles.btnText}>Unlock</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return <>{children}</>;
}

const lockStyles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
    icon: { fontSize: 56 },
    title: { fontSize: 20, fontWeight: 'bold' },
    btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
    btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

function ThemedStack() {
    const theme = useAppTheme();
    return (
        <>
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.colors.background },
                }}
            />
        </>
    );
}

export default function RootLayout() {
    return (
        <TrackerProvider>
            <ThemeProvider>
                <AppLockGate>
                    <ThemedStack />
                </AppLockGate>
            </ThemeProvider>
        </TrackerProvider>
    );
}
