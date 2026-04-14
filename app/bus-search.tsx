import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { busService, Schedule } from './services';

export default function BusSearch() {
    const router = useRouter();
    const [source, setSource] = useState('Kathmandu');
    const [destination, setDestination] = useState('Pokhara');
    const [date, setDate] = useState('2024-02-12');
    const [loading, setLoading] = useState(false);
    const [busResults, setBusResults] = useState<Schedule[]>([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!source || !destination || !date) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        setSearched(true);
        try {
            const response = await busService.searchBuses(source, destination, date);
            // The API might return { buses: [...] } or just [...] depending on implementation
            // Based on service it returns { buses: Schedule[], message?: string }
            setBusResults(response.buses || []);
        } catch (error: any) {
            console.error('Search error:', error);
            Alert.alert('Error', error.message || 'Failed to search buses');
            setBusResults([]);
        } finally {
            setLoading(false);
        }
    };

    const renderBusItem = ({ item }: { item: Schedule }) => (
        <View style={styles.busCard}>
            <View style={styles.busHeader}>
                <View style={styles.busInfo}>
                    <Text style={styles.operatorName}>{item.bus?.name || 'Bus Operator'}</Text>
                    <Text style={styles.busType}>{item.bus?.type || 'Standard'}</Text>
                </View>
                {item.bus?.rating && (
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={12} color="#fff" />
                        <Text style={styles.ratingText}>{item.bus.rating}</Text>
                    </View>
                )}
            </View>

            <View style={styles.divider} />

            <View style={styles.tripDetails}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Departure</Text>
                    <Text style={styles.detailValue}>
                        {new Date(item.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Price</Text>
                    <Text style={styles.priceText}>Rs. {item.fare}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Seats</Text>
                    <Text style={[styles.detailValue, { color: item.availableSeats < 10 ? '#EF4444' : '#10B981' }]}>
                        {item.availableSeats} left
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.bookButton}
                onPress={() => router.push({
                    pathname: '/seat-selection',
                    params: { scheduleId: item.id, price: item.fare, busName: item.bus?.name, travelDate: date }
                } as any)}
            >
                <Text style={styles.bookButtonText}>Select Seats</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Search Header */}
            <View style={styles.searchContainer}>
                <View style={styles.inputRow}>
                    <Ionicons name="location-outline" size={20} color="#6B7280" />
                    <TextInput
                        style={styles.input}
                        value={source}
                        onChangeText={setSource}
                        placeholder="From"
                    />
                </View>
                <View style={styles.connector}>
                    <View style={styles.dot} />
                    <View style={styles.line} />
                    <View style={styles.dot} />
                </View>
                <View style={styles.inputRow}>
                    <Ionicons name="location" size={20} color="#3B82F6" />
                    <TextInput
                        style={styles.input}
                        value={destination}
                        onChangeText={setDestination}
                        placeholder="To"
                    />
                </View>
                <View style={styles.dateRow}>
                    <Text style={styles.dateLabel}>Date</Text>
                    <TouchableOpacity style={styles.dateSelector}>
                        <Text style={styles.dateText}>{date}</Text>
                        <Ionicons name="calendar-outline" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={[styles.searchButton, loading && styles.disabledButton]}
                    onPress={handleSearch}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.searchButtonText}>Search Buses</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Results */}
            <FlatList
                data={busResults}
                renderItem={renderBusItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    searched ? (
                        <Text style={styles.resultsHeader}>
                            {busResults.length > 0 ? `Available Buses (${busResults.length})` : 'No buses found'}
                        </Text>
                    ) : null
                }
                ListEmptyComponent={
                    searched && !loading ? (
                        <View style={styles.centerEmpty}>
                            <Text style={styles.emptyText}>No available buses found for this route.</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    searchContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#111827',
    },
    connector: {
        height: 24,
        marginLeft: 26,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    line: {
        width: 2,
        height: 14,
        backgroundColor: '#D1D5DB',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        marginBottom: 20,
    },
    dateLabel: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 8,
    },
    dateText: {
        color: '#3B82F6',
        fontWeight: '600',
    },
    searchButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    searchButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    resultsHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        marginTop: 8,
    },
    listContent: {
        padding: 20,
    },
    busCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    busHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    busInfo: {
        flex: 1,
    },
    operatorName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
    },
    busType: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F59E0B',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 4,
    },
    ratingText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    tripDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    detailItem: {
        alignItems: 'flex-start',
    },
    detailLabel: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#3B82F6',
    },
    bookButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    bookButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    centerEmpty: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: '#6B7280',
        fontSize: 16,
    }
});
