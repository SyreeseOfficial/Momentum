import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
    Switch, Platform, Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTrackers } from '../../src/context/TrackerContext';
import { useAppTheme } from '../../src/context/ThemeContext';
import { Theme } from '../../src/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import appJson from '../../app.json';

const APP_VERSION = appJson.expo.version;

const ACCENT_COLORS = [
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Purple', value: '#A855F7' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Green', value: '#22C55E' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Red', value: '#EF4444' },
];

const CHANGELOG = [
    {
        version: '1.1.0',
        date: 'Jun 2025',
        notes: [
            'Comprehensive stats dashboard with 10+ metrics',
            'Achievements & celebration animations',
            'Emoji support on trackers',
            'Archive habits (restore anytime)',
            'Sorting, weekend goals, heatmap customization',
            'Custom day reset time & week start day',
        ],
    },
    {
        version: '1.0.0',
        date: 'Jun 2025',
        notes: [
            'Initial release',
            'Daily habit trackers',
            'Streaks & history',
            'Daily reminders',
        ],
    },
];

// ─── Reusable setting row components ──────────────────────────────────────────

type SettingsStyles = ReturnType<typeof createStyles>;
const SettingsStylesCtx = React.createContext<SettingsStyles | null>(null);
const useSettingsStyles = () => React.useContext(SettingsStylesCtx)!;

function SectionHeader({ title }: { title: string }) {
    const styles = useSettingsStyles();
    return <Text style={styles.sectionTitle}>{title}</Text>;
}

function SettingRow({ label, sub, right }: { label: string; sub?: string; right: React.ReactNode }) {
    const styles = useSettingsStyles();
    return (
        <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
                <Text style={styles.settingLabel}>{label}</Text>
                {sub ? <Text style={styles.settingSubLabel}>{sub}</Text> : null}
            </View>
            {right}
        </View>
    );
}

