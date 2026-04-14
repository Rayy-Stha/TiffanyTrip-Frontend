import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import StopsMapView from '../components/StopsMapView';

interface Stop {
    name: string;
    lat: number;
    lng: number;
    arrivalTime: string;
}

export default function StopsMap() {
    const router = useRouter();
    const { routeId, routeName, stopsJSON } = useLocalSearchParams();
    const stops: Stop[] = JSON.parse((stopsJSON as string) || '[]');
    const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

    // Provide some valid padding below the map if web because bottom navbar sometimes hides it
    const mapContainerStyle = Platform.OS === 'web' ? { flex: 1, paddingBottom: 60 } : { flex: 1 };

    const handleStopPress = (stop: Stop) => {
        setSelectedStop(stop === selectedStop ? null : stop);
    };

    const handleSeeRestaurants = () => {
        if (!selectedStop) return;
        (router.push as any)({
            pathname: '/restaurant-listing',
            params: {
                routeId: routeId as string,
                stopName: selectedStop.name,
            },
        });
    };

    const formatArrival = (t: string) => {
        const mins = parseInt(t);
        if (isNaN(mins) || mins === 0) return 'Starting point';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0
            ? `${h}h${m > 0 ? ` ${m}m` : ''} from start`
            : `${m}m from start`;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>{routeName}</Text>
                    <Text style={styles.headerSub}>Tap a stop to find restaurants</Text>
                </View>
            </View>

            {/* Route info bar */}
            {stops.length >= 2 && (
                <View style={styles.routeBar}>
                    <View style={styles.routeBarEnd}>
                        <View style={styles.dotGreen} />
                        <Text style={styles.routeBarText}>{stops[0].name}</Text>
                    </View>
                    <View style={styles.routeBarLine}>
                        <Ionicons name="arrow-forward" size={14} color="#F59E0B" />
                    </View>
                    <View style={styles.routeBarEnd}>
                        <View style={styles.dotRed} />
                        <Text style={styles.routeBarText}>{stops[stops.length - 1].name}</Text>
                    </View>
                </View>
            )}

            {/* Interactive Map */}
            <View style={mapContainerStyle}>
                <StopsMapView stops={stops} onSelectStop={handleStopPress} />
            </View>

            {/* Bottom Floating Card when a stop is selected */}
            {selectedStop && (
                <View style={styles.floatingCardContainer}>
                    <View style={styles.floatingCard}>
                        <View style={styles.floatingCardHeader}>
                            <View style={styles.floatingCardInfo}>
                                <Text style={styles.floatingStopName}>{selectedStop.name}</Text>
                                <Text style={styles.floatingStopTime}>{formatArrival(selectedStop.arrivalTime)}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedStop(null)} style={styles.closeBtn}>
                                <Ionicons name="close-circle" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.floatingActionBtn}
                            onPress={handleSeeRestaurants}
                        >
                            <Ionicons name="fast-food" size={18} color="#fff" />
                            <Text style={styles.floatingActionText}>
                                Find Restaurants at {selectedStop.name}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
    headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
    headerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    routeBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#FDE68A',
        gap: 8,
    },
    routeBarEnd: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    routeBarLine: { alignItems: 'center' },
    routeBarText: { fontSize: 13, fontWeight: '600', color: '#92400E' },
    dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
    dotRed: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
    floatingCardContainer: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        alignItems: 'center',
    },
    floatingCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    floatingCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    floatingCardInfo: {
        flex: 1,
    },
    floatingStopName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    floatingStopTime: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 4,
    },
    closeBtn: {
        padding: 4,
        marginLeft: 12,
    },
    floatingActionBtn: {
        backgroundColor: '#F59E0B',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    floatingActionText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
