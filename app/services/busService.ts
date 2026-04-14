import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/apiClient';

// ============================================
// TypeScript Interfaces
// ============================================

export interface Bus {
    id: string;
    name: string;
    operator?: string;
    operatorId: number;
    capacity: number;
    amenities: string[];
    number: string;
    type: string;
    rating?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Schedule {
    id: string;
    busId: string;
    bus?: Bus;
    routeId: string;
    route?: any; // Define Route interface if needed
    departureTime: string;
    arrivalTime: string;
    fare: number;
    daysOfWeek: string[];
    availableSeats: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export interface Seat {
    id: string;
    scheduleId: string;
    seatNumber: string;
    isAvailable: boolean;
    type: string;
    price: number;
}

export interface Booking {
    id: string;
    travellerId: number;
    scheduleId: string;
    schedule?: Schedule;
    seatNumbers: string[];
    totalPrice: number;
    status: string;
    passengerName: string;
    passengerPhone: string;
    passengerEmail: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// Response Interfaces
// ============================================

interface SearchBusesResponse {
    buses: Schedule[];
    message?: string;
}

interface BusResponse {
    bus: Bus;
}

interface ScheduleResponse {
    schedule: Schedule;
}

interface SchedulesResponse {
    schedules: Schedule[];
}

interface SeatsResponse {
    totalSeats: number;
    availableSeats: number;
    bookedSeats: string[];
}

interface BookingResponse {
    message: string;
    booking: Booking;
}

interface BookingsResponse {
    bookings: Booking[];
}

// ============================================
// Bus Service
// ============================================

export const busService = {
    // ============================================
    // Bus Search & Details
    // ============================================

    searchBuses: async (origin: string, destination: string, date: string) => {
        return apiClient<SearchBusesResponse>(`/buses/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${date}`, {
            method: 'GET',
        });
    },

    getBusById: async (id: string) => {
        return apiClient<BusResponse>(`/buses/${id}`, {
            method: 'GET',
        });
    },

    getAllRoutes: async () => {
        return apiClient<{ routes: { id: number; name: string; origin: string; destination: string; stops: any; distance: number; duration: number }[] }>('/routes', {
            method: 'GET',
        });
    },

    getOperatorRoutes: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ routes: { id: number; name: string; origin: string; destination: string; stops: any; distance: number; duration: number; operatorId: number | null }[] }>('/routes/operator', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    createRoute: async (data: { name: string; origin: string; destination: string; distance: number; duration: number; stops: any[] }) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; route: any }>('/routes', {
            method: 'POST',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    updateRoute: async (id: string, data: Partial<{ name: string; origin: string; destination: string; distance: number; duration: number; stops: any[] }>) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; route: any }>(`/routes/${id}`, {
            method: 'PUT',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    deleteRoute: async (id: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string }>(`/routes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    getAllBuses: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ buses: Bus[] }>('/buses', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    createBus: async (data: Partial<Bus>) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; bus: Bus }>('/buses', {
            method: 'POST',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    updateBus: async (id: string, data: Partial<Bus>) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; bus: Bus }>(`/buses/${id}`, {
            method: 'PUT',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    deleteBus: async (id: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string }>(`/buses/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    // ============================================
    // Schedule Management
    // ============================================

    getScheduleById: async (id: string) => {
        return apiClient<ScheduleResponse>(`/buses/schedules/${id}`, {
            method: 'GET',
        });
    },

    getSchedulesByBus: async (busId: string) => {
        return apiClient<SchedulesResponse>(`/buses/${busId}/schedules`, {
            method: 'GET',
        });
    },

    getSeats: async (scheduleId: string) => {
        return apiClient<SeatsResponse>(`/buses/schedules/${scheduleId}/seats`, {
            method: 'GET',
        });
    },

    createSchedule: async (data: Partial<Schedule>) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; schedule: Schedule }>('/buses/schedules', {
            method: 'POST',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    updateSchedule: async (id: string, data: Partial<Schedule>) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; schedule: Schedule }>(`/buses/schedules/${id}`, {
            method: 'PUT',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    deleteSchedule: async (id: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string }>(`/buses/schedules/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    // ============================================
    // Booking Management
    // ============================================

    createBooking: async (data: {
        scheduleId: string;
        seatNumbers: string[];
        travelDate: string;
        passengerName: string;
        passengerPhone: string;
        passengerEmail: string;
    }) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<BookingResponse>('/buses/bookings', {
            method: 'POST',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    getUserBookings: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<BookingsResponse>('/buses/bookings', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    getOperatorBookings: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<BookingsResponse>('/buses/operator/bookings', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    getBookingById: async (id: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ booking: Booking }>(`/buses/bookings/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    cancelBooking: async (id: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; booking: Booking }>(`/buses/bookings/${id}/cancel`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    getOperatorSchedules: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<SchedulesResponse>('/buses/operator/schedules', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    confirmBooking: async (id: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; booking: Booking }>(`/buses/bookings/${id}/confirm`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },
};
