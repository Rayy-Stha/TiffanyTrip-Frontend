import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/apiClient';

// ============================================
// TypeScript Interfaces
// ============================================

export interface ItineraryItem {
    day: number;
    time?: string;
    title: string;
    description?: string;
    location?: string;
    notes?: string;
}

export interface Trip {
    id: string;
    userId: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    budget?: number;
    description?: string;
    image?: string;
    itinerary?: ItineraryItem[];
    status: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// Response Interfaces
// ============================================

interface TripResponse {
    message: string;
    trip: Trip;
}

interface TripsResponse {
    trips: Trip[];
}

// ============================================
// Trip Service
// ============================================

export const tripService = {
    /**
     * Create a new trip
     */
    createTrip: async (data: {
        name: string;
        destination: string;
        startDate: string;
        endDate: string;
        budget?: number;
        description?: string;
        itinerary?: ItineraryItem[];
    }) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<TripResponse>('/trips', {
            method: 'POST',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Get all trips for the current user
     */
    getUserTrips: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<TripsResponse>('/trips', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Get a specific trip by ID
     */
    getTripById: async (id: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ trip: Trip }>(`/trips/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Update a trip
     */
    updateTrip: async (id: string, data: Partial<Trip>) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<TripResponse>(`/trips/${id}`, {
            method: 'PUT',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Delete a trip
     */
    deleteTrip: async (id: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string }>(`/trips/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Get restaurants along a trip's route
     */
    getTripRestaurants: async (id: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ count: number; restaurants: any[] }>(`/trips/${id}/restaurants`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },
};
