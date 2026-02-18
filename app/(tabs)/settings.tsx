import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Switch, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTrackers } from '../../src/context/TrackerContext';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';

export default function SettingsScreen() {
    const router = useRouter();
    const {
        trackers,
        history,
        deleteTracker,
        clearAllData,
        notificationEnabled,
        notificationTime,
        toggleNotification,
        updateNotificationTime,
        resetToday
    } = useTrackers();

    const [showTimePicker, setShowTimePicker] = useState(false);

    const totalActions = history.reduce((acc, record) => acc + record.totalVolume, 0);
    const activeTrackersCount = trackers.length;

    const handleDeleteTracker = (id: string, name: string) => {
        Alert.alert(
            "Delete Tracker",
            `Are you sure you want to delete "${name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteTracker(id)
                }
            ]
        );
    };

    const handleClearAllData = () => {
        Alert.alert(
            "Clear All Data",
            "Are you sure you want to delete ALL trackers and history? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All Data",
                    style: "destructive",
                    onPress: () => {
                        clearAllData();
                        Alert.alert("Success", "All data has been cleared.");
                    }
                }
            ]
        );
    };

    const handleResetToday = () => {
        Alert.alert(
            "Reset Today",
            "Are you sure you want to reset all progress for today?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: () => {
                        resetToday();
                        Alert.alert("Success", "Today's progress has been reset.");
                    }
                }
            ]
        );
    };

    const handleExportData = async () => {
        try {
            // Create CSV content
            // Headers: Date, Name, Count
            let csvContent = "Date,Name,Count\n";

            // Loop through history to build CSV rows
            // HistoryLog is HistoryRecord[]
            // HistoryRecord is { date, totalVolume, details: { trackerName, count, goal }[] }

            if (history && history.length > 0) {
                history.forEach(record => {
                    if (record.details && record.details.length > 0) {
                        record.details.forEach(detail => {
                            // Ensure CSV safety by escaping commas if necessary, though simple names might not need it
                            const safeName = detail.trackerName.includes(',') ? `"${detail.trackerName}"` : detail.trackerName;
                            csvContent += `${record.date},${safeName},${detail.count}\n`;
                        });
                    }
                });
            } else {
                Alert.alert("No Data", "There is no history data to export yet.");
                return;
            }

            // Define file path - use documentDirectory
            if (!(FileSystem as any).documentDirectory) {
                Alert.alert("Error", "Document directory not found.");
                return;
            }
            const fileUri = (FileSystem as any).documentDirectory + "MomentumData.csv";

            // Write to file
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });

            // Share file
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert("Error", "Sharing is not available on this device");
            }

        } catch (error) {
            console.error("Export error:", error);
            Alert.alert("Error", "Failed to export data. Please try again.");
        }
    };
    const onTimeChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || notificationTime;
        setShowTimePicker(Platform.OS === 'ios');
        if (currentDate) {
            updateNotificationTime(currentDate);
        }
    };

    const formatTime = (date: Date | null) => {
        if (!date) return '9:00 AM';
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Manage Trackers</Text>
                    {trackers.length === 0 ? (
                        <Text style={styles.emptyText}>No trackers yet.</Text>
                    ) : (
                        trackers.map(tracker => (
                            <View key={tracker.id} style={styles.trackerRow}>
                                <Text style={styles.trackerName}>{tracker.name}</Text>
                                <TouchableOpacity
                                    onPress={() => handleDeleteTracker(tracker.id, tracker.name)}
                                    style={styles.deleteIcon}
                                >
                                    <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data Management</Text>

                    <View style={styles.settingRow}>
                        <View>
                            <Text style={styles.settingLabel}>Daily Reminders</Text>
                            <Text style={styles.settingSubLabel}>Get notified to log your progress</Text>
                        </View>
                        <Switch
                            trackColor={{ false: theme.colors.surface, true: theme.colors.primary }}
                            thumbColor={theme.colors.text}
                            ios_backgroundColor={theme.colors.surface}
                            onValueChange={toggleNotification}
                            value={notificationEnabled}
                        />
                    </View>

                    {notificationEnabled && (
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Reminder Time</Text>
                            {Platform.OS === 'android' && (
                                <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                                    <Text style={styles.timeValue}>{formatTime(notificationTime)}</Text>
                                </TouchableOpacity>
                            )}
                            {Platform.OS === 'ios' && (
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={notificationTime || new Date()}
                                    mode="time"
                                    is24Hour={false}
                                    display="default"
                                    onChange={onTimeChange}
                                    themeVariant="dark"
                                />
                            )}
                        </View>
                    )}

                    {showTimePicker && Platform.OS === 'android' && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={notificationTime || new Date()}
                            mode="time"
                            is24Hour={false}
                            display="default"
                            onChange={onTimeChange}
                        />
                    )}


                    <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
                        <Ionicons name="download-outline" size={20} color={theme.colors.background} />
                        <Text style={styles.actionButtonText}>Export CSV</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.clearButton]}
                        onPress={handleClearAllData}
                    >
                        <Ionicons name="trash-outline" size={20} color={theme.colors.primary} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Clear All Data</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.section, styles.aboutSection]}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <View style={styles.aboutCard}>
                        <Ionicons name="code-slash-outline" size={32} color={theme.colors.accent} style={styles.aboutIcon} />
                        <Text style={styles.aboutTitle}>Momentum</Text>
                        <Text style={styles.aboutSubtitle}>Built by Syreese Delos Santos</Text>
                        <Text style={styles.aboutNote}>Built in ~30 mins 🚀</Text>

                        <TouchableOpacity
                            style={styles.githubButton}
                            onPress={() => Linking.openURL('https://github.com/SyreeseOfficial/Momentum')}
                        >
                            <Ionicons name="logo-github" size={20} color={theme.colors.text} />
                            <Text style={styles.githubButtonText}>View Source on GitHub</Text>
                        </TouchableOpacity>

                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{activeTrackersCount}</Text>
                                <Text style={styles.statLabel}>Active Trackers</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{totalActions}</Text>
                                <Text style={styles.statLabel}>Total Actions</Text>
                            </View>
                        </View>
                    </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.m,
        paddingTop: 60, // Adjust for status bar if needed, usually SafeAreaView handles this but simple padding works
        backgroundColor: theme.colors.surface,
    },
    backButton: {
        marginRight: theme.spacing.m,
    },
    title: {
        fontSize: theme.fontSizes.l,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    content: {
        padding: theme.spacing.m,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.fontSizes.m,
        fontWeight: '600',
        color: theme.colors.secondary,
        marginBottom: theme.spacing.m,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    trackerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: 8,
        marginBottom: theme.spacing.s,
    },
    trackerName: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.primary,
    },
    deleteIcon: {
        padding: theme.spacing.s,
    },
    emptyText: {
        color: theme.colors.secondary,
        fontStyle: 'italic',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.m,
        borderRadius: 8,
        marginBottom: theme.spacing.m,
    },
    actionButtonText: {
        marginLeft: theme.spacing.s,
        fontSize: theme.fontSizes.m,
        fontWeight: '600',
        color: theme.colors.background,
    },
    clearButton: {
        backgroundColor: theme.colors.danger,
    },
    aboutSection: {
        marginTop: theme.spacing.l,
        marginBottom: 40,
    },
    aboutCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.l,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.background, // Subtle border
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        // Elevation for Android
        elevation: 8,
    },
    aboutIcon: {
        marginBottom: theme.spacing.s,
    },
    aboutTitle: {
        fontSize: theme.fontSizes.xl,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 4,
    },
    aboutSubtitle: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.primary,
        fontWeight: '600',
        marginBottom: theme.spacing.s,
    },
    aboutNote: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        fontStyle: 'italic',
        marginBottom: theme.spacing.l,
    },
    statsContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.background,
        paddingTop: theme.spacing.m,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: theme.fontSizes.l,
        fontWeight: 'bold',
        color: theme.colors.accent,
    },
    statLabel: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: '80%',
        backgroundColor: theme.colors.background,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surface,
    },
    settingLabel: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.text,
    },
    settingSubLabel: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        marginTop: 2,
    },
    timeValue: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.accent,
        fontWeight: 'bold',
    },
    githubButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
        borderRadius: 20,
        marginBottom: theme.spacing.l,
        gap: 8,
    },
    githubButtonText: {
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: theme.fontSizes.s,
    },
});
