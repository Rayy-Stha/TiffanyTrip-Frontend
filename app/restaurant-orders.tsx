import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FoodOrder, FoodOrderItem, orderService } from './services/orderService';
import { restaurantService } from './services/restaurantService';

export default function RestaurantOrders() {
    const router = useRouter();
    const [orders, setOrders] = useState<FoodOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            try {
                const restaurantRes = await restaurantService.getMyRestaurant();
                if (restaurantRes && restaurantRes.restaurant) {
                    setRestaurantId(restaurantRes.restaurant.id);
                    // Fetch orders for this restaurant using orderService
                    const ordersRes = await orderService.getRestaurantOrders(parseInt(restaurantRes.restaurant.id));
                    if (ordersRes) {
                        setOrders(ordersRes.orders);
                    }
                }
            } catch (err: any) {
                if (err.message && err.message.includes('not found')) {
                    Alert.alert('Restaurant Required', 'You need to create a restaurant profile first.', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                } else {
                    console.error('Error fetching orders:', err);
                    Alert.alert('Error', 'Failed to load orders');
                }
            }
        } catch (error) {
            console.error('General Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: number, newStatus: string) => {
        try {
            const res = await orderService.updateOrderStatus(id, newStatus as any);
            if (res && res.order) {
                setOrders(prev => prev.map(o => o.id === id ? res.order : o));
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            Alert.alert('Error', 'Failed to update order status');
        }
    };

    const filteredOrders = activeTab === 'All' ? orders : orders.filter(o => o.status === activeTab.toUpperCase());

    const renderOrder = ({ item }: { item: FoodOrder }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.orderId}>Order #{item.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>
            <Text style={styles.customer}>Customer: {item.traveller?.full_name || `ID: ${item.travellerId}`}</Text>

            <View style={styles.itemsContainer}>
                <Text style={styles.itemsHeader}>Items:</Text>
                <Text style={styles.items}>
                    {item.items.map((i: FoodOrderItem) => `${i.quantity}x ${i.name}`).join(', ')}
                </Text>
            </View>

            <View style={styles.deliveryContainer}>
                {item.deliveryLocation && (
                    <View style={styles.deliveryRow}>
                        <Ionicons name="bus" size={18} color="#4B5563" />
                        <Text style={styles.deliveryText}>
                            Deliver to: <Text style={styles.boldText}>{item.deliveryLocation}</Text>
                        </Text>
                    </View>
                )}

                {item.deliveryTime ? (
                    <View style={styles.deliveryTimeHighlight}>
                        <Ionicons name="time" size={20} color="#B45309" />
                        <View>
                            <Text style={styles.deliveryTimeLabel}>DELIVER BY:</Text>
                            <Text style={styles.deliveryTimeValue}>
                                {new Date(item.deliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.deliveryTimeHighlight, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                        <Ionicons name="alert-circle" size={20} color="#6B7280" />
                        <Text style={[styles.deliveryTimeValue, { color: '#6B7280', fontSize: 14 }]}>As soon as possible</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardFooter}>
                <View>
                    <Text style={styles.footerLabel}>Ordered At:</Text>
                    <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
                </View>
                <Text style={styles.total}>Rs. {item.totalAmount.toFixed(2)}</Text>
            </View>

            {item.status !== 'DELIVERED' && item.status !== 'CANCELLED' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        onPress={() => (router.push as any)({ pathname: '/order-tracking', params: { orderJSON: JSON.stringify(item) } })}
                        style={[styles.button, styles.outlineButton]}
                    >
                        <Ionicons name="map-outline" size={18} color="#3B82F6" />
                        <Text style={styles.outlineButtonText}>Map</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => (router.push as any)({
                            pathname: '/chat',
                            params: {
                                orderId: item.id.toString(),
                                receiverId: item.travellerId.toString(),
                                receiverName: item.traveller?.full_name || 'Customer'
                            }
                        })}
                        style={[styles.button, styles.outlineButton, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}
                    >
                        <Ionicons name="chatbubble-outline" size={18} color="#4B5563" />
                        <Text style={[styles.outlineButtonText, { color: '#4B5563' }]}>Chat</Text>
                    </TouchableOpacity>

                    {item.status === 'PENDING' && (
                        <>
                            <TouchableOpacity onPress={() => updateStatus(item.id, 'CONFIRMED')} style={[styles.button, styles.primaryButton, { backgroundColor: '#10B981' }]}>
                                <Text style={styles.primaryButtonText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => updateStatus(item.id, 'CANCELLED')} style={[styles.button, { backgroundColor: '#EF4444' }]}>
                                <Text style={styles.primaryButtonText}>Decline</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {item.status === 'CONFIRMED' && (
                        <TouchableOpacity onPress={() => updateStatus(item.id, 'PREPARING')} style={[styles.button, styles.primaryButton]}>
                            <Ionicons name="restaurant-outline" size={18} color="#fff" />
                            <Text style={styles.primaryButtonText}>Start Preparing</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === 'PREPARING' && (
                        <TouchableOpacity onPress={() => updateStatus(item.id, 'READY')} style={[styles.button, styles.primaryButton, { backgroundColor: '#8B5CF6' }]}>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                            <Text style={styles.primaryButtonText}>Mark Ready</Text>
                        </TouchableOpacity>
                    )}
                    {item.status === 'READY' && (
                        <TouchableOpacity onPress={() => updateStatus(item.id, 'DELIVERED')} style={[styles.button, { backgroundColor: '#10B981' }]}>
                            <Ionicons name="bicycle-outline" size={18} color="#fff" />
                            <Text style={styles.primaryButtonText}>Complete Delivery</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return '#F59E0B';
            case 'CONFIRMED': return '#0EA5E9'; // Added a nice blue shade for confirmed
            case 'PREPARING': return '#3B82F6';
            case 'READY': return '#8B5CF6';
            case 'DELIVERED': return '#10B981';
            case 'CANCELLED': return '#EF4444';
            default: return '#6B7280';
        }
    };

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
                <Text style={styles.headerTitle}>Orders</Text>
                <View style={{ width: 40 }} />
            </View>

            <View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabs}
                >
                    {['All', 'Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'].map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[styles.tab, activeTab === tab && styles.activeTab]}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredOrders}
                renderItem={renderOrder}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
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
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 8,
        marginBottom: 8,
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 20,
        marginHorizontal: 4,
    },
    activeTab: {
        backgroundColor: '#EFF6FF',
    },
    tabText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#3B82F6',
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    customer: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 4,
    },
    itemsContainer: {
        marginBottom: 12,
    },
    itemsHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 2,
    },
    items: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '500',
    },
    deliveryContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    deliveryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    deliveryText: {
        fontSize: 14,
        color: '#4B5563',
    },
    deliveryTimeHighlight: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FEF3C7',
        gap: 10,
    },
    deliveryTimeLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#B45309',
        letterSpacing: 0.5,
    },
    deliveryTimeValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#92400E',
    },
    boldText: {
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
        marginBottom: 12,
    },
    footerLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        marginBottom: 2,
    },
    time: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    total: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 8,
    },
    outlineButton: {
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    outlineButtonText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 14,
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#9CA3AF',
    },
});
