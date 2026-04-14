import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { busService } from './services/busService';

export default function ManageRoutes() {
    const router = useRouter();
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRoutes = async () => {
        try {
            const res = await busService.getOperatorRoutes();
            if (res && res.routes) {
                // Filter out global routes if operator only wants to see theirs? No, show all they can use, but they can only edit/delete theirs.
                setRoutes(res.routes);
            }
        } catch (error) {
            console.error('Error fetching routes:', error);
            Alert.alert('Error', 'Failed to load routes');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchRoutes();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchRoutes();
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Route',
            'Are you sure you want to delete this route? This will affect any schedules using it.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await busService.deleteRoute(id);
                            fetchRoutes();
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to delete route');
                        }
                    }
                }
            ]
        );
    };

    const renderRoute = ({ item }: { item: any }) => {
        const isCustom = item.operatorId != null; // handles both null and undefined

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                        <Ionicons name="map" size={20} color="#3B82F6" />
                        <Text style={styles.routeName}>{item.name}</Text>
                        {isCustom && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>Custom</Text>
                            </View>
                        )}
                        {!isCustom && (
                            <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}>
                                <Text style={[styles.badgeText, { color: '#6B7280' }]}>Global</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.routeDetails}>
                    <Text style={styles.locationText}>{item.origin}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#9CA3AF" style={{ marginHorizontal: 8 }} />
                    <Text style={styles.locationText}>{item.destination}</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="speedometer-outline" size={16} color="#6B7280" />
                        <Text style={styles.statText}>{item.distance} km</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text style={styles.statText}>{Math.floor(item.duration / 60)}h {item.duration % 60}m</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text style={styles.statText}>
                            {Array.isArray(item.stops) ? item.stops.length : 0} Stops
                        </Text>
                    </View>
                </View>

                {isCustom && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
                            onPress={() => (router.push as any)({ pathname: '/create-route', params: { editRoute: JSON.stringify(item) } })}
                        >
                            <Ionicons name="create-outline" size={18} color="#3B82F6" />
                            <Text style={[styles.actionText, { color: '#3B82F6' }]}>Edit Route</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]}
                            onPress={() => handleDelete(item.id.toString())}
                        >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Routes</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={routes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderRoute}
                contentContainerStyle={styles.listContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={<Text style={styles.emptyText}>No routes available.</Text>}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/create-route')}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginLeft: 8,
    },
    badge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#10B981',
    },
    routeDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#F9FAFB',
        padding: 8,
        borderRadius: 8,
    },
    locationText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
        marginBottom: 12,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 6,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        paddingTop: 8,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    actionText: {
        fontWeight: '600',
        fontSize: 13,
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 40,
        fontStyle: 'italic',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});
