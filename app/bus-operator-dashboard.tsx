import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { busService } from './services/busService';

interface DashboardStats {
    totalBuses: number;
    totalSchedules: number;
    activeBookings: number;
    revenue: number;
}

export default function BusOperatorDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        totalBuses: 0,
        totalSchedules: 0,
        activeBookings: 0,
        revenue: 0
    });
    const [recentBuses, setRecentBuses] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch buses and bookings in parallel
            const [busesRes, bookingsRes] = await Promise.all([
                busService.getAllBuses(),
                busService.getOperatorBookings().catch(() => ({ bookings: [] })) // Graceful fallback
            ]);

            if (busesRes && busesRes.buses) {
                setRecentBuses(busesRes.buses.slice(0, 3)); // Show only 3 recent buses

                // Calculate stats
                const totalBuses = busesRes.buses.length;
                const totalSchedules = busesRes.buses.reduce((sum: number, bus: any) => {
                    return sum + (bus._count?.schedules || 0);
                }, 0);

                // Calculate bookings and revenue
                const bookings = bookingsRes?.bookings || [];
                const activeBookings = bookings.filter((b: any) =>
                    b.status === 'PENDING' || b.status === 'CONFIRMED'
                ).length;

                const revenue = bookings
                    .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
                    .reduce((sum: number, b: any) => sum + (b.totalFare || 0), 0);

                setStats({
                    totalBuses,
                    totalSchedules,
                    activeBookings,
                    revenue
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            Alert.alert('Error', 'Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

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
                <View>
                    <Text style={styles.greeting}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>Bus Operator Dashboard</Text>
                </View>
                <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
                        <Ionicons name="bus" size={28} color="#3B82F6" />
                        <Text style={styles.statValue}>{stats.totalBuses}</Text>
                        <Text style={styles.statLabel}>Total Buses</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
                        <Ionicons name="calendar" size={28} color="#10B981" />
                        <Text style={styles.statValue}>{stats.totalSchedules}</Text>
                        <Text style={styles.statLabel}>Schedules</Text>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="ticket" size={28} color="#F59E0B" />
                        <Text style={styles.statValue}>{stats.activeBookings}</Text>
                        <Text style={styles.statLabel}>Active Bookings</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
                        <Ionicons name="cash" size={28} color="#EF4444" />
                        <Text style={styles.statValue}>Rs. {stats.revenue.toFixed(2)}</Text>
                        <Text style={styles.statLabel}>Revenue</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/create-bus')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                            <Ionicons name="add-circle" size={32} color="#3B82F6" />
                        </View>
                        <Text style={styles.actionText}>Add Bus</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/manage-routes')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
                            <Ionicons name="map" size={32} color="#A855F7" />
                        </View>
                        <Text style={styles.actionText}>Manage Routes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/create-schedule')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                            <Ionicons name="time" size={32} color="#10B981" />
                        </View>
                        <Text style={styles.actionText}>Add Schedule</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/bus-fleet')}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="list" size={32} color="#F59E0B" />
                        </View>
                        <Text style={styles.actionText}>View Fleet</Text>
                    </TouchableOpacity>
                </View>

                {/* Recent Buses */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Buses</Text>
                    <TouchableOpacity onPress={() => router.push('/bus-fleet')}>
                        <Text style={styles.seeAll}>See All</Text>
                    </TouchableOpacity>
                </View>

                {recentBuses.length > 0 ? (
                    recentBuses.map((bus) => (
                        <View key={bus.id} style={styles.busCard}>
                            <View style={styles.busIconContainer}>
                                <Ionicons name="bus" size={28} color="#3B82F6" />
                            </View>
                            <View style={styles.busInfo}>
                                <Text style={styles.busName}>{bus.name}</Text>
                                <Text style={styles.busDetails}>
                                    {bus.number} • {bus.type} • {bus.capacity} Seats
                                </Text>
                                <Text style={styles.busSchedules}>
                                    {bus._count?.schedules || 0} Schedule(s)
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() => router.push('/bus-fleet')}
                            >
                                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="bus-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No buses yet</Text>
                        <TouchableOpacity
                            style={styles.addFirstButton}
                            onPress={() => router.push('/create-bus')}
                        >
                            <Text style={styles.addFirstButtonText}>Add Your First Bus</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    refreshButton: {
        padding: 8,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 24,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    seeAll: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
    },
    actionIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '600',
        textAlign: 'center',
    },
    busCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    busIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    busInfo: {
        flex: 1,
    },
    busName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    busDetails: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 2,
    },
    busSchedules: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '500',
    },
    viewButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
        marginBottom: 20,
    },
    addFirstButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    addFirstButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});
