import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isValid } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTrackers } from '../src/context/TrackerContext';
import { theme } from '../src/constants/theme';
import { HistoryRecord } from '../src/types';

export default function EditHistoryScreen() {
    const router = useRouter();
    const { date: dateParam } = useLocalSearchParams<{ date: string }>();
    const { history, trackers, saveHistoryRecord, deleteHistoryRecord } = useTrackers();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [recordDetails, setRecordDetails] = useState<{ trackerName: string; count: number; goal: number }[]>([]);

    useEffect(() => {
        if (dateParam) {
            const parsedDate = parseISO(dateParam);
            if (isValid(parsedDate)) {
                setSelectedDate(parsedDate);
                loadRecordForDate(parsedDate);
            }
        } else {
            // New record, default to today or load if exists
            loadRecordForDate(new Date());
        }
    }, [dateParam]);

    const loadRecordForDate = (date: Date) => {
        const dateString = format(date, 'yyyy-MM-dd');
        const existingRecord = history.find(h => h.date === dateString);

        if (existingRecord) {
            setRecordDetails(existingRecord.details.map(d => ({ ...d })));
        } else {
            // Initialize with current trackers
            setRecordDetails(trackers.map(t => ({
                trackerName: t.name,
                count: 0,
                goal: t.dailyGoal
            })));
        }
    };

    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
            loadRecordForDate(date);
        }
    };

    const handleCountChange = (index: number, text: string) => {
        const newCount = parseInt(text) || 0;
        setRecordDetails(prev => {
            const newDetails = [...prev];
            newDetails[index].count = newCount;
            return newDetails;
        });
    };

    const handleSave = () => {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        const totalVolume = recordDetails.reduce((sum, item) => sum + item.count, 0);

        const newRecord: HistoryRecord = {
            date: dateString,
            totalVolume,
            details: recordDetails
        };

        saveHistoryRecord(newRecord);
        router.back();
    };

    const handleDelete = () => {
        Alert.alert(
            "Delete Record",
            "Are you sure you want to delete this history record?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        const dateString = format(selectedDate, 'yyyy-MM-dd');
                        deleteHistoryRecord(dateString);
                        router.back();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>{dateParam ? 'Edit History' : 'Add History'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dateText}>{format(selectedDate, 'PPP')}</Text>
                        <Ionicons name="calendar-outline" size={20} color={theme.colors.secondary} />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Trackers</Text>
                    {recordDetails.length === 0 ? (
                        <Text style={styles.emptyText}>No trackers available to record.</Text>
                    ) : (
                        recordDetails.map((detail, index) => (
                            <View key={index} style={styles.trackerRow}>
                                <Text style={styles.trackerName}>{detail.trackerName}</Text>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.countInput}
                                        keyboardType="numeric"
                                        value={detail.count.toString()}
                                        onChangeText={(text) => handleCountChange(index, text)}
                                    />
                                    <Text style={styles.goalText}>/ {detail.goal}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Record</Text>
                </TouchableOpacity>

                {history.find(h => h.date === format(selectedDate, 'yyyy-MM-dd')) && (
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Text style={styles.deleteButtonText}>Delete Record</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
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
        justifyContent: 'space-between',
        padding: theme.spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surface,
    },
    backButton: {
        padding: theme.spacing.s,
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
        marginBottom: theme.spacing.l,
    },
    label: {
        fontSize: theme.fontSizes.m,
        fontWeight: '600',
        color: theme.colors.secondary,
        marginBottom: theme.spacing.s,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.m,
        borderRadius: 8,
    },
    dateText: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.text,
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
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countInput: {
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        padding: theme.spacing.s,
        borderRadius: 4,
        width: 60,
        textAlign: 'center',
        fontSize: theme.fontSizes.m,
        marginRight: theme.spacing.s,
    },
    goalText: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
    },
    emptyText: {
        fontStyle: 'italic',
        color: theme.colors.secondary,
    },
    saveButton: {
        backgroundColor: theme.colors.accent,
        padding: theme.spacing.m,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: theme.spacing.m,
    },
    saveButtonText: {
        color: '#fff', // Assuming accent is a color that works with white text, or theme.colors.background
        fontSize: theme.fontSizes.m,
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: 'transparent',
        padding: theme.spacing.m,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: theme.spacing.s,
        borderWidth: 1,
        borderColor: theme.colors.danger,
    },
    deleteButtonText: {
        color: theme.colors.danger,
        fontSize: theme.fontSizes.m,
        fontWeight: '600',
    },
});
