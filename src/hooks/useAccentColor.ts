import { useTrackers } from '../context/TrackerContext';
import { theme } from '../constants/theme';

export const useAccentColor = (): string => {
    const { preferences } = useTrackers();
    return preferences.accentColor || theme.colors.accent;
};
