import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/apiClient';

export interface User {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    is_verified: boolean;
}

interface LoginResponse {
    message: string;
    token: string;
    user: User;
}

interface RegisterResponse {
    message: string;
    email: string;
}

interface VerifyOtpResponse {
    message: string;
    token: string;
    user: User;
}

export const authService = {
    register: async (data: { full_name: string; email: string; phone: string; password: string; role: string }) => {
        return apiClient<RegisterResponse>('/users/register', {
            method: 'POST',
            data,
        });
    },

    verifyOtp: async (data: { email: string; otp: string }) => {
        return apiClient<VerifyOtpResponse>('/users/verify-otp', {
            method: 'POST',
            data,
        });
    },

    resendOtp: async (data: { email: string }) => {
        return apiClient<{ message: string }>('/users/resend-otp', {
            method: 'POST',
            data,
        });
    },

    login: async (data: { email: string; password: string }) => {
        return apiClient<LoginResponse>('/users/login', {
            method: 'POST',
            data,
        });
    },

    getProfile: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ user: User }>('/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    resetCode: async (data: { email: string }) => {
        return apiClient<{ message: string }>('/users/reset-code', {
            method: 'POST',
            data,
        });
    },

    resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
        return apiClient<{ message: string }>('/users/reset-password', {
            method: 'POST',
            data,
        });
    },

    editProfile: async (data: { full_name?: string; phone?: string }) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; user: User }>('/users/edit-profile', {
            method: 'PUT',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },
    /**
     * Update user profile
     */
    updateProfile: async (data: { full_name?: string; phone?: string; email?: string }) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; user: User }>('/users/profile', {
            method: 'PUT',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Logout user
     */
    logout: async () => {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    }
};

