import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from './services/authService';
import { busService, Schedule } from './services/busService';

const { width } = Dimensions.get('window');

export default function BusDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [stats, setStats] = useState({
        totalBuses: 0,
        upcomingTrips: 0,
        totalBookings: 0,
        revenue: 0
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            console.log('🚌 Fetching dashboard data...');
            const [profileRes, schedulesRes, busesRes, bookingsRes] = await Promise.all([
                authService.getProfile(),
                busService.getOperatorSchedules(),
                busService.getAllBuses(),
                busService.getOperatorBookings()
            ]);

            console.log('✅ Dashboard Data fetched:', {
                schedules: schedulesRes?.schedules?.length,
                buses: busesRes?.buses?.length,
                bookings: bookingsRes?.bookings?.length
            });

            if (profileRes && profileRes.user) {
                setUser(profileRes.user);
            }

            let upcomingTrips = 0;
            if (schedulesRes && schedulesRes.schedules) {
                setSchedules(schedulesRes.schedules);
                upcomingTrips = schedulesRes.schedules.length;
            }

            let totalBuses = 0;
            if (busesRes && busesRes.buses) {
                totalBuses = busesRes.buses.length;
            }

            let totalBookings = 0;
            let totalRevenue = 0;
            if (bookingsRes && bookingsRes.bookings) {
                totalBookings = bookingsRes.bookings.length;
                totalRevenue = bookingsRes.bookings.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0);
            }

            const newStats = {
                totalBuses,
                upcomingTrips,
                totalBookings,
                revenue: totalRevenue
            };
            console.log('📊 Updating stats state:', newStats);
            setStats(newStats);

        } catch (error) {
            console.error("❌ Failed to load bus dashboard data:", error);
        } finally {
            setLoading(false);
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
            onPress={() => router.push(route as any)}
            activeOpacity={0.7}
        >
            <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
                {icon}
            </View>
            <Text style={styles.actionText}>{title}</Text>
        </TouchableOpacity>
    );

    const renderScheduleItem = (schedule: Schedule) => (
        <View key={schedule.id} style={styles.scheduleCard}>
            <View style={styles.scheduleRow}>
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{new Date(schedule.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    <Ionicons name="arrow-down" size={16} color="#9CA3AF" />
                    <Text style={styles.timeText}>{new Date(schedule.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.routeContainer}>
                    <Text style={styles.routeText}>{schedule.route?.origin}</Text>
                    <View style={styles.dottedLine} />
                    <Text style={styles.routeText}>{schedule.route?.destination}</Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>Rs. {schedule.fare}</Text>
                    <View style={[styles.seatBadge, { backgroundColor: schedule.availableSeats < 10 ? '#FEE2E2' : '#DEF7EC' }]}>
                        <Text style={[styles.seatText, { color: schedule.availableSeats < 10 ? '#B91C1C' : '#047857' }]}>
                            {schedule.availableSeats} Seats
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.scheduleFooter}>
                <Text style={styles.busId}>Bus ID: {schedule.busId}</Text>
                <TouchableOpacity>
                    <Text style={styles.actionLink}>View Passengers</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>
                            Hello, {loading ? "..." : (user?.full_name?.split(' ')[0] || "Operator")} 👋
                        </Text>
                        <Text style={styles.subGreeting}>Manage your fleet</Text>
                    </View>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {renderStatCard('Buses', stats.totalBuses, <FontAwesome5 name="bus" size={18} color="#3B82F6" />, '#3B82F6')}
                    {renderStatCard('Trips', stats.upcomingTrips, <Ionicons name="map" size={20} color="#F59E0B" />, '#F59E0B')}
                    {renderStatCard('Bookings', stats.totalBookings, <Ionicons name="ticket" size={20} color="#10B981" />, '#10B981')}
                    {renderStatCard('Revenue', `Rs. ${(stats.revenue / 1000).toFixed(1)}k`, <Ionicons name="cash" size={20} color="#8B5CF6" />, '#8B5CF6')}
                </View>

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.gridContainer}>
                    {renderQuickAction('Add Bus', <Ionicons name="add-circle" size={24} color="#fff" />, '/create-bus', '#10B981')}
                    {renderQuickAction('Routes', <Ionicons name="map" size={24} color="#fff" />, '/manage-routes', '#8B5CF6')}
                    {renderQuickAction('Schedules', <MaterialIcons name="schedule" size={24} color="#fff" />, '/manage-schedules', '#3B82F6')}
                    {renderQuickAction('Bookings', <Ionicons name="bookmarks" size={24} color="#fff" />, '/booking-list', '#F59E0B')}
                    {renderQuickAction('My Fleet', <FontAwesome5 name="bus" size={20} color="#fff" />, '/bus-fleet', '#EF4444')}
                    {renderQuickAction('Reports', <Ionicons name="document-text" size={24} color="#fff" />, '/profile', '#6B7280')}
                </View>

                {/* Upcoming Departures */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Upcoming Departures</Text>
                    <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
                ) : (
                    <View style={styles.schedulesList}>
                        {schedules.length > 0 ? (
                            schedules.map(renderScheduleItem)
                        ) : (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyText}>No upcoming schedules.</Text>
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
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/bus-fleet' as any)}>
                    <FontAwesome5 name="bus" size={20} color="#9CA3AF" />
                    <Text style={styles.navText}>My Fleet</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/manage-schedules' as any)}>
                    <MaterialIcons name="schedule" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Schedules</Text>
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
        width: '30%',
        alignItems: 'center',
        marginBottom: 20,
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
    schedulesList: {
        gap: 16,
    },
    scheduleCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    scheduleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeContainer: {
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    routeContainer: {
        flex: 1,
        marginHorizontal: 16,
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    routeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4B5563',
    },
    dottedLine: {
        height: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        marginVertical: 4,
    },
    priceContainer: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    priceText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    seatBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    seatText: {
        fontSize: 11,
        fontWeight: '700',
    },
    scheduleFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    busId: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    actionLink: {
        fontSize: 12,
        color: '#3B82F6',
        fontWeight: '600',
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
});
