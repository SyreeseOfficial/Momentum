import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Saves data to AsyncStorage.
 * @param key The key to save the data under.
 * @param value The value to save. Will be JSON.stringified.
 */
export const saveData = async (key: string, value: any): Promise<void> => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
        console.error(`Error saving data for key "${key}":`, e);
        throw e;
    }
};

/**
 * Loads data from AsyncStorage.
 * @param key The key to load the data from.
 * @returns The parsed data, or null if the key does not exist.
 */
export const loadData = async <T>(key: string): Promise<T | null> => {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error(`Error loading data for key "${key}":`, e);
        return null;
    }
};

/**
 * Clears all data from AsyncStorage.
 * Use with caution.
 */
export const clearAllData = async (): Promise<void> => {
    try {
        await AsyncStorage.clear();
    } catch (e) {
        console.error('Error clearing data:', e);
        throw e;
    }
};
