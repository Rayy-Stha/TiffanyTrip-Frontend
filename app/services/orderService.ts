import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/apiClient';

// ============================================
// TypeScript Interfaces
// ============================================

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface FoodOrderItem {
    menuItemId: number;
    name: string;
    price: number;
    quantity: number;
}

export interface FoodOrder {
    id: number;
    travellerId: number;
    restaurantId: number;
    bookingId?: number;
    items: FoodOrderItem[];
    totalAmount: number;
    deliveryLocation: string;
    deliveryLat?: number;
    deliveryLng?: number;
    deliveryTime?: string;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
    restaurant?: {
        id: number;
        name: string;
        location: string;
        ownerId: number;
    };
    traveller?: {
        id: number;
        full_name: string;
        phone: string;
        email: string;
    };
    booking?: any;
}

// ============================================
// Response Interfaces
// ============================================

interface CreateOrderResponse {
    message: string;
    order: FoodOrder;
}

interface OrdersResponse {
    message: string;
    count: number;
    orders: FoodOrder[];
}

interface OrderResponse {
    order: FoodOrder;
}

interface UpdateOrderStatusResponse {
    message: string;
    order: FoodOrder;
}

// ============================================
// Order Service
// ============================================

export const orderService = {
    // ============================================
    // Order Creation
    // ============================================

    createOrder: async (data: {
        restaurantId: number;
        items: { menuItemId: number; quantity: number }[];
        deliveryLocation?: string;
        deliveryLat?: number;
        deliveryLng?: number;
        bookingId?: number;
        tripId?: number;
        deliveryTime?: string;
        notes?: string;
    }) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<CreateOrderResponse>('/restaurants/orders', {
            method: 'POST',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    // ============================================
    // Order Retrieval
    // ============================================

    getUserOrders: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<OrdersResponse>('/restaurants/orders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    getRestaurantOrders: async (restaurantId: number) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<OrdersResponse>(`/restaurants/${restaurantId}/orders`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    getOrderById: async (id: number) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<OrderResponse>(`/restaurants/orders/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    // ============================================
    // Order Management
    // ============================================

    updateOrderStatus: async (id: number, status: OrderStatus) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<UpdateOrderStatusResponse>(`/restaurants/orders/${id}/status`, {
            method: 'PUT',
            data: { status },
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },
};
