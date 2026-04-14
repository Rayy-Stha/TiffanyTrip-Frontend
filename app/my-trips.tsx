import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trip, tripService } from './services/tripService';


export default function MyTrips() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        try {
            setLoading(true);
            const response = await tripService.getUserTrips();
            if (response && response.trips) {
                setTrips(response.trips);
            }
        } catch (error) {
            console.error("Failed to load trips:", error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredTrips = () => {
        const today = new Date();
        return trips.filter(trip => {
            const endDate = new Date(trip.endDate);
            if (activeTab === 'upcoming') {
                return endDate >= today;
            } else {
                return endDate < today;
            }
        });
    };

    const filteredTrips = getFilteredTrips();

    const getDuration = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderTripCard = (trip: Trip) => (
        <TouchableOpacity
            key={trip.id}
            style={styles.tripCard}
            onPress={() => router.push({ pathname: '/trip-details', params: { tripId: trip.id } } as any)}
            activeOpacity={0.9}
        >
            {/* Colored Header Banner */}
            <View style={styles.cardBanner}>
                <View style={styles.cardBannerIcon}>
                    <Ionicons name="airplane" size={28} color="#fff" />
                </View>
                <View>
                    <Text style={styles.bannerDestination}>{trip.destination}</Text>
                    <Text style={styles.bannerDuration}>{getDuration(trip.startDate, trip.endDate)} days trip</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: activeTab === 'upcoming' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)' }]}>
                    <Text style={styles.statusText}>
                        {activeTab === 'upcoming' ? 'Upcoming' : 'Completed'}
                    </Text>
                </View>
            </View>

            {/* Card Body */}
            <View style={styles.tripContent}>
                <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={15} color="#6B7280" />
                    <Text style={styles.tripDate}>
                        {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                    </Text>
                </View>
                {trip.description ? (
                    <Text style={styles.tripDescription} numberOfLines={2}>{trip.description}</Text>
                ) : null}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Trips</Text>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => router.push('/create-trip' as any)}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
                    onPress={() => setActiveTab('upcoming')}
                >
                    <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
                    onPress={() => setActiveTab('completed')}
                >
                    <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>Completed</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {filteredTrips.length > 0 ? (
                        filteredTrips.map(renderTripCard)
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="airplane-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No {activeTab} trips found</Text>
                            {activeTab === 'upcoming' && (
                                <TouchableOpacity
                                    style={styles.planButton}
                                    onPress={() => router.push('/create-trip' as any)}
                                >
                                    <Text style={styles.planButtonText}>Plan a Trip</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Bottom Navigation Bar */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/dashboard' as any)}>
                    <Ionicons name="home-outline" size={24} color="#9CA3AF" />
                    <Text style={styles.navText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => { }}>
                    <Ionicons name="briefcase" size={24} color="#3B82F6" />
                    <Text style={[styles.navText, { color: '#3B82F6' }]}>My Trips</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => router.push('/restaurant-listing' as any)}>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    createButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: 4,
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: '#EFF6FF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#3B82F6',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100, // For bottom nav
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tripCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },
    cardBanner: {
        backgroundColor: '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    cardBannerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerDestination: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    bannerDuration: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    tripContent: {
        padding: 14,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tripDate: {
        fontSize: 13,
        color: '#6B7280',
    },
    tripDescription: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 6,
        lineHeight: 18,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginLeft: 'auto',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
        marginBottom: 24,
    },
    planButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#3B82F6',
        borderRadius: 24,
    },
    planButtonText: {
        color: '#fff',
        fontWeight: '600',
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
