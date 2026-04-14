import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Restaurant, restaurantService } from './services';

export default function RestaurantListing() {
    const router = useRouter();
    const { routeId, stopName } = useLocalSearchParams();
    const [filter, setFilter] = useState('All');
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRestaurants();
    }, [routeId]);

    const loadRestaurants = async () => {
        try {
            setLoading(true);
            const response = await restaurantService.getRestaurantsByRoute(
                routeId ? routeId.toString() : undefined,
                stopName ? stopName.toString() : undefined,
            );
            if (response && response.restaurants) {
                setRestaurants(response.restaurants);
            }
        } catch (error) {
            console.error('Failed to load restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredRestaurants = () => {
        if (filter === 'All') return restaurants;
        if (filter === 'Pure Veg') return restaurants.filter(r => r.cuisine.toLowerCase().includes('veg'));
        if (filter === 'Top Rated') return [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        return restaurants;
    };

    const renderRestaurant = ({ item }: { item: Restaurant }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push({
                pathname: '/menu',
                params: { restaurantId: item.id, restaurantName: item.name, stopName: stopName?.toString() }
            } as any)}
        >
            <View style={styles.restaurantBanner}>
                <View style={styles.restaurantIconWrap}>
                    <Ionicons name="restaurant" size={28} color="#fff" />
                </View>
                <View>
                    <Text style={styles.bannerName}>{item.name}</Text>
                    <Text style={styles.bannerLocation}>{item.location}</Text>
                </View>
            </View>
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.ratingBox}>
                        <Text style={styles.rating}>{item.rating || 'New'}</Text>
                        <Ionicons name="star" size={10} color="#fff" />
                    </View>
                </View>
                <Text style={styles.cuisine}>{item.cuisine}</Text>
                <View style={styles.footerRow}>
                    <View style={styles.timeContainer}>
                        <MaterialIcons name="access-time" size={14} color="#6B7280" />
                        <Text style={styles.time}>{item.openingHours || 'Open'}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#166534" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Stop Name Banner */}
            {stopName ? (
                <View style={styles.stopBanner}>
                    <Ionicons name="location" size={16} color="#F59E0B" />
                    <Text style={styles.stopBannerText}>Restaurants near <Text style={{ fontWeight: 'bold' }}>{stopName}</Text></Text>
                </View>
            ) : null}

            {/* Filters */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['All', 'Pure Veg', 'Top Rated'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterChip, filter === f && styles.activeFilter]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={getFilteredRestaurants()}
                renderItem={renderRestaurant}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>No restaurants found.</Text>}
            />
        </View>
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
    filterContainer: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
        backgroundColor: '#fff',
    },
    activeFilter: {
        backgroundColor: '#111827',
        borderColor: '#111827',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    activeFilterText: {
        color: '#fff',
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    restaurantBanner: {
        backgroundColor: '#F97316',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
    },
    restaurantIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerName: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    bannerLocation: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.85)',
        marginTop: 2,
    },
    stopBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFFBEB',
        borderBottomWidth: 1,
        borderBottomColor: '#FDE68A',
    },
    stopBannerText: { fontSize: 13, color: '#92400E' },
    content: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
    },
    ratingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 2,
    },
    rating: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    cuisine: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    time: {
        fontSize: 13,
        color: '#6B7280',
    },
    vegBadge: {
        backgroundColor: '#DEF7EC',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    vegText: {
        color: '#03543F',
        fontSize: 10,
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: 16,
        marginTop: 20,
    }
});
