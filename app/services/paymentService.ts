import AsyncStorage from '@react-native-async-storage/async-storage';

// In a real app, this should be an environment variable. Using the same API URL as other services.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001/api';

const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
    };
};

export const paymentService = {
    initiateKhaltiPayment: async (paymentData: {
        amount: number;
        purchaseOrderId: string;
        purchaseOrderName: string;
        returnUrl: string;
    }) => {
        try {
            const response = await fetch(`${API_URL}/payment/khalti/initiate`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(paymentData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to initiate payment');
            return data;
        } catch (error) {
            console.error('Error initiating Khalti payment:', error);
            throw error;
        }
    },

    verifyKhaltiPayment: async (verificationData: {
        pidx: string;
        bookingId?: string;
        orderId?: string;
    }) => {
        try {
            const response = await fetch(`${API_URL}/payment/khalti/verify`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify(verificationData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Payment verification failed');
            return data;
        } catch (error) {
            console.error('Error verifying Khalti payment:', error);
            throw error;
        }
    }
};
