import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Booking, busService } from './services/busService';

export default function BookingList() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await busService.getOperatorBookings();
            if (res && res.bookings) {
                setBookings(res.bookings);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            Alert.alert('Error', 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const renderBooking = ({ item }: { item: Booking }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.bookingId}>#{String(item.id).slice(0, 8)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'CONFIRMED' ? '#DEF7EC' : '#FEE2E2' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'CONFIRMED' ? '#03543F' : '#B91C1C' }]}>{item.status}</Text>
                </View>
            </View>
            <Text style={styles.passenger}>{item.passengerName}</Text>
            <Text style={styles.contact}>{item.passengerPhone}</Text>
            {item.schedule && item.schedule.bus && (
                <Text style={styles.route}>Bus: {item.schedule.bus.number} • {item.schedule.route?.origin || 'Unknown'} - {item.schedule.route?.destination || 'Unknown'}</Text>
            )}
            <View style={styles.footer}>
                {item.schedule && item.schedule.departureTime && <Text style={styles.date}>{new Date(item.schedule.departureTime).toDateString()}</Text>}
                <Text style={styles.seats}>Seats: {item.seatNumbers?.join(', ')}</Text>
            </View>
            <View style={styles.totalRow}>
                <View>
                    <Text style={styles.amountLabel}>Total amount:</Text>
                    <Text style={styles.amountValue}>Rs. {item.totalPrice}</Text>
                </View>
                <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() => router.push({
                        pathname: '/chat',
                        params: {
                            bookingId: item.id,
                            receiverId: item.travellerId,
                            receiverName: item.passengerName
                        }
                    } as any)}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#3B82F6" />
                    <Text style={styles.chatButtonText}>Chat</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Bookings</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={bookings}
                renderItem={renderBooking}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.emptyText}>No bookings found.</Text>}
            />
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
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    bookingId: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    passenger: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    contact: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    route: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 8,
    },
    date: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    seats: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3B82F6',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    amountLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    amountValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#10B981',
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3B82F6',
        gap: 6,
    },
    chatButtonText: {
        color: '#3B82F6',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#9CA3AF',
    },
});
