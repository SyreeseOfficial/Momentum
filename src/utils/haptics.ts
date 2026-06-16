import * as Haptics from 'expo-haptics';
import { HapticIntensity } from '../types';

export const triggerHaptic = async (type: 'tap' | 'success', intensity: HapticIntensity) => {
    if (intensity === 'none') return;
    if (type === 'success') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
    }
    switch (intensity) {
        case 'light':  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
        case 'medium': await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
        case 'strong': await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
    }
};