function SegmentedControl<T extends string>({
    options, value, onChange, labels,
}: {
    options: T[];
    value: T;
    onChange: (v: T) => void;
    labels?: Record<T, string>;
}) {
    const styles = useSettingsStyles();
    return (
        <View style={styles.segmented}>
            {options.map(opt => (
                <TouchableOpacity
                    key={opt}
                    style={[styles.segmentBtn, value === opt && styles.segmentBtnActive]}
                    onPress={() => onChange(opt)}
                >
                    <Text style={[styles.segmentText, value === opt && styles.segmentTextActive]}>
                        {labels ? labels[opt] : opt}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const {
        trackers,
        history,
        deleteTracker,
        archiveTracker,
        unarchiveTracker,
        clearAllData,
        factoryReset,
        notificationEnabled,
        notificationTime,
        toggleNotification,
        updateNotificationTime,
        resetToday,
        preferences,
        updatePreference,
    } = useTrackers();

    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showResetTimePicker, setShowResetTimePicker] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);

    const activeTrackers = trackers.filter(t => !t.isArchived);
    const archivedTrackers = trackers.filter(t => t.isArchived);
    const totalActions = history.reduce((acc, r) => acc + r.totalVolume, 0);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleTrackerOptions = (id: string, name: string) => {
        Alert.alert(name, undefined, [
            { text: 'Archive', onPress: () => archiveTracker(id) },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () =>
                    Alert.alert('Delete Tracker', `Permanently delete "${name}"? This cannot be undone.`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => deleteTracker(id) },
                    ]),
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleClearAllData = () => {
        Alert.alert('Clear All Data', 'Delete all trackers and history? Cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear All Data',
                style: 'destructive',
                onPress: () => {
                    clearAllData();
                    Alert.alert('Done', 'All data has been cleared.');
                },
            },
        ]);
    };

    const handleFactoryReset = () => {
        Alert.alert(
            'Factory Reset',
            'Reset everything to defaults — all trackers, history, achievements, and settings will be deleted. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Factory Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await factoryReset();
                        Alert.alert('Done', 'App has been reset to factory defaults.');
                    },
                },
            ]
        );
    };

    const handleResetToday = () => {
        Alert.alert('Reset Today', "Reset all progress for today?", [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: () => resetToday() },
        ]);
    };

    const handleExportData = async () => {
        try {
            if (!history || history.length === 0) {
                Alert.alert('No Data', 'There is no history data to export yet.');
                return;
            }
            let csvContent = "Date,Name,Count\n";
            history.forEach(record => {
                record.details?.forEach(detail => {
                    const safeName = detail.trackerName.includes(',') ? `"${detail.trackerName}"` : detail.trackerName;
                    csvContent += `${record.date},${safeName},${detail.count}\n`;
                });
            });
            if (!(FileSystem as any).documentDirectory) {
                Alert.alert('Error', 'Document directory not found.');
                return;
            }
            const fileUri = (FileSystem as any).documentDirectory + 'MomentumData.csv';
            await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Error', 'Sharing is not available on this device.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to export data. Please try again.');
        }
    };

    const onNotifTimeChange = (event: any, selectedDate?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedDate) updateNotificationTime(selectedDate);
    };

    const onResetTimeChange = (event: any, selectedDate?: Date) => {
        setShowResetTimePicker(Platform.OS === 'ios');
        if (selectedDate) {
            updatePreference('dayResetHour', selectedDate.getHours());
        }
    };

    const formatTime = (date: Date | null) => {
        if (!date) return '9:00 AM';
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const formatResetHour = (hour: number) => {
        if (hour === 0) return 'Midnight (default)';
        const d = new Date();
        d.setHours(hour, 0, 0, 0);
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const resetTimeDate = new Date();
    resetTimeDate.setHours(preferences.dayResetHour, 0, 0, 0);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <SettingsStylesCtx.Provider value={styles}>
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* ── Tracker Behavior ── */}
                <View style={styles.section}>
                    <SectionHeader title="Tracker Behavior" />

                    <View style={styles.card}>
                        <SettingRow
                            label="Day Reset Time"
                            sub={formatResetHour(preferences.dayResetHour)}
                            right={
                                Platform.OS === 'android' ? (
                                    <TouchableOpacity onPress={() => setShowResetTimePicker(true)}>
                                        <Text style={styles.linkText}>Change</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <DateTimePicker
                                        value={resetTimeDate}
                                        mode="time"
                                        display="default"
                                        onChange={onResetTimeChange}
                                        themeVariant="dark"
                                    />
                                )
                            }
                        />
                        <View style={styles.rowDivider} />
                        <SettingRow
                            label="Sorting"
                            sub="Order of trackers on home screen"
                            right={null}
                        />
                        <SegmentedControl
                            options={['custom', 'alphabetical', 'goalProximity', 'frequency'] as const}
                            value={preferences.sortPreference}
                            onChange={v => updatePreference('sortPreference', v)}
                            labels={{ custom: 'Custom', alphabetical: 'A–Z', goalProximity: 'Progress', frequency: 'Count' }}
                        />
                        <View style={styles.rowDivider} />
                        <SettingRow
                            label="Weekend Goals"
                            sub="Reduce goals on Saturday & Sunday"
                            right={
                                <Switch
                                    trackColor={{ false: theme.colors.surface, true: theme.colors.accent }}
                                    thumbColor={theme.colors.text}
                                    ios_backgroundColor={theme.colors.surface}
                                    onValueChange={v => updatePreference('weekendGoalEnabled', v)}
                                    value={preferences.weekendGoalEnabled}
                                />
                            }
                        />
                        {preferences.weekendGoalEnabled && (
                            <>
                                <Text style={styles.subLabel}>Weekend goal multiplier</Text>
                                <SegmentedControl
                                    options={[0.25, 0.5, 0.75, 1.0] as any}
                                    value={preferences.weekendGoalMultiplier as any}
                                    onChange={v => updatePreference('weekendGoalMultiplier', Number(v))}
                                    labels={{ '0.25': '25%', '0.5': '50%', '0.75': '75%', '1': '100%' } as any}
                                />
                            </>
                        )}
                    </View>

                    {showResetTimePicker && Platform.OS === 'android' && (
                        <DateTimePicker
                            value={resetTimeDate}
                            mode="time"
                            display="default"
                            onChange={onResetTimeChange}
                        />
                    )}
                </View>

                {/* ── Look & Feel ── */}
                <View style={styles.section}>
                    <SectionHeader title="Look & Feel" />

                    {/* Color scheme */}
                    <View style={[styles.card, { marginBottom: theme.spacing.m }]}>
                        <SettingRow label="App Theme" sub={undefined} right={null} />
                        <SegmentedControl
                            options={['dark', 'light', 'system'] as const}
                            value={preferences.colorScheme ?? 'dark'}
                            onChange={v => updatePreference('colorScheme', v)}
                            labels={{ dark: '🌙 Dark', light: '☀️ Light', system: '⚙️ System' }}
                        />
                    </View>

                    {/* Haptic intensity */}
                    <View style={[styles.card, { marginBottom: theme.spacing.m }]}>
                        <SettingRow label="Haptic Feedback" sub={undefined} right={null} />
                        <SegmentedControl
                            options={['none', 'light', 'medium', 'strong'] as const}
                            value={preferences.hapticIntensity ?? 'light'}
                            onChange={v => updatePreference('hapticIntensity', v)}
                            labels={{ none: 'Off', light: 'Light', medium: 'Medium', strong: 'Strong' }}
                        />
                    </View>

                    {/* Sound effects */}
                    <View style={[styles.card, { marginBottom: theme.spacing.m }]}>
                        <SettingRow
                            label="Sound Effects"
                            sub="Plays tones on tap, goal, and achievement"
                            right={
                                <Switch
                                    trackColor={{ false: theme.colors.surface, true: theme.colors.accent }}
                                    thumbColor={theme.colors.text}
                                    ios_backgroundColor={theme.colors.surface}
                                    onValueChange={v => updatePreference('soundEnabled', v)}
                                    value={preferences.soundEnabled ?? false}
                                />
                            }
                        />
                    </View>

                    {/* Reduce animations */}
                    <View style={[styles.card, { marginBottom: theme.spacing.m }]}>
                        <SettingRow
                            label="Reduce Animations"
                            sub="Disables confetti and card animations"
                            right={
                                <Switch
                                    trackColor={{ false: theme.colors.surface, true: theme.colors.accent }}
                                    thumbColor={theme.colors.text}
                                    ios_backgroundColor={theme.colors.surface}
                                    onValueChange={v => updatePreference('reduceAnimations', v)}
                                    value={preferences.reduceAnimations ?? false}
                                />
                            }
                        />
                    </View>

                    {/* App Lock */}
                    <View style={styles.card}>
                        <SettingRow
                            label="App Lock"
                            sub="Require Face ID / biometrics to open app"
                            right={
                                <Switch
                                    trackColor={{ false: theme.colors.surface, true: theme.colors.accent }}
                                    thumbColor={theme.colors.text}
                                    ios_backgroundColor={theme.colors.surface}
                                    onValueChange={v => updatePreference('appLockEnabled', v)}
                                    value={preferences.appLockEnabled ?? false}
                                />
                            }
                        />
                    </View>
                </View>

                {/* ── Display ── */}
                <View style={styles.section}>
                    <SectionHeader title="Display" />

                    {/* Color Theme */}
                    <View style={[styles.card, { marginBottom: theme.spacing.m }]}>
                        <Text style={styles.settingLabel}>Accent Color</Text>
                        <View style={styles.colorRow}>
                            {ACCENT_COLORS.map(c => (
                                <TouchableOpacity
                                    key={c.value}
                                    style={[styles.colorSwatch, { backgroundColor: c.value }, preferences.accentColor === c.value && styles.colorSwatchSelected]}
                                    onPress={() => updatePreference('accentColor', c.value)}
                                >
                                    {preferences.accentColor === c.value && (
                                        <Text style={styles.colorCheck}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Tracker Card Options */}
                    <View style={[styles.card, { marginBottom: theme.spacing.m }]}>
                        <SettingRow
                            label="Card Style"
                            sub={undefined}
                            right={null}
                        />
                        <SegmentedControl
                            options={['detailed', 'minimal'] as const}
                            value={preferences.cardStyle}
                            onChange={v => updatePreference('cardStyle', v)}
                            labels={{ detailed: 'Detailed', minimal: 'Minimal' }}
                        />
                        <View style={styles.rowDivider} />
                        <SettingRow
                            label="Show Emoji on Card"
                            sub={undefined}
                            right={
                                <Switch
                                    trackColor={{ false: theme.colors.surface, true: theme.colors.accent }}
                                    thumbColor={theme.colors.text}
                                    ios_backgroundColor={theme.colors.surface}
                                    onValueChange={v => updatePreference('showEmojiOnCard', v)}
                                    value={preferences.showEmojiOnCard}
                                />
                            }
                        />
                        <View style={styles.rowDivider} />
                        <SettingRow
                            label="Show Goal on Card"
                            sub={undefined}
                            right={
                                <Switch
                                    trackColor={{ false: theme.colors.surface, true: theme.colors.accent }}
                                    thumbColor={theme.colors.text}
                                    ios_backgroundColor={theme.colors.surface}
                                    onValueChange={v => updatePreference('showGoalOnCard', v)}
                                    value={preferences.showGoalOnCard}
                                />
                            }
                        />
                    </View>

                    {/* Grid Size */}
                    <View style={[styles.card, { marginBottom: theme.spacing.m }]}>
                        <SettingRow
                            label="Home Grid Size"
                            sub="Number of tracker columns on the home screen"
                            right={null}
                        />
                        <SegmentedControl
                            options={[1, 2, 3] as any}
                            value={preferences.gridColumns as any}
                            onChange={v => updatePreference('gridColumns', Number(v) as 1 | 2 | 3)}
                            labels={{ '1': '1 Column', '2': '2 Columns', '3': '3 Columns' } as any}
                        />
                    </View>

                    {/* Week Start Day */}
                    <View style={styles.card}>
                        <SettingRow
                            label="Week Starts On"
                            sub={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][preferences.weekStartDay ?? 0]}
                            right={null}
                        />
                        <SegmentedControl
                            options={[0, 1, 2, 3, 4, 5, 6] as any}
                            value={(preferences.weekStartDay ?? 0) as any}
                            onChange={v => updatePreference('weekStartDay', Number(v))}
                            labels={{ '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat' } as any}
                        />
                    </View>
                </View>

                {/* ── Manage Trackers ── */}
                <View style={styles.section}>
                    <SectionHeader title="Manage Trackers" />
                    <View style={styles.card}>
                        {activeTrackers.length === 0 ? (
                            <Text style={styles.emptyText}>No active trackers.</Text>
                        ) : (
                            activeTrackers.map((tracker, i) => (
                                <View key={tracker.id}>
                                    {i > 0 && <View style={styles.rowDivider} />}
                                    <View style={styles.trackerRow}>
                                        <Text style={styles.trackerName}>
                                            {tracker.emoji ? `${tracker.emoji} ` : ''}{tracker.name}
                                        </Text>
                                        <TouchableOpacity onPress={() => handleTrackerOptions(tracker.id, tracker.name)}>
                                            <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.secondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>

                    {archivedTrackers.length > 0 && (
                        <View style={[styles.card, { marginTop: theme.spacing.m }]}>
                            <Text style={styles.archivedLabel}>Archived</Text>
                            {archivedTrackers.map((tracker, i) => (
                                <View key={tracker.id}>
                                    {i > 0 && <View style={styles.rowDivider} />}
                                    <View style={styles.trackerRow}>
                                        <Text style={[styles.trackerName, styles.trackerNameArchived]}>
                                            {tracker.emoji ? `${tracker.emoji} ` : ''}{tracker.name}
                                        </Text>
                                        <View style={styles.archivedActions}>
                                            <TouchableOpacity onPress={() => unarchiveTracker(tracker.id)} style={styles.iconBtn}>
                                                <Ionicons name="refresh-outline" size={20} color={theme.colors.accent} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() =>
                                                    Alert.alert('Delete', `Permanently delete "${tracker.name}"?`, [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Delete', style: 'destructive', onPress: () => deleteTracker(tracker.id) },
                                                    ])
                                                }
                                                style={styles.iconBtn}
                                            >
                                                <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* ── Data Management ── */}
                <View style={styles.section}>
                    <SectionHeader title="Data Management" />
                    <View style={styles.card}>
                        <SettingRow
                            label="Daily Reminders"
                            sub="Get notified to log your progress"
                            right={
                                <Switch
                                    trackColor={{ false: theme.colors.surface, true: theme.colors.accent }}
                                    thumbColor={theme.colors.text}
                                    ios_backgroundColor={theme.colors.surface}
                                    onValueChange={toggleNotification}
                                    value={notificationEnabled}
                                />
                            }
                        />
                        {notificationEnabled && (
                            <>
                                <View style={styles.rowDivider} />
                                <SettingRow
                                    label="Reminder Time"
                                    sub={undefined}
                                    right={
                                        Platform.OS === 'android' ? (
                                            <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                                                <Text style={styles.linkText}>{formatTime(notificationTime)}</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <DateTimePicker
                                                value={notificationTime || new Date()}
                                                mode="time"
                                                display="default"
                                                onChange={onNotifTimeChange}
                                                themeVariant="dark"
                                            />
                                        )
                                    }
                                />
                            </>
                        )}
                    </View>

                    {showTimePicker && Platform.OS === 'android' && (
                        <DateTimePicker
                            value={notificationTime || new Date()}
                            mode="time"
                            display="default"
                            onChange={onNotifTimeChange}
                        />
                    )}

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
                            <Ionicons name="download-outline" size={20} color={theme.colors.background} />
                            <Text style={styles.actionButtonText}>Export CSV</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, styles.dangerOutlineButton]} onPress={handleResetToday}>
                            <Ionicons name="refresh-outline" size={20} color={theme.colors.danger} />
                            <Text style={[styles.actionButtonText, { color: theme.colors.danger }]}>Reset Today's Progress</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, styles.dangerOutlineButton]} onPress={handleClearAllData}>
                            <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                            <Text style={[styles.actionButtonText, { color: theme.colors.danger }]}>Clear All Data</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, styles.dangerSolidButton]} onPress={handleFactoryReset}>
                            <Ionicons name="nuclear-outline" size={20} color="#fff" />
                            <Text style={[styles.actionButtonText, { color: '#fff' }]}>Factory Reset</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── About ── */}
                <View style={[styles.section, styles.aboutSection]}>
                    <SectionHeader title="About" />
                    <View style={styles.card}>
                        <View style={styles.aboutHeader}>
                            <Ionicons name="code-slash-outline" size={32} color={theme.colors.accent} />
                            <View style={styles.aboutTitleBlock}>
                                <Text style={styles.aboutTitle}>Momentum</Text>
                                <Text style={styles.aboutVersion}>Version {APP_VERSION}</Text>
                            </View>
                        </View>
                        <Text style={styles.aboutSubtitle}>Built by Syreese Delos Santos</Text>

                        <TouchableOpacity
                            style={styles.githubButton}
                            onPress={() => Linking.openURL('https://github.com/SyreeseOfficial/Momentum')}
                        >
                            <Ionicons name="logo-github" size={18} color={theme.colors.text} />
                            <Text style={styles.githubButtonText}>View on GitHub</Text>
                        </TouchableOpacity>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{activeTrackers.length}</Text>
                                <Text style={styles.statLabel}>Active Trackers</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{totalActions}</Text>
                                <Text style={styles.statLabel}>Total Actions</Text>
                            </View>
                        </View>
                    </View>

                    {/* Changelog */}
                    <TouchableOpacity
                        style={styles.changelogToggle}
                        onPress={() => setShowChangelog(v => !v)}
                    >
                        <Text style={styles.changelogToggleText}>What's New</Text>
                        <Ionicons
                            name={showChangelog ? 'chevron-up-outline' : 'chevron-down-outline'}
                            size={16}
                            color={theme.colors.secondary}
                        />
                    </TouchableOpacity>

                    {showChangelog && (
                        <View style={styles.card}>
                            {CHANGELOG.map((entry, i) => (
                                <View key={entry.version} style={i > 0 ? { marginTop: theme.spacing.l } : undefined}>
                                    <View style={styles.changelogVersionRow}>
                                        <Text style={styles.changelogVersion}>v{entry.version}</Text>
                                        <Text style={styles.changelogDate}>{entry.date}</Text>
                                    </View>
                                    {entry.notes.map(note => (
                                        <Text key={note} style={styles.changelogNote}>• {note}</Text>
                                    ))}
                                </View>
                            ))}
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
        </SettingsStylesCtx.Provider>
    );
}

function createStyles(theme: Theme) { return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        padding: theme.spacing.m,
        paddingTop: 60,
        backgroundColor: theme.colors.surface,
    },
    title: {
        fontSize: theme.fontSizes.l,
        fontWeight: 'bold',
        color: theme.colors.primary,
    },
    content: {
        padding: theme.spacing.m,
        paddingBottom: 60,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.fontSizes.s,
        fontWeight: '600',
        color: theme.colors.secondary,
        marginBottom: theme.spacing.s,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.m,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.s,
    },
    settingRowLeft: {
        flex: 1,
        marginRight: theme.spacing.m,
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
    subLabel: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        marginTop: theme.spacing.s,
        marginBottom: 6,
    },
    rowDivider: {
        height: 1,
        backgroundColor: theme.colors.background,
        marginVertical: 4,
    },
    linkText: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.accent,
        fontWeight: '600',
    },

    // Segmented control
    segmented: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        padding: 3,
        marginTop: 6,
    },
    segmentBtn: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        borderRadius: 6,
    },
    segmentBtnActive: {
        backgroundColor: theme.colors.accent,
    },
    segmentText: {
        fontSize: 12,
        color: theme.colors.secondary,
        fontWeight: '600',
    },
    segmentTextActive: {
        color: '#fff',
    },

    // Tracker rows
    trackerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.s,
    },
    trackerName: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.primary,
        flex: 1,
    },
    trackerNameArchived: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    archivedLabel: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.s,
    },
    archivedActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconBtn: {
        padding: 4,
    },
    emptyText: {
        color: theme.colors.secondary,
        fontStyle: 'italic',
        fontSize: theme.fontSizes.m,
    },

    // Buttons
    buttonGroup: {
        marginTop: theme.spacing.m,
        gap: theme.spacing.s,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.m,
        borderRadius: 10,
        gap: theme.spacing.s,
    },
    actionButtonText: {
        fontSize: theme.fontSizes.m,
        fontWeight: '600',
        color: theme.colors.background,
    },
    dangerOutlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.danger,
    },
    dangerSolidButton: {
        backgroundColor: theme.colors.danger,
    },

    // About
    aboutSection: {
        marginBottom: 40,
    },
    aboutHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.m,
        marginBottom: theme.spacing.s,
    },
    aboutTitleBlock: {
        flex: 1,
    },
    aboutTitle: {
        fontSize: theme.fontSizes.l,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    aboutVersion: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
    },
    aboutSubtitle: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        marginBottom: theme.spacing.m,
    },
    githubButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.m,
        paddingVertical: theme.spacing.s,
        borderRadius: 20,
        alignSelf: 'flex-start',
        gap: 8,
        marginBottom: theme.spacing.l,
    },
    githubButtonText: {
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: theme.fontSizes.s,
    },
    statsRow: {
        flexDirection: 'row',
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
        height: 32,
        backgroundColor: theme.colors.background,
    },

    // Color picker
    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: theme.spacing.m,
    },
    colorSwatch: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorSwatchSelected: {
        borderWidth: 3,
        borderColor: '#fff',
    },
    colorCheck: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Changelog
    changelogToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.m,
    },
    changelogToggleText: {
        fontSize: theme.fontSizes.m,
        color: theme.colors.secondary,
        fontWeight: '600',
    },
    changelogVersionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.s,
    },
    changelogVersion: {
        fontSize: theme.fontSizes.m,
        fontWeight: 'bold',
        color: theme.colors.accent,
    },
    changelogDate: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
    },
    changelogNote: {
        fontSize: theme.fontSizes.s,
        color: theme.colors.secondary,
        marginBottom: 4,
        lineHeight: 18,
    },
}); }
