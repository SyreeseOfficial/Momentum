import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTrackers } from '../../src/context/TrackerContext';
import { theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function SettingsScreen() {
    const router = useRouter();
    const { trackers, history, deleteTracker, clearAllData } = useTrackers();

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

            // Define file path
            // @ts-ignore
            if (!FileSystem.cacheDirectory) {
                Alert.alert("Error", "Cache directory not found.");
                return;
            }
            // @ts-ignore
            const fileUri = FileSystem.cacheDirectory + "MomentumData.csv";

            // Write to file
            // @ts-ignore
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

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
});
