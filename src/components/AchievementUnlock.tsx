import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { Achievement } from '../types';
import { Confetti } from './Confetti';
import { useAppTheme } from '../context/ThemeContext';
import { useTrackers } from '../context/TrackerContext';
import { playSound } from '../utils/sounds';

interface AchievementUnlockProps {
    achievement: Achievement | null;
    onDismiss: () => void;
}

export const AchievementUnlock = ({ achievement, onDismiss }: AchievementUnlockProps) => {
    const theme = useAppTheme();
    const { preferences } = useTrackers();
    const [visible, setVisible] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (achievement) {
            setVisible(true);
            playSound('achievement', preferences.soundEnabled);

            if (preferences.reduceAnimations) {
                scaleAnim.setValue(1);
                opacityAnim.setValue(1);
                const timer = setTimeout(() => { setVisible(false); onDismiss(); }, 3000);
                return () => clearTimeout(timer);
            }

            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(scaleAnim, { toValue: 0, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
                    Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]).start(() => { setVisible(false); onDismiss(); });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [achievement]);

    if (!achievement || !visible) return null;

    return (
        <Modal transparent visible={visible} pointerEvents="none">
            <View style={styles.overlay}>
                {!preferences.reduceAnimations && <Confetti duration={3000} />}
                <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.accent }]}>
                        <Text style={styles.badge}>{achievement.icon}</Text>
                        <Text style={[styles.title, { color: theme.colors.secondary }]}>Achievement Unlocked!</Text>
                        <Text style={[styles.name, { color: theme.colors.text }]}>{achievement.name}</Text>
                        <Text style={[styles.description, { color: theme.colors.secondary }]}>{achievement.description}</Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    container: { width: '85%' },
    card: { borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 2 },
    badge: { fontSize: 64, marginBottom: 16 },
    title: { fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    name: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
    description: { fontSize: 14, textAlign: 'center' },
});
