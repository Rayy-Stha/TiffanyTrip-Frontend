import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../utils/apiClient';

export interface ChatMessage {
    id: number;
    senderId: number;
    receiverId: number;
    bookingId: number;
    content: string;
    createdAt: string;
    sender: {
        id: number;
        full_name: string;
        avatar_url?: string;
    };
}

export interface Conversation {
    bookingId: number;
    otherUser: {
        id: number;
        full_name: string;
        avatar_url?: string;
    };
    lastMessage: string;
    updatedAt: string;
    route: string;
}

export const chatService = {
    getChatHistory: async (id: string, isOrder: boolean = false) => {
        const token = await AsyncStorage.getItem('token');
        const endpoint = isOrder ? `/messages/order/${id}` : `/messages/booking/${id}`;
        return apiClient<{ messages: ChatMessage[] }>(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    getConversations: async () => {
        const token = await AsyncStorage.getItem('token');
        return apiClient<{ conversations: Conversation[] }>('/messages/conversations', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    }
};
