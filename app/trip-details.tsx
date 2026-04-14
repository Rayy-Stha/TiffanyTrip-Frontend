import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Trip, tripService } from './services';

export default function TripDetails() {
    const router = useRouter();
    const { tripId } = useLocalSearchParams();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingRestaurants, setLoadingRestaurants] = useState(false);

    useEffect(() => {
        if (tripId) {
            loadTripDetails();
            loadTripRestaurants();
        }
    }, [tripId]);

    const loadTripDetails = async () => {
        try {
            const response = await tripService.getTripById(tripId as string);
            if (response && response.trip) {
                setTrip(response.trip);
            }
        } catch (error) {
            console.error('Failed to load trip details:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTripRestaurants = async () => {
        try {
            setLoadingRestaurants(true);
            const response = await tripService.getTripRestaurants(tripId as string);
            if (response && response.restaurants) {
                setRestaurants(response.restaurants);
            }
        } catch (error) {
            console.error('Failed to load trip restaurants:', error);
        } finally {
            setLoadingRestaurants(false);
        }
    };

    const renderRestaurantCard = (restaurant: any) => (
        <TouchableOpacity
            key={restaurant.id}
            style={styles.restaurantCard}
            onPress={() => router.push({
                pathname: '/menu',
                params: {
                    restaurantId: restaurant.id,
                    restaurantName: restaurant.name,
                    tripId: tripId
                }
            } as any)}
        >
            <Image
                source={{ uri: restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2940&auto=format&fit=crop' }}
                style={styles.restaurantImage}
            />
            <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
                <Text style={styles.restaurantCuisine} numberOfLines={1}>{Array.isArray(restaurant.cuisine) ? restaurant.cuisine.join(', ') : restaurant.cuisine}</Text>
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{restaurant.rating || '4.5'}</Text>
                </View>
                <TouchableOpacity
                    style={styles.preorderBtn}
                    onPress={() => router.push({
                        pathname: '/menu',
                        params: {
                            restaurantId: restaurant.id,
                            restaurantName: restaurant.name,
                            tripId: tripId
                        }
                    } as any)}
                >
                    <Text style={styles.preorderBtnText}>Preorder</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );


    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (!trip) {
        return (
            <View style={[styles.container, styles.center]}>
                <Text style={styles.errorText}>Trip not found.</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtnText}>
                    <Text style={{ color: '#3B82F6' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Top Banner Area */}
            <View style={styles.banner}>
                <View style={styles.bannerHeader}>
                    <TouchableOpacity onPress={() => router.push('/dashboard' as any)} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.tripTitle}>{trip.name}</Text>
                        <View style={styles.headerDateRow}>
                            <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.tripDates}>
                                {new Date(trip.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(trip.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Content Area */}
            <ScrollView style={styles.contentArea} contentContainerStyle={styles.scrollPadding}>
                <View style={styles.descriptionSection}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.sectionText}>{trip.description || 'No description available for this trip.'}</Text>
                </View>

                <View style={styles.detailsDivider} />

                <View style={[styles.descriptionSection, { marginTop: 0 }]}>
                    <Text style={styles.sectionTitle}>Destination</Text>
                    <Text style={styles.sectionText}>{trip.destination}</Text>
                </View>

                {restaurants.length > 0 && (
                    <View style={styles.restaurantsSection}>
                        <Text style={styles.sectionTitle}>Restaurants on Route</Text>
                        <Text style={styles.sectionSubTitle}>Preorder food for your journey</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {restaurants.map(renderRestaurantCard)}
                        </ScrollView>
                    </View>
                )}
                {loadingRestaurants && <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 20 }} />}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    banner: {
        backgroundColor: '#3B82F6',
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    bannerHeader: {
        paddingHorizontal: 20,
    },
    headerTitleContainer: {
        marginTop: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tripTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 6,
    },
    tripDates: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },
    contentArea: {
        flex: 1,
    },
    scrollPadding: {
        padding: 24,
        paddingBottom: 40,
    },
    descriptionSection: {
        marginBottom: 24,
    },
    detailsDivider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 24,
    },
    restaurantsSection: {
        marginTop: 32,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    sectionSubTitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    horizontalScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    restaurantCard: {
        width: 160,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    restaurantImage: {
        width: '100%',
        height: 100,
    },
    restaurantInfo: {
        padding: 12,
    },
    restaurantName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    restaurantCuisine: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '600',
        marginLeft: 4,
    },
    preorderBtn: {
        backgroundColor: '#3B82F6',
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    preorderBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#9CA3AF',
        fontSize: 16,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        marginBottom: 12,
    },
    backBtnText: {
        padding: 8,
    },
    sectionPadding: {
        padding: 24,
    },
    sectionText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 40,
        fontSize: 16,
    }
});
