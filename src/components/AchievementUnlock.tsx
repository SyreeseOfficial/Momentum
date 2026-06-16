import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { theme } from '../constants/theme';
import { Achievement } from '../types';
import { Confetti } from './Confetti';

interface AchievementUnlockProps {
    achievement: Achievement | null;
    onDismiss: () => void;
}

export const AchievementUnlock = ({ achievement, onDismiss }: AchievementUnlockProps) => {
    const [visible, setVisible] = useState(false);
    const scaleAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(0);

    useEffect(() => {
        if (achievement) {
            setVisible(true);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 40,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => {
                    setVisible(false);
                    onDismiss();
                });
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [achievement]);

    if (!achievement || !visible) return null;

    return (
        <Modal transparent visible={visible} pointerEvents="none">
            <View style={styles.overlay}>
                <Confetti duration={3000} />
                <Animated.View
                    style={[
                        styles.container,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        },
                    ]}
                >
                    <View style={styles.card}>
                        <Text style={styles.badge}>{achievement.icon}</Text>
                        <Text style={styles.title}>Achievement Unlocked!</Text>
                        <Text style={styles.name}>{achievement.name}</Text>
                        <Text style={styles.description}>{achievement.description}</Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        width: '85%',
    },
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: theme.spacing.l,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.accent,
    },
    badge: {
        fontSize: 64,
        marginBottom: theme.spacing.m,
    },
    title: {
        fontSize: 14,
        color: theme.colors.secondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: theme.colors.secondary,
        textAlign: 'center',
    },
});
