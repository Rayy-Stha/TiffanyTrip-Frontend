import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { busService, Seat } from './services';

// 2x2 Layout
const totalRows = 9; // Increased for better scrolling test

export default function SeatSelection() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { scheduleId, price, busName, travelDate } = params;

    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [bookedSeats, setBookedSeats] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [seatMap, setSeatMap] = useState<Seat[]>([]);

    useEffect(() => {
        loadSeats();
    }, [scheduleId]);

    const loadSeats = async () => {
        if (!scheduleId) return;

        try {
            const response = await busService.getSeats(scheduleId as string);
            if (response && response.bookedSeats) {
                setBookedSeats(response.bookedSeats);
            }
        } catch (error) {
            console.error('Failed to load seats:', error);
            // Fallback for demo if API fails or returns nothing (just to show UI)
            console.log('Using fallback/empty seat map');
        } finally {
            setLoading(false);
        }
    };

    const toggleSeat = (seatId: string) => {
        if (bookedSeats.includes(seatId)) return;

        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(selectedSeats.filter(id => id !== seatId));
        } else {
            setSelectedSeats([...selectedSeats, seatId]);
        }
    };

    const handleProceed = () => {
        if (selectedSeats.length === 0) {
            Alert.alert('No Seats Selected', 'Please select at least one seat to proceed.');
            return;
        }

        const numericPrice = price ? Number(price) : 0;
        const totalAmount = selectedSeats.length * numericPrice;

        router.push({
            pathname: '/checkout',
            params: {
                scheduleId,
                selectedSeats: JSON.stringify(selectedSeats),
                totalAmount,
                busName,
                pricePerSeat: numericPrice,
                travelDate
            }
        } as any);
    };

    const seatSize = (Dimensions.get('window').width - 40 - 30 - 40) / 4; // Total width - padding - aisle - gaps
    const finalSeatSize = Math.min(seatSize, 50); // Cap size for tablets

    const renderSeat = (row: number, col: string) => {
        const seatId = `${col}${row}`;
        const isBooked = bookedSeats.includes(seatId);
        const isSelected = selectedSeats.includes(seatId);

        let seatColor = '#E5E7EB'; // Available
        let iconColor = '#9CA3AF';

        if (isBooked) {
            seatColor = '#EF4444'; // Booked
            iconColor = '#fff';
        } else if (isSelected) {
            seatColor = '#10B981'; // Selected
            iconColor = '#fff';
        }

        return (
            <TouchableOpacity
                key={seatId}
                style={[styles.seat, { backgroundColor: seatColor, width: finalSeatSize, height: finalSeatSize }]}
                disabled={isBooked}
                onPress={() => toggleSeat(seatId)}
            >
                <MaterialCommunityIcons name="seat" size={20} color={iconColor} />
                <Text style={[styles.seatLabel, (isBooked || isSelected) && { color: '#fff' }]}>{seatId}</Text>
            </TouchableOpacity>
        );
    };

    const renderRow = (rowNum: number) => (
        <View key={rowNum} style={styles.rowContainer}>
            <View style={styles.seatPair}>
                {renderSeat(rowNum, 'A')}
                {renderSeat(rowNum, 'B')}
            </View>

            <View style={styles.aisle}>
                <Text style={styles.rowNumber}>{rowNum}</Text>
            </View>

            <View style={styles.seatPair}>
                {renderSeat(rowNum, 'C')}
                {renderSeat(rowNum, 'D')}
            </View>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#166534" />
                <Text style={styles.loadingText}>Loading seats...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{busName || 'Select Seats'}</Text>
                    <Text style={styles.headerSubtitle}>Rs. {price} per seat</Text>
                </View>
            </View>

            <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: '#E5E7EB' }]} />
                    <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.legendText}>Selected</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.legendText}>Booked</Text>
                </View>
            </View>

            <View style={styles.busContainer}>
                <View style={styles.driverSection}>
                    <MaterialCommunityIcons name="steering" size={32} color="#374151" />
                </View>

                <ScrollView style={styles.seatMap} contentContainerStyle={styles.seatMapContent}>
                    {Array.from({ length: totalRows }).map((_, i) => renderRow(i + 1))}
                </ScrollView>
            </View>

            <View style={styles.footer}>
                <View>
                    <Text style={styles.totalLabel}>Total Price</Text>
                    <Text style={styles.totalPrice}>Rs. {selectedSeats.length * (Number(price) || 0)}</Text>
                </View>
                <TouchableOpacity style={styles.payButton} onPress={handleProceed}>
                    <Text style={styles.payButtonText}>Proceed to Checkout</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#6B7280',
        fontSize: 16,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 24,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    legendBox: {
        width: 20,
        height: 20,
        borderRadius: 6,
    },
    legendText: {
        fontSize: 14,
        color: '#4B5563',
    },
    busContainer: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    driverSection: {
        width: '100%',
        alignItems: 'flex-end',
        paddingRight: 20,
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    seatMap: {
        width: '100%',
    },
    seatMapContent: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 20,
    },
    seatPair: {
        flexDirection: 'row',
        gap: 12,
    },
    aisle: {
        width: 30,
        alignItems: 'center',
    },
    rowNumber: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    seat: {
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    seatLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#6B7280',
        position: 'absolute',
        top: 2,
        right: 2,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#fff',
    },
    totalLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    totalPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    payButton: {
        backgroundColor: '#111827',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    payButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
