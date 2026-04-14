import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService, dashboardService, Recommendation, UpcomingTrip } from './services';
import { FoodOrder } from './services/orderService';

const { width } = Dimensions.get('window');

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [upcomingTrips, setUpcomingTrips] = useState<UpcomingTrip[]>([]);
    const [recommendedDestinations, setRecommendedDestinations] = useState<Recommendation[]>([]);
    const [activeOrder, setActiveOrder] = useState<FoodOrder | null>(null);
    const [orderModalVisible, setOrderModalVisible] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getDaysLeft = (dateString: string) => {
        const tripDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = tripDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const loadDashboardData = async () => {
        try {
            const [profileRes, tripsRes, recsRes] = await Promise.all([
                authService.getProfile(),
                dashboardService.getUpcomingTrips(),
                dashboardService.getRecommendations()
            ]);

            if (profileRes && profileRes.user) {
                setUser(profileRes.user);
            }
            if (tripsRes && tripsRes.trips) {
                setUpcomingTrips(tripsRes.trips);
            }
            if (recsRes && recsRes.recommendations) {
                setRecommendedDestinations(recsRes.recommendations);
            }
        } catch (error) {
            console.error("Failed to load dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header Section */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>
                            Hello, {loading ? "..." : (user?.full_name?.split(' ')[0] || "Traveler")} 👋
                        </Text>
                        <Text style={styles.subGreeting}>Where do you want to go today?</Text>
                    </View>
                </View>

                {/* Quick Actions Grid */}
                <View style={styles.gridContainer}>
                    {renderQuickAction('Plan a Trip', <FontAwesome5 name="map-marked-alt" size={24} color="#fff" />, '/create-trip', '#3B82F6')}
                    {renderQuickAction('Book Bus', <FontAwesome5 name="bus" size={24} color="#fff" />, '/bus-search', '#10B981')}
                    {renderQuickAction('Order Food', <Ionicons name="fast-food" size={24} color="#fff" />, '/route-picker', '#F59E0B')}
                    {renderQuickAction('My Bookings', <Ionicons name="ticket-outline" size={24} color="#fff" />, '/my-bus-bookings', '#8B5CF6')}
                </View>

                {/* Upcoming Trips Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Upcoming Trips</Text>
                    <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {upcomingTrips.length > 0 ? (
                        upcomingTrips.map((trip) => (
                            <TouchableOpacity
                                key={trip.id}
                                style={styles.tripCard}
                                activeOpacity={0.9}
                                onPress={() => router.push({ pathname: '/trip-details', params: { tripId: trip.id } } as any)}
                            >
                                <View style={styles.tripContent}>
                                    <View style={styles.tripInfo}>
                                        <Text style={styles.tripDestination}>{trip.destination}</Text>
                                        <View style={styles.dateRow}>
                                            <FontAwesome5 name="calendar-alt" size={12} color="#3B82F6" />
                                            <Text style={styles.tripDate}>{formatDate(trip.startDate)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.statusBadge}>
                                        <Text style={styles.statusText}>{getDaysLeft(trip.startDate)} days left</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>No upcoming trips planned.</Text>
                            <TouchableOpacity onPress={() => router.push('/create-trip' as any)}>
                                <Text style={styles.linkText}>Plan one now!</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>

                {/* Recommended Destinations */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recommended</Text>
                    <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
                </View>
                <View style={styles.recommendedGrid}>
                    {recommendedDestinations.map((place) => (
                        <TouchableOpacity key={place.id} style={styles.placeCard} activeOpacity={0.9}>
                            <Image source={{ uri: place.image }} style={styles.placeImage} />
                            <View style={styles.placeInfo}>
                                <Text style={styles.placeName}>{place.title}</Text>
                                <View style={styles.ratingContainer}>
                                    <Ionicons name="star" size={14} color="#F59E0B" />
                                    <Text style={styles.ratingText}>{place.rating || '4.5'}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => { }}>
                    <Ionicons name="home" size={24} color="#3B82F6" />
                    <Text style={[styles.navText, { color: '#3B82F6' }]}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/my-trips' as any)}>
                    <Ionicons name="briefcase-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>My Trips</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/order-history' as any)}>
                    <Ionicons name="receipt-outline" size={24} color="#9CA3AF" />
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

const getStatusColor = (status: string) => {
    switch (status) {
        case 'PENDING': return '#F59E0B';
        case 'CONFIRMED': return '#3B82F6';
        case 'PREPARING': return '#8B5CF6';
        case 'READY': return '#10B981';
        default: return '#6B7280';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 10,
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
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionButton: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    actionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
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
    horizontalScroll: {
        marginBottom: 24,
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    tripCard: {
        width: width * 0.75,
        height: 120,
        marginRight: 16,
        borderRadius: 20,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    tripContent: {
        flex: 1,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tripInfo: {
        flex: 1,
    },
    tripDestination: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 8,
    },
    tripDate: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    statusBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    statusText: {
        color: '#3B82F6',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    recommendedGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    placeCard: {
        width: (width - 56) / 2, // (screen width - 40px padding - 16px gap) / 2
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    placeImage: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    placeInfo: {
        padding: 12,
    },
    placeName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#4B5563',
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
    emptyCard: {
        width: width * 0.75,
        height: 160,
        marginRight: 16,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    linkText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3B82F6',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    orderModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeaderStrip: {
        width: 40,
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    orderModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orderStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 8,
    },
    statusPulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    orderStatusText: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    orderRestName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    orderSummary: {
        fontSize: 15,
        color: '#6B7280',
        lineHeight: 22,
        marginBottom: 24,
    },
    orderActionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    trackButton: {
        flex: 2,
        backgroundColor: '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    trackButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    historyButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
    },
    historyButtonText: {
        color: '#374151',
        fontSize: 15,
        fontWeight: '600',
    },
});
