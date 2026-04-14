import { Platform } from 'react-native';

const getBaseUrl = () => {
    // Prioritize environment variable if set
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // For Web, localhost is always correct
    if (Platform.OS === 'web') {
        return 'http://localhost:8001/api';
    }

    // For Android, check if it's an emulator or physical device
    if (Platform.OS === 'android') {
        // 10.0.2.2 is the default IP for Android Emulator to access host machine
        // Change this if you are using a physical device to match your machine's IP
        const isEmulator = false; // You can implement a check here if needed
        return 'http://192.168.1.66:8001/api';
    }

    // For iOS Simulator, localhost is fine
    if (Platform.OS === 'ios') {
        return 'http://localhost:8001/api';
    }

    return 'http://192.168.1.66:8001/api';
};

export const API_BASE_URL = getBaseUrl();

console.log('🔧 API Configuration:', {
    platform: Platform.OS,
    baseURL: API_BASE_URL
});
