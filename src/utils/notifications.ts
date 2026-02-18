
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

try {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
} catch (error) {
    console.warn('Notifications.setNotificationHandler failed:', error);
}

export async function registerForPushNotificationsAsync() {
    try {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                return;
            }
        } else {
            // console.log('Must use physical device for Push Notifications');
        }
    } catch (error) {
        console.warn('registerForPushNotificationsAsync failed:', error);
    }
}

export async function scheduleDailyReminder(date: Date) {
    try {
        // Cancel all existing notifications first to avoid duplicates
        await Notifications.cancelAllScheduledNotificationsAsync();

        const trigger: Notifications.DailyTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: date.getHours(),
            minute: date.getMinutes(),
        };

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Momentum Check-in",
                body: "Time to log your daily progress!",
                sound: true,
            },
            trigger,
        });
    } catch (error) {
        console.warn('scheduleDailyReminder failed:', error);
    }
}

export async function cancelAllNotifications() {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
        console.warn('cancelAllNotifications failed:', error);
    }
}
