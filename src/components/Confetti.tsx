import React, { useEffect, useState } from 'react';
import { View, Animated, Easing } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';
import { useTrackers } from '../context/TrackerContext';

interface ConfettiPiece {
    id: string;
    left: number;
    delay: number;
    duration: number;
    color: string;
}

const STATIC_CONFETTI_COLORS = ['#6366F1', '#10B981', '#F2F2F2', '#FF6B6B', '#FFD93D'];

export const Confetti = ({ duration = 2500 }: { duration?: number }) => {
    const { preferences } = useTrackers();
    const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
    if (preferences.reduceAnimations) return null;

    useEffect(() => {
        const newPieces: ConfettiPiece[] = Array.from({ length: 30 }, (_, i) => ({
            id: i.toString(),
            left: Math.random() * 100,
            delay: Math.random() * 100,
            duration: 1000 + Math.random() * 500,
            color: STATIC_CONFETTI_COLORS[Math.floor(Math.random() * STATIC_CONFETTI_COLORS.length)],
        }));
        setPieces(newPieces);

        const timer = setTimeout(() => {
            setPieces([]);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    return (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
            {pieces.map(piece => (
                <ConfettiPiece key={piece.id} piece={piece} />
            ))}
        </View>
    );
};

function ConfettiPiece({ piece }: { piece: ConfettiPiece }) {
    const animatedValue = new Animated.Value(0);

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: 1,
            duration: piece.duration,
            delay: piece.delay,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
        }).start();
    }, []);

    const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 600],
    });

    const rotate = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '720deg'],
    });

    const opacity = animatedValue.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [1, 1, 0],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: `${piece.left}%`,
                top: 0,
                transform: [{ translateY }, { rotate }],
                opacity,
            }}
        >
            <View
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: piece.color,
                }}
            />
        </Animated.View>
    );
}
