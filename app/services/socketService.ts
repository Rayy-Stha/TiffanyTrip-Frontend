// @ts-ignore
import io from 'socket.io-client/dist/socket.io.js';
import { API_BASE_URL } from '../config/api';

// The API_BASE_URL usually ends with /api, we need the base server URL for socket
const SOCKET_URL = API_BASE_URL.replace('/api', '');

class SocketService {
    private socket: any = null;

    connect() {
        if (this.socket) return;

        this.socket = io(SOCKET_URL, {
            transports: ['websocket'],
            forceNew: true,
        });

        this.socket.on('connect', () => {
            console.log('🔌 Connected to socket server');
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from socket server');
        });
    }

    joinRoom(bookingId: string) {
        this.socket?.emit('join_room', bookingId);
    }

    sendMessage(data: {
        bookingId?: number;
        orderId?: number;
        senderId: number;
        receiverId: number;
        content: string;
    }) {
        this.socket?.emit('send_message', data);
    }

    onMessageReceived(callback: (message: any) => void) {
        this.socket?.on('receive_message', callback);
    }

    offMessageReceived() {
        this.socket?.off('receive_message');
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }
}

export const socketService = new SocketService();
