import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from './services/authService';
import { FoodOrder, FoodOrderItem, orderService } from './services/orderService';
import { restaurantService } from './services/restaurantService';

const { width } = Dimensions.get('window');

export default function RestaurantDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<FoodOrder[]>([]);
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        revenue: 0,
        rating: 4.8
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const [hasRestaurant, setHasRestaurant] = useState(true);

    const loadDashboardData = async () => {
        try {
            const profileRes = await authService.getProfile();
            if (profileRes && profileRes.user) {
                setUser(profileRes.user);

                // Try to fetch restaurant
                try {
                    const restaurantRes = await restaurantService.getMyRestaurant();
                    if (restaurantRes && restaurantRes.restaurant) {
                        setHasRestaurant(true);
                        // Fetch real orders for this restaurant using orderService to get accurate data types
                        const ordersRes = await orderService.getRestaurantOrders(parseInt(restaurantRes.restaurant.id));
                        if (ordersRes && ordersRes.orders) {
                            setOrders(ordersRes.orders);
                            calculateStats(ordersRes.orders);
                        }
                    }
                } catch (err: any) {
                    if (err.message && err.message.includes('not found')) {
                        setHasRestaurant(false);
                    } else {
                        console.error("Error fetching restaurant:", err);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (orders: FoodOrder[]) => {
        const total = orders.length;
        const pending = orders.filter(o => o.status.toUpperCase() === 'PENDING').length;
        const revenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        setStats({
            totalOrders: total,
            pendingOrders: pending,
            revenue: revenue,
            rating: 4.8 // Mocked
        });
    };

    const updateOrderStatus = async (id: number, newStatus: string) => {
        try {
            const res = await orderService.updateOrderStatus(id, newStatus as any);
            if (res && res.order) {
                const updatedOrders = orders.map(o => o.id === id ? res.order : o);
                setOrders(updatedOrders);
                calculateStats(updatedOrders);
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            Alert.alert('Error', 'Failed to update order status');
        }
    };

    const renderStatCard = (title: string, value: string | number, icon: any, color: string) => (
        <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
                {icon}
            </View>
            <View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
        </View>
    );

    const renderQuickAction = (title: string, icon: any, route: string, color: string) => (
        <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(route as any)} // Route might not exist yet, placeholder
            activeOpacity={0.7}
        >
            <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
                {icon}
            </View>
            <Text style={styles.actionText}>{title}</Text>
        </TouchableOpacity>
    );

    const renderOrderItem = (order: FoodOrder) => (
        <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{order.id.toString().slice(0, 8)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: order.status.toUpperCase() === 'PENDING' ? '#FEF3C7' : '#DEF7EC' }]}>
                    <Text style={[styles.statusText, { color: order.status.toUpperCase() === 'PENDING' ? '#D97706' : '#03543F' }]}>
                        {order.status.toUpperCase()}
                    </Text>
                </View>
            </View>
            <View style={styles.orderItems}>
                {order.items.map((item: FoodOrderItem, index) => (
                    <Text key={index} style={styles.orderItemText}>
                        {item.quantity}x {item.name || 'Item'}
                    </Text>
                ))}
            </View>
            <View style={styles.orderFooter}>
                <Text style={styles.orderTime}>{new Date(order.createdAt).toLocaleTimeString()}</Text>
                <Text style={styles.orderTotal}>Rs. {order.totalAmount}</Text>
            </View>
            {order.status.toUpperCase() === 'PENDING' && (
                <View style={styles.orderActions}>
                    <TouchableOpacity onPress={() => updateOrderStatus(order.id, 'CONFIRMED')} style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => updateOrderStatus(order.id, 'CANCELLED')} style={styles.declineButton}>
                        <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>
                            Hello, {loading ? "..." : (user?.full_name?.split(' ')[0] || "Partner")} 👋
                        </Text>
                        <Text style={styles.subGreeting}>Manage your restaurant</Text>
                    </View>
                </View>

                {/* Create Restaurant Prompt */}
                {!loading && !hasRestaurant && (
                    <View style={styles.createRestaurantCard}>
                        <Ionicons name="restaurant" size={48} color="#3B82F6" />
                        <Text style={styles.createRestaurantTitle}>Create Your Restaurant</Text>
                        <Text style={styles.createRestaurantText}>
                            You haven't set up your restaurant yet. Create a profile to start accepting orders.
                        </Text>
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push('/create-restaurant' as any)} // Assuming this route exists or will exist
                        >
                            <Text style={styles.createButtonText}>Get Started</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Stats Grid */}
                {hasRestaurant && (
                    <View style={styles.statsGrid}>
                        {renderStatCard('Orders', stats.totalOrders, <Ionicons name="receipt" size={20} color="#3B82F6" />, '#3B82F6')}
                        {renderStatCard('Pending', stats.pendingOrders, <Ionicons name="time" size={20} color="#F59E0B" />, '#F59E0B')}
                        {renderStatCard('Revenue', `Rs. ${stats.revenue}`, <Ionicons name="cash" size={20} color="#10B981" />, '#10B981')}
                        {renderStatCard('Rating', stats.rating, <Ionicons name="star" size={20} color="#8B5CF6" />, '#8B5CF6')}
                    </View>
                )}

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.gridContainer}>
                    {renderQuickAction('Menu', <MaterialIcons name="restaurant-menu" size={24} color="#fff" />, '/menu-management', '#EF4444')}
                    {renderQuickAction('Orders', <Ionicons name="list" size={24} color="#fff" />, '/restaurant-orders', '#8B5CF6')}
                    {renderQuickAction('Settings', <Ionicons name="settings" size={24} color="#fff" />, '/profile', '#6B7280')}
                    {renderQuickAction('Promotions', <Ionicons name="megaphone" size={24} color="#fff" />, '/promotions', '#F59E0B')}
                </View>

                {/* Recent Orders */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Orders</Text>
                    <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
                ) : (
                    <View style={styles.ordersList}>
                        {orders.length > 0 ? (
                            orders.slice(0, 5).map(renderOrderItem)
                        ) : (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>No active orders right now.</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 80 }} />
            </ScrollView>

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => { }}>
                    <Ionicons name="home" size={24} color="#3B82F6" />
                    <Text style={[styles.navText, { color: '#3B82F6' }]}>Dashboard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/menu-management' as any)}>
                    <Ionicons name="restaurant-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Menu</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/restaurant-orders' as any)}>
                    <Ionicons name="list-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Orders</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile' as any)}>
                    <Ionicons name="person-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Profile</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingTop: 10,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
    },
    subGreeting: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#fff',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
    },
    statCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    statTitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
        marginTop: 12,
    },
    actionButton: {
        width: '23%',
        alignItems: 'center',
        marginBottom: 16,
    },
    actionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    ordersList: {
        gap: 16,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
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
        fontSize: 11,
        fontWeight: '700',
    },
    orderItems: {
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 12,
    },
    orderItemText: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 4,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orderTime: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    orderTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    orderActions: {
        flexDirection: 'row',
        gap: 12,
    },
    acceptButton: {
        flex: 1,
        backgroundColor: '#10B981',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    declineButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    declineButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    emptyCard: {
        padding: 24,
        backgroundColor: '#fff',
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    emptyText: {
        color: '#9CA3AF',
        fontSize: 15,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    navItem: {
        alignItems: 'center',
    },
    navText: {
        fontSize: 12,
        marginTop: 4,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    createRestaurantCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    createRestaurantTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    createRestaurantText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    createButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
