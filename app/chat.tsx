import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService, User } from './services/authService';
import { ChatMessage, chatService } from './services/chatService';
import { socketService } from './services/socketService';

export default function ChatScreen() {
    const router = useRouter();
    const { bookingId, orderId, receiverId, receiverName } = useLocalSearchParams();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        setupChat();
        return () => {
            socketService.disconnect();
        };
    }, []);

    const setupChat = async () => {
        try {
            setLoading(true);

            // 1. Get current user profile
            const profileRes = await authService.getProfile();
            setCurrentUser(profileRes.user);

            // 2. Fetch history
            const chatId = (bookingId || orderId) as string;
            const historyRes = await chatService.getChatHistory(chatId, !!orderId);
            setMessages(historyRes.messages);

            // 3. Connect and Join Socket Room
            socketService.connect();
            const roomName = orderId ? `order_${orderId}` : bookingId as string;
            socketService.joinRoom(roomName);

            // 4. Listen for new messages
            socketService.onMessageReceived((newMessage) => {
                setMessages(prev => [...prev, newMessage]);
                setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
            });

        } catch (error) {
            console.error('Chat setup error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (!inputText.trim() || !currentUser) return;

        const messageData: any = {
            senderId: parseInt(currentUser.id),
            receiverId: parseInt(receiverId as string),
            content: inputText.trim()
        };

        if (bookingId) messageData.bookingId = parseInt(bookingId as string);
        if (orderId) messageData.orderId = parseInt(orderId as string);

        socketService.sendMessage(messageData);
        setInputText('');
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isMine = currentUser && String(item.senderId) === String(currentUser.id);

        return (
            <View style={[styles.messageWrapper, isMine ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
                <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.otherBubble]}>
                    <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.otherMessageText]}>
                        {item.content}
                    </Text>
                    <Text style={[styles.timeText, isMine ? styles.myTimeText : styles.otherTimeText]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{receiverName || 'Chat'}</Text>
                    <Text style={styles.headerStatus}>Online</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    headerStatus: {
        fontSize: 12,
        color: '#10B981',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    myMessageWrapper: {
        justifyContent: 'flex-end',
    },
    otherMessageWrapper: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
    },
    myBubble: {
        backgroundColor: '#3B82F6',
        borderBottomRightRadius: 4,
    },
    otherBubble: {
        backgroundColor: '#fff',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    myMessageText: {
        color: '#fff',
    },
    otherMessageText: {
        color: '#111827',
    },
    timeText: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTimeText: {
        color: '#DBEAFE',
    },
    otherTimeText: {
        color: '#9CA3AF',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 12,
        maxHeight: 100,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
});
