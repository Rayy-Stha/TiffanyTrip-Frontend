import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FoodOrder, FoodOrderItem, orderService } from './services/orderService';

export default function OrderHistory() {
    const router = useRouter();
    const [orders, setOrders] = useState<FoodOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await orderService.getUserOrders();
            if (res && res.orders) {
                setOrders(res.orders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            Alert.alert('Error', 'Failed to load orders');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return '#F59E0B';
            case 'CONFIRMED': return '#3B82F6';
            case 'PREPARING': return '#8B5CF6';
            case 'READY': return '#10B981';
            case 'DELIVERED': return '#059669';
            case 'CANCELLED': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return 'time-outline';
            case 'CONFIRMED': return 'checkmark-circle-outline';
            case 'PREPARING': return 'restaurant-outline';
            case 'READY': return 'bag-check-outline';
            case 'DELIVERED': return 'checkmark-done-circle';
            case 'CANCELLED': return 'close-circle-outline';
            default: return 'help-circle-outline';
        }
    };

    const getFilteredOrders = () => {
        if (activeTab === 'active') {
            return orders.filter(order =>
                order.status !== 'DELIVERED' && order.status !== 'CANCELLED'
            );
        } else if (activeTab === 'completed') {
            return orders.filter(order =>
                order.status === 'DELIVERED' || order.status === 'CANCELLED'
            );
        }
        return orders;
    };

    const filteredOrders = getFilteredOrders();

    const renderOrder = ({ item }: { item: FoodOrder }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => (router.push as any)(`/order-details?id=${item.id}`)}
        >
            <View style={styles.orderHeader}>
                <View style={styles.restaurantInfo}>
                    <Ionicons name="restaurant" size={20} color="#3B82F6" />
                    <Text style={styles.restaurantName}>{item.restaurant?.name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                    <Ionicons name={getStatusIcon(item.status) as any} size={14} color={getStatusColor(item.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{item.restaurant?.location}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                        {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                    </Text>
                </View>
            </View>

            <View style={styles.itemsPreview}>
                <Text style={styles.itemsText}>
                    {item.items.length} item(s) • {item.items.map((i: FoodOrderItem) => `${i.quantity}x ${i.name}`).join(', ')}
                </Text>
            </View>

            <View style={styles.orderFooter}>
                <View>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>Rs. {item.totalAmount.toFixed(2)}</Text>
                </View>
                {item.status !== 'CANCELLED' && item.status !== 'DELIVERED' && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        {item.status !== 'PENDING' && (
                            <TouchableOpacity
                                style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                onPress={() => (router.push as any)({ pathname: '/order-tracking', params: { orderJSON: JSON.stringify(item) } })}
                            >
                                <Ionicons name="map-outline" size={16} color="#3B82F6" />
                                <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 13 }}>Track</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}
                            onPress={() => (router.push as any)({
                                pathname: '/chat',
                                params: {
                                    orderId: item.id.toString(),
                                    receiverId: item.restaurant?.ownerId?.toString(),
                                    receiverName: item.restaurant?.name
                                }
                            })}
                        >
                            <Ionicons name="chatbubble-outline" size={16} color="#4B5563" />
                            <Text style={{ color: '#4B5563', fontWeight: 'bold', fontSize: 13 }}>Chat</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
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
                <Text style={styles.headerTitle}>My Orders</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                    onPress={() => setActiveTab('all')}
                >
                    <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
                        All ({orders.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                    onPress={() => setActiveTab('active')}
                >
                    <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                        Active ({orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
                        Completed ({orders.filter(o => o.status === 'DELIVERED' || o.status === 'CANCELLED').length})
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredOrders}
                renderItem={renderOrder}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>
                            {activeTab === 'active' ? 'No active orders' :
                                activeTab === 'completed' ? 'No completed orders' : 'No orders yet'}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {activeTab === 'all' ? 'Your order history will appear here' : ''}
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
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
    refreshButton: {
        padding: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#3B82F6',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
    },
    orderCard: {
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
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    restaurantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderDetails: {
        gap: 8,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 13,
        color: '#6B7280',
    },
    itemsPreview: {
        backgroundColor: '#F9FAFB',
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    itemsText: {
        fontSize: 13,
        color: '#374151',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    totalLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#9CA3AF',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#D1D5DB',
        marginTop: 8,
    },
});
