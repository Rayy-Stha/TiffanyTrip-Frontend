import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { apiClient } from './utils/apiClient';

interface Stop {
    name: string;
    lat: number;
    lng: number;
    arrivalTime: string;
}

interface Route {
    id: number;
    name: string;
    origin: string;
    destination: string;
    distance: number;
    duration: number;
    stops: Stop[];
}

export default function RoutePicker() {
    const router = useRouter();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const res = await apiClient<{ routes: Route[] }>('/routes', { method: 'GET' });
            if (res && res.routes) setRoutes(res.routes);
        } catch (err) {
            console.error('Error fetching routes:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m}m`;
    };

    const renderRoute = ({ item }: { item: Route }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
                (router.push as any)({
                    pathname: '/stops-map',
                    params: {
                        routeId: item.id.toString(),
                        routeName: item.name,
                        stopsJSON: JSON.stringify(item.stops),
                    },
                })
            }
        >
            {/* Route Banner */}
            <View style={styles.routeBanner}>
                <View style={styles.routeIconWrap}>
                    <Ionicons name="bus" size={22} color="#fff" />
                </View>
                <View style={styles.routeNameWrap}>
                    <Text style={styles.routeName}>{item.name}</Text>
                    <Text style={styles.routeStops}>{item.stops?.length || 0} stops</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </View>

            {/* Route Body */}
            <View style={styles.routeBody}>
                <View style={styles.routeEndpoint}>
                    <View style={styles.dotGreen} />
                    <Text style={styles.endpointText}>{item.origin}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeEndpoint}>
                    <View style={styles.dotRed} />
                    <Text style={styles.endpointText}>{item.destination}</Text>
                </View>

                <View style={styles.routeMeta}>
                    <View style={styles.metaItem}>
                        <Ionicons name="speedometer-outline" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{item.distance} km</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{formatDuration(item.duration)}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Select a Route</Text>
                    <Text style={styles.headerSub}>Choose your bus route to find restaurants</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#F59E0B" />
                </View>
            ) : (
                <FlatList
                    data={routes}
                    renderItem={renderRoute}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="map-outline" size={56} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No routes available.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    headerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    list: { padding: 16, gap: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 12 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },
    routeBanner: {
        backgroundColor: '#F59E0B',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    routeIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    routeNameWrap: { flex: 1 },
    routeName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
    routeStops: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    routeBody: { padding: 16 },
    routeEndpoint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
    dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
    routeLine: {
        width: 2,
        height: 20,
        backgroundColor: '#E5E7EB',
        marginLeft: 4,
        marginVertical: 4,
    },
    endpointText: { fontSize: 15, fontWeight: '600', color: '#111827' },
    routeMeta: {
        flexDirection: 'row',
        gap: 20,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: 13, color: '#6B7280' },
});
