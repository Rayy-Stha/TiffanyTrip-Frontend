import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore
import OrderMap from '../components/OrderMap';

export default function OrderTracking() {
    const router = useRouter();
    const { orderJSON } = useLocalSearchParams();

    const [order, setOrder] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orderJSON) {
            try {
                setOrder(JSON.parse(orderJSON as string));
            } catch (e) {
                console.error("Failed to parse order stats:", e);
            }
        }
    }, [orderJSON]);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                setLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            setLoading(false);
        })();
    }, []);

    if (loading || !order) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading Map Data...</Text>
            </SafeAreaView>
        );
    }

    const { restaurant, deliveryLat, deliveryLng, deliveryLocation } = order;

    // Provide default fallback coordinates if none exist
    const restCoord = {
        latitude: restaurant?.latitude || 27.7172,
        longitude: restaurant?.longitude || 85.3240
    };

    const destCoord = {
        latitude: deliveryLat || 27.8546,
        longitude: deliveryLng || 84.5574
    };

    const hasDestination = !!deliveryLat && !!deliveryLng;

    // Determine initial region focusing slightly around the points
    const initialRegion = {
        latitude: (restCoord.latitude + destCoord.latitude) / 2,
        longitude: (restCoord.longitude + destCoord.longitude) / 2,
        latitudeDelta: Math.abs(restCoord.latitude - destCoord.latitude) * 2 || 0.1,
        longitudeDelta: Math.abs(restCoord.longitude - destCoord.longitude) * 2 || 0.1,
    };

    if (Platform.OS === ('web' as string)) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <Ionicons name="map-outline" size={64} color="#D1D5DB" />
                <Text style={{ marginTop: 16, color: '#374151', fontSize: 18, fontWeight: 'bold' }}>Feature Not Supported</Text>
                <Text style={{ marginTop: 8, color: '#6B7280', textAlign: 'center', paddingHorizontal: 40 }}>
                    Live map tracking is native-only and relies on GPS. Please open the iOS or Android app to view the delivery route map.
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#3B82F6', borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            {/* Map Area */}
            {Platform.OS !== ('web' as string) && (
                <OrderMap
                    initialRegion={initialRegion}
                    restCoord={restCoord}
                    destCoord={destCoord}
                    restaurant={restaurant}
                    deliveryLocation={deliveryLocation}
                    hasDestination={hasDestination}
                />
            )}

            {/* Top Toolbar */}
            <SafeAreaView style={styles.headerAbsolute}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Bottom Info Sheet */}
            <View style={styles.bottomSheet}>
                <Text style={styles.sheetTitle}>Tracking Order #{order.id}</Text>

                <View style={styles.trackingTimeline}>
                    <View style={styles.timelineItem}>
                        <Ionicons name="restaurant-outline" size={20} color="#EF4444" style={styles.timelineIcon} />
                        <View style={styles.timelineTextContainer}>
                            <Text style={styles.timelineLabel}>Pickup From</Text>
                            <Text style={styles.timelineValue}>{restaurant?.name || 'Restaurant'}</Text>
                        </View>
                    </View>

                    <View style={styles.timelineDash} />

                    <View style={styles.timelineItem}>
                        <Ionicons name="location-outline" size={20} color="#10B981" style={styles.timelineIcon} />
                        <View style={styles.timelineTextContainer}>
                            <Text style={styles.timelineLabel}>Delivery Bus Stop</Text>
                            <Text style={styles.timelineValue}>{deliveryLocation || 'Target Bus Stop'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.statusBox}>
                    <View style={styles.statusMain}>
                        <Text style={styles.statusTitle}>Current Status</Text>
                        <Text style={[styles.statusValue, { color: '#F59E0B' }]}>{order.status}</Text>
                    </View>
                    {order.deliveryTime && (
                        <View style={styles.arrivalInfo}>
                            <Text style={styles.arrivalLabel}>Est. Arrival</Text>
                            <Text style={styles.arrivalTime}>
                                {new Date(order.deliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    )}
                </View>

            </View>
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
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    headerAbsolute: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 10 : 0,
    },
    backButton: {
        backgroundColor: '#fff',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 20,
    },
    trackingTimeline: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timelineIcon: {
        width: 24,
        marginRight: 12,
        textAlign: 'center',
    },
    timelineTextContainer: {
        flex: 1,
    },
    timelineLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    timelineValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginTop: 2,
    },
    timelineDash: {
        height: 20,
        width: 2,
        backgroundColor: '#E5E7EB',
        marginLeft: 11,
        marginVertical: 4,
    },
    statusBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statusMain: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    statusValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    arrivalInfo: {
        alignItems: 'flex-end',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    arrivalLabel: {
        fontSize: 10,
        color: '#92400E',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    arrivalTime: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#B45309',
    },
    markerContainer: {
        backgroundColor: '#fff',
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    }
});
