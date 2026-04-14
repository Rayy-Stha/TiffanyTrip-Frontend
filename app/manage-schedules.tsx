import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { busService, Schedule } from './services/busService';

export default function ManageSchedules() {
    const router = useRouter();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const res = await busService.getOperatorSchedules();
            if (res && res.schedules) {
                setSchedules(res.schedules);
            }
        } catch (error) {
            console.error('Error fetching schedules:', error);
            // Alert.alert('Error', 'Failed to load schedules');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Delete Schedule',
            'Are you sure you want to delete this schedule?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await busService.deleteSchedule(id);
                            setSchedules(prev => prev.filter(s => s.id !== id));
                        } catch (error) {
                            console.error('Error deleting schedule:', error);
                            Alert.alert('Error', 'Failed to delete schedule');
                        }
                    }
                }
            ]
        );
    };

    const renderSchedule = ({ item }: { item: Schedule }) => (
        <View style={styles.card}>
            <View style={styles.routeContainer}>
                <Text style={styles.city}>{item.route?.origin || 'Unknown'}</Text>
                <Ionicons name="arrow-forward" size={16} color="#9CA3AF" />
                <Text style={styles.city}>{item.route?.destination || 'Unknown'}</Text>
            </View>
            <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={16} color="#4B5563" />
                    <Text style={styles.detailText}>{new Date(item.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="cash-outline" size={16} color="#4B5563" />
                    <Text style={styles.detailText}>Rs. {item.fare}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="bus-outline" size={16} color="#4B5563" />
                    <Text style={styles.detailText}>{item.bus?.number || 'N/A'}</Text>
                </View>
            </View>
            <View style={styles.footerRow}>
                <View style={styles.daysContainer}>
                    {item.daysOfWeek.map(day => (
                        <View key={day} style={styles.dayBadge}>
                            <Text style={styles.dayText}>{day.substring(0, 3)}</Text>
                        </View>
                    ))}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Route Schedules</Text>
                <TouchableOpacity onPress={() => router.push('/create-schedule' as any)} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    data={schedules}
                    renderItem={renderSchedule}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyText}>No schedules created yet.</Text>
                            <TouchableOpacity
                                style={styles.createBtn}
                                onPress={() => router.push('/create-schedule' as any)}
                            >
                                <Text style={styles.createBtnText}>Create Your First Schedule</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
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
    addButton: {
        backgroundColor: '#3B82F6',
        padding: 8,
        borderRadius: 20,
    },
    listContent: {
        padding: 16,
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
        elevation: 1,
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    city: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    detailsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 12,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailText: {
        fontSize: 14,
        color: '#4B5563',
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    dayBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    dayText: {
        fontSize: 10,
        color: '#3B82F6',
        fontWeight: '600',
    },
    deleteButton: {
        padding: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#9CA3AF',
        marginBottom: 24,
    },
    createBtn: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    createBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
