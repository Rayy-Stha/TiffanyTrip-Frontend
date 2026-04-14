import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/apiClient';

// ============================================
// TypeScript Interfaces
// ============================================

export interface Route {
    id: string;
    name: string;
    origin: string;
    destination: string;
    stops: any[]; // Array of stop objects: [{ name, lat, lng }]
}

export interface Restaurant {
    id: string;
    name: string;
    location: string;
    address?: string;
    busStop?: string;
    cuisine: string;
    rating?: number;
    route?: Route;
    routeId?: string;
    description?: string;
    image?: string;
    phone?: string;
    openingHours?: string;
    ownerId?: string;
    latitude?: number;
    longitude?: number;
    createdAt: string;
    updatedAt: string;
    menuItems?: MenuItem[];
}

export interface MenuItem {
    id: string;
    restaurantId: string;
    name: string;
    description?: string;
    price: number;
    category: string;
    image?: string;
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    menuItemId: string;
    menuItem?: MenuItem;
    quantity: number;
    price: number;
    notes?: string;
}

export interface Order {
    id: string;
    userId: string;
    restaurantId: string;
    restaurant?: Restaurant;
    items: OrderItem[];
    totalPrice: number;
    status: string;
    deliveryAddress?: string;
    deliveryLat?: number;
    deliveryLng?: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// Response Interfaces
// ============================================

interface RestaurantsResponse {
    restaurants: Restaurant[];
}

interface RestaurantResponse {
    restaurant: Restaurant;
}

interface MenuResponse {
    menuItems: MenuItem[];
}

interface MenuItemResponse {
    message: string;
    menuItem: MenuItem;
}

interface OrderResponse {
    message: string;
    order: Order;
}

interface OrdersResponse {
    orders: Order[];
}

// ============================================
// Restaurant Service
// ============================================

export const restaurantService = {
    // ============================================
    // Restaurant & Menu
    // ============================================

    /**
     * Get restaurants by route/location
     */
    getRestaurantsByRoute: async (routeId?: string, busStop?: string) => {
        const params = new URLSearchParams();
        if (routeId) params.append('routeId', routeId);
        if (busStop) params.append('busStop', busStop);

        const queryString = params.toString();
        const endpoint = queryString ? `/restaurants?${queryString}` : '/restaurants';

        return apiClient<RestaurantsResponse>(endpoint, {
            method: 'GET',
        });
    },

    /**
     * Get a specific restaurant by ID
     */
    getRestaurantById: async (id: string) => {
        return apiClient<RestaurantResponse>(`/restaurants/${id}`, {
            method: 'GET',
        });
    },

    /**
     * Get menu for a specific restaurant
     */
    getMenu: async (restaurantId: string) => {
        return apiClient<MenuResponse>(`/restaurants/${restaurantId}/menu`, {
            method: 'GET',
        });
    },

    /**
     * Get the restaurant owned by the current user
     */
    getMyRestaurant: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<RestaurantResponse>('/restaurants/my-restaurant', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Create a new restaurant (for restaurant owners)
     */
    createRestaurant: async (data: Partial<Restaurant> & { routeId?: string; busStop?: string }) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; restaurant: Restaurant }>('/restaurants', {
            method: 'POST',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Update a restaurant (for restaurant owners)
     */
    updateRestaurant: async (id: string, data: Partial<Restaurant>) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; restaurant: Restaurant }>(`/restaurants/${id}`, {
            method: 'PUT',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Delete a restaurant (for restaurant owners)
     */
    deleteRestaurant: async (id: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string }>(`/restaurants/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    // ============================================
    // Menu Item Management
    // ============================================

    /**
     * Create a new menu item (for restaurant owners)
     */
    createMenuItem: async (data: Partial<MenuItem>) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<MenuItemResponse>('/restaurants/menu-items', {
            method: 'POST',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Update a menu item (for restaurant owners)
     */
    updateMenuItem: async (id: string, data: Partial<MenuItem>) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<MenuItemResponse>(`/restaurants/menu-items/${id}`, {
            method: 'PUT',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Delete a menu item (for restaurant owners)
     */
    deleteMenuItem: async (id: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string }>(`/restaurants/menu-items/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    // ============================================
    // Order Management
    // ============================================

    /**
     * Create a new order
     */
    createOrder: async (data: {
        restaurantId: string;
        tripId?: string;
        items: OrderItem[];
        deliveryAddress?: string;
        deliveryLat?: number;
        deliveryLng?: number;
        deliveryTime?: string; // ISO string
        notes?: string;
    }) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<OrderResponse>('/restaurants/orders', {
            method: 'POST',
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Get all orders for the current user
     */
    getUserOrders: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<OrdersResponse>('/restaurants/orders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Get a specific order by ID
     */
    getOrderById: async (id: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ order: Order }>(`/restaurants/orders/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Get all orders for a specific restaurant (for restaurant owners)
     */
    getRestaurantOrders: async (restaurantId: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<OrdersResponse>(`/restaurants/${restaurantId}/orders`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    /**
     * Update order status (for restaurant owners)
     */
    updateOrderStatus: async (id: string, status: string) => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ message: string; order: Order }>(`/restaurants/orders/${id}/status`, {
            method: 'PUT',
            data: { status },
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },
};
