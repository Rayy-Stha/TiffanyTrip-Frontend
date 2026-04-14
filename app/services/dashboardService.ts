import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/apiClient';
import { Booking } from './busService';
import { Trip } from './tripService';

// ============================================
// TypeScript Interfaces
// ============================================

export interface UpcomingTrip extends Trip {
    daysUntil?: number;
    bookings?: Booking[];
}

export interface Recommendation {
    id: string;
    type: string;
    title: string;
    description: string;
    image?: string;
    link?: string;
    priority?: number;
    rating?: number;
}

export interface UserStats {
    totalTrips: number;
    upcomingTrips: number;
    completedTrips: number;
    totalBookings: number;
    totalSpent: number;
    totalOrders?: number;
    favoriteDestination?: string;
}

// ============================================
// Response Interfaces
// ============================================

interface UpcomingTripsResponse {
    trips: UpcomingTrip[];
}

interface RecommendationsResponse {
    recommendations: Recommendation[];
}

interface StatsResponse {
    stats: UserStats;
}

// ============================================
// Dashboard Service
// ============================================

export const dashboardService = {
    /**
     * Get upcoming trips for the current user
     */
    getUpcomingTrips: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<UpcomingTripsResponse>('/dashboard/upcoming-trips', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Get personalized recommendations
     */
    getRecommendations: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<RecommendationsResponse>('/dashboard/recommendations', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Get user statistics
     */
    getUserStats: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<StatsResponse>('/dashboard/stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },
};
