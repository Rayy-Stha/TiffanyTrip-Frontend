import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { busService, orderService, paymentService, restaurantService, tripService } from './services';

// Required for Expo Web to close the popup and resolve openAuthSessionAsync
WebBrowser.maybeCompleteAuthSession();

export default function Checkout() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Bus Booking Params
    const { scheduleId, selectedSeats, totalAmount, busName, travelDate } = params;

    // Khalti Return Params (If main window was redirected on Web)
    const { pidx, returnBookingId, returnOrderId } = params;

    const isBusBooking = !!scheduleId || !!returnBookingId;

    // Food Order Params
    const { restaurantId, restaurantName, cartItems, tripId, stopName } = params;
    const parsedCartItems = cartItems ? JSON.parse(cartItems as string) : [];

    const [selectedMethod, setSelectedMethod] = useState('Digital Wallet');
    const [loading, setLoading] = useState(false);

    // Bus Booking State
    const [passengerName, setPassengerName] = useState('');
    const [passengerPhone, setPassengerPhone] = useState('');
    const [passengerEmail, setPassengerEmail] = useState('');

    // Food Order State
    const [stopModalVisible, setStopModalVisible] = useState(false);
    const [selectedStop, setSelectedStop] = useState<any>(null);
    const [busStops, setBusStops] = useState<any[]>([]);
    const [fetchingStops, setFetchingStops] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [tripData, setTripData] = useState<any>(null);
    const [estimatedArrival, setEstimatedArrival] = useState<Date | null>(null);
    const [manualHour, setManualHour] = useState('');
    const [manualMinute, setManualMinute] = useState('');
    const [manualPeriod, setManualPeriod] = useState('AM');

    React.useEffect(() => {
        if (!isBusBooking && restaurantId) {
            fetchRestaurantStops();
        }
        if (tripId) {
            fetchTripDetails();
        }
    }, [restaurantId, tripId]);

    // Handle Khalti direct window redirection (fallback if openAuthSession doesn't catch it)
    React.useEffect(() => {
        if (pidx && (returnBookingId || returnOrderId)) {
            const verifyDirectPayment = async () => {
                setLoading(true);
                try {
                    if (returnBookingId) {
                        await paymentService.verifyKhaltiPayment({ pidx: pidx as string, bookingId: returnBookingId as string });
                    } else if (returnOrderId) {
                        await paymentService.verifyKhaltiPayment({ pidx: pidx as string, orderId: returnOrderId as string });
                    }
                    setSuccessModalVisible(true);
                } catch (error: any) {
                    Alert.alert('Payment Verification Failed', error.message || 'Could not verify the returned payment.');
                } finally {
                    setLoading(false);
                }
            };
            verifyDirectPayment();
        }
    }, [pidx, returnBookingId, returnOrderId]);

    React.useEffect(() => {
        if (selectedStop && selectedStop.arrivalTime && tripData) {
            calculateArrivalTime();
        }
    }, [selectedStop, tripData]);

    const fetchTripDetails = async () => {
        try {
            const response = await tripService.getTripById(tripId as string);
            if (response && response.trip) {
                setTripData(response.trip);
            }
        } catch (error) {
            console.error('Failed to fetch trip details:', error);
        }
    };

    const calculateArrivalTime = async () => {
        if (!selectedStop?.arrivalTime || !tripData?.bookings || !restaurantId) return;

        try {
            const restaurantResponse = await restaurantService.getRestaurantById(restaurantId as string);
            const routeId = restaurantResponse.restaurant.routeId;

            // Find the booking on this route
            const matchingBooking = tripData.bookings.find((b: any) => b.schedule.routeId === routeId);

            if (matchingBooking) {
                const departure = new Date(matchingBooking.schedule.departureTime);
                const offsetMins = parseInt(selectedStop.arrivalTime);

                const arrival = new Date(departure.getTime() + offsetMins * 60000);
                setEstimatedArrival(arrival);

                // Sync manual inputs for display/edit
                let h = arrival.getHours();
                const m = arrival.getMinutes();
                const p = h >= 12 ? 'PM' : 'AM';
                h = h % 12;
                h = h ? h : 12; // 0 should be 12

                setManualHour(h.toString());
                setManualMinute(m.toString().padStart(2, '0'));
                setManualPeriod(p);
            }
        } catch (error) {
            console.error('Error calculating arrival time:', error);
        }
    };

    const fetchRestaurantStops = async () => {
        try {
            setFetchingStops(true);
            const response = await restaurantService.getRestaurantById(restaurantId as string);
            if (response && response.restaurant && response.restaurant.route) {
                const stops = response.restaurant.route.stops;
                const stopsArray = Array.isArray(stops) ? stops : [];
                setBusStops(stopsArray);

                // Auto-select if stopName was passed
                if (stopName) {
                    const match = stopsArray.find((s: any) => s.name === stopName);
                    if (match) {
                        setSelectedStop(match);
                    } else {
                        // Fallback object if not found in stops, just in case
                        setSelectedStop({ name: stopName as string });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch restaurant stops:', error);
        } finally {
            setFetchingStops(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (isBusBooking) {
            await handleBusBooking();
        } else {
            await handleFoodOrder();
        }
    };

    const handleBusBooking = async () => {
        if (!passengerName || !passengerPhone || !passengerEmail) {
            Alert.alert('Missing Details', 'Please fill in all passenger details.');
            return;
        }

        setLoading(true);
        try {
            const seatNumbers = selectedSeats ? JSON.parse(selectedSeats as string) : [];

            const response = await busService.createBooking({
                scheduleId: scheduleId as string,
                seatNumbers,
                travelDate: travelDate as string,
                passengerName,
                passengerPhone,
                passengerEmail
            });

            if (selectedMethod === 'Digital Wallet (eSewa/Khalti)') {
                const bookingId = response.booking.id;

                // Add query params so we can handle main-window redirect fallback
                const baseUrl = Linking.createURL('checkout');
                const sep = baseUrl.includes('?') ? '&' : '?';
                const returnUrl = `${baseUrl}${sep}returnBookingId=${bookingId}`;

                const khaltiResponse = await paymentService.initiateKhaltiPayment({
                    amount: parseInt(totalAmount as string) * 100,
                    purchaseOrderId: bookingId.toString(),
                    purchaseOrderName: busName ? busName.toString() : 'Bus Ticket',
                    returnUrl: returnUrl,
                });

                if (khaltiResponse && khaltiResponse.payment_url) {
                    if (Platform.OS === 'web') {
                        window.location.href = khaltiResponse.payment_url;
                        return; // Stop execution, the page will redirect
                    }

                    const result = await WebBrowser.openAuthSessionAsync(khaltiResponse.payment_url, returnUrl);
                    if (result.type === 'success' && result.url) {
                        const parsedUrl = Linking.parse(result.url);
                        const pidx = parsedUrl.queryParams?.pidx as string;

                        if (pidx) {
                            await paymentService.verifyKhaltiPayment({ pidx, bookingId: bookingId.toString() });
                            setSuccessModalVisible(true);
                        } else {
                            Alert.alert('Payment Failed', 'Invalid payment response or cancelled.');
                        }
                    } else if (result.type === 'cancel' || result.type === 'dismiss') {
                        Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
                    }
                } else {
                    Alert.alert('Payment Error', 'Could not initiate Khalti payment.');
                }
            } else {
                setSuccessModalVisible(true);
            }
        } catch (error: any) {
            console.error('Booking failed:', error);
            Alert.alert('Booking Failed', error.message || 'Could not complete your booking.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date: Date) => {
        if (!(date instanceof Date) || isNaN(date.getTime())) return 'Not Set';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Helper to get a Date object from current manual inputs
    const getManualArrivalDate = () => {
        if (!manualHour || !manualMinute) return null;

        try {
            const now = new Date();
            let h = parseInt(manualHour);
            const m = parseInt(manualMinute);

            if (isNaN(h) || isNaN(m)) return null;
            if (h < 1 || h > 12 || m < 0 || m > 59) return null;

            if (manualPeriod === 'PM' && h < 12) h += 12;
            if (manualPeriod === 'AM' && h === 12) h = 0;

            // If we have trip data, use the trip's date instead of "today"
            let year = now.getFullYear();
            let month = now.getMonth();
            let date = now.getDate();

            if (tripData?.bookings?.[0]?.schedule?.departureTime) {
                const dep = new Date(tripData.bookings[0].schedule.departureTime);
                year = dep.getFullYear();
                month = dep.getMonth();
                date = dep.getDate();
            }

            return new Date(year, month, date, h, m);
        } catch (err) {
            console.error('Error parsing manual time:', err);
            return null;
        }
    };

    // Update estimatedArrival whenever manual inputs change (for UI display only)
    React.useEffect(() => {
        const date = getManualArrivalDate();
        setEstimatedArrival(date);
    }, [manualHour, manualMinute, manualPeriod]);
    const handleFoodOrder = async () => {
        // Guard: selectedStop
        if (!selectedStop) {
            Alert.alert('Delivery Point Required', 'Please select a bus stop for delivery.');
            return;
        }

        // Guard: restaurantId
        const parsedRestaurantId = parseInt(restaurantId as string);
        if (!restaurantId || isNaN(parsedRestaurantId)) {
            Alert.alert('Error', 'Invalid restaurant. Please go back and try again.');
            console.error('❌ Invalid restaurantId:', restaurantId);
            return;
        }

        // Guard: cart items
        if (!parsedCartItems || parsedCartItems.length === 0) {
            Alert.alert('Empty Cart', 'No items in your cart.');
            return;
        }

        // Guard: delivery time
        const deliveryTime = getManualArrivalDate();
        if (!deliveryTime || isNaN(deliveryTime.getTime())) {
            Alert.alert('Arrival Time Required', 'Please enter a valid bus arrival time (e.g. 08:30 AM).');
            return;
        }

        setLoading(true);
        try {
            // Build items array with explicit numeric parsing
            const items = parsedCartItems
                .map((item: any) => ({
                    menuItemId: parseInt(String(item.id)),
                    quantity: parseInt(String(item.quantity)) || 1
                }))
                .filter((item: any) => !isNaN(item.menuItemId) && item.menuItemId > 0);

            if (items.length === 0) {
                Alert.alert('Cart Error', 'Could not parse cart items. Please go back and try again.');
                setLoading(false);
                return;
            }

            const parsedTripId = tripId && tripId !== 'undefined' ? parseInt(tripId as string) : undefined;

            const orderParams: any = {
                restaurantId: parsedRestaurantId,
                items,
                deliveryLocation: selectedStop.name,
                deliveryLat: selectedStop.lat || null,
                deliveryLng: selectedStop.lng || null,
                deliveryTime: deliveryTime.toISOString(),
                notes: `Delivery to: ${selectedStop.name}`,
            };

            if (parsedTripId && !isNaN(parsedTripId)) {
                orderParams.tripId = parsedTripId;
            }

            console.warn('📤 ORDER PARAMS:', JSON.stringify(orderParams, null, 2));

            const response = await orderService.createOrder(orderParams);
            console.log('✅ Order success:', response);

            if (selectedMethod === 'Digital Wallet (eSewa/Khalti)') {
                const orderId = response.order.id;

                // Add query params so we can handle main-window redirect fallback
                const baseUrl = Linking.createURL('checkout');
                const sep = baseUrl.includes('?') ? '&' : '?';
                const returnUrl = `${baseUrl}${sep}returnOrderId=${orderId}`;

                const khaltiResponse = await paymentService.initiateKhaltiPayment({
                    amount: parseInt(totalAmount as string) * 100,
                    purchaseOrderId: orderId.toString(),
                    purchaseOrderName: restaurantName ? `Food Order from ${restaurantName}` : 'Food Order',
                    returnUrl: returnUrl,
                });

                if (khaltiResponse && khaltiResponse.payment_url) {
                    if (Platform.OS === 'web') {
                        window.location.href = khaltiResponse.payment_url;
                        return; // Stop execution, the page will redirect
                    }

                    const result = await WebBrowser.openAuthSessionAsync(khaltiResponse.payment_url, returnUrl);
                    if (result.type === 'success' && result.url) {
                        const parsedUrl = Linking.parse(result.url);
                        const pidx = parsedUrl.queryParams?.pidx as string;

                        if (pidx) {
                            await paymentService.verifyKhaltiPayment({ pidx, orderId: orderId.toString() });
                            setSuccessModalVisible(true);
                        } else {
                            Alert.alert('Payment Failed', 'Invalid payment response or cancelled.');
                        }
                    } else if (result.type === 'cancel' || result.type === 'dismiss') {
                        Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
                    }
                } else {
                    Alert.alert('Payment Error', 'Could not initiate Khalti payment.');
                }
            } else {
                setSuccessModalVisible(true);
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || error?.message || 'Could not place your order.';
            console.error('❌ Order Error:', msg, JSON.stringify(error?.response?.data || {}, null, 2));
            Alert.alert('Order Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    const goToDashboard = async () => {
        setSuccessModalVisible(false);
        try {
            const userStr = await AsyncStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const role = user.role?.toLowerCase();

                if (role === 'restaurant') {
                    router.push('/restaurant-dashboard' as any);
                } else if (role === 'bus_operator') {
                    router.push('/bus-dashboard' as any);
                } else {
                    router.push('/dashboard' as any);
                }
            } else {
                router.push('/dashboard' as any);
            }
        } catch (error) {
            console.error('Error getting user role:', error);
            router.push('/dashboard' as any);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>

                {/* Header */}
                <Text style={styles.headerTitle}>{isBusBooking ? 'Bus Checkout' : 'Food Checkout'}</Text>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>

                    {isBusBooking ? (
                        <>
                            <View style={styles.orderItem}>
                                <View>
                                    <Text style={styles.itemName}>{busName || 'Bus Ticket'}</Text>
                                    <Text style={styles.itemDesc}>Seats: {(selectedSeats ? JSON.parse(selectedSeats as string) : []).join(', ')}</Text>
                                </View>
                                <Text style={styles.itemPrice}>Rs. {totalAmount}</Text>
                            </View>
                        </>
                    ) : (
                        // Food Summary
                        <>
                            <Text style={styles.helperText}>Restaurant: {restaurantName}</Text>
                            {parsedCartItems.map((item: any) => (
                                <View key={item.id} style={styles.orderItem}>
                                    <View>
                                        <Text style={styles.itemName}>{item.name} x {item.quantity}</Text>
                                    </View>
                                    <Text style={styles.itemPrice}>Rs. {item.price * item.quantity}</Text>
                                </View>
                            ))}
                        </>
                    )}

                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total to Pay</Text>
                        <Text style={styles.totalAmount}>Rs. {totalAmount}</Text>
                    </View>
                </View>

                {/* Conditional Sections based on Type */}
                {isBusBooking ? (
                    /* Passenger Details for Bus */
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Passenger Details</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter full name"
                                value={passengerName}
                                onChangeText={setPassengerName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter phone number"
                                keyboardType="phone-pad"
                                value={passengerPhone}
                                onChangeText={setPassengerPhone}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter email address"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={passengerEmail}
                                onChangeText={setPassengerEmail}
                            />
                        </View>
                    </View>
                ) : (
                    /* Delivery Location for Food */
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Delivery Point</Text>
                        <Text style={styles.helperText}>Select the bus stop on your route where you want to receive the food.</Text>

                        {stopName ? (
                            <View style={[styles.dropdownSelector, { backgroundColor: '#F3F4F6' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={styles.iconBox}>
                                        <Ionicons name="location" size={20} color="#F59E0B" />
                                    </View>
                                    <Text style={styles.selectedStopText}>{stopName}</Text>
                                </View>
                                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.dropdownSelector, fetchingStops && { opacity: 0.6 }]}
                                onPress={() => !fetchingStops && setStopModalVisible(true)}
                                disabled={fetchingStops}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={styles.iconBox}>
                                        {fetchingStops ? (
                                            <ActivityIndicator size="small" color="#F59E0B" />
                                        ) : (
                                            <Ionicons name="location" size={20} color="#F59E0B" />
                                        )}
                                    </View>
                                    <Text style={styles.selectedStopText}>
                                        {fetchingStops ? 'Fetching Stops...' : (selectedStop ? selectedStop.name : 'Select Bus Stop')}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={20} color="#6B7280" />
                            </TouchableOpacity>
                        )}

                        {selectedStop && (
                            <View style={styles.timeSection}>
                                <Text style={styles.subLabel}>Estimated Bus Arrival at {selectedStop.name}</Text>
                                <View style={styles.timeInputRow}>
                                    <View style={styles.timeInputContainer}>
                                        <TextInput
                                            style={styles.timeInput}
                                            placeholder="HH"
                                            keyboardType="numeric"
                                            maxLength={2}
                                            value={manualHour}
                                            onChangeText={setManualHour}
                                        />
                                        <Text style={styles.timeColon}>:</Text>
                                        <TextInput
                                            style={styles.timeInput}
                                            placeholder="MM"
                                            keyboardType="numeric"
                                            maxLength={2}
                                            value={manualMinute}
                                            onChangeText={setManualMinute}
                                        />
                                    </View>

                                    <View style={styles.periodToggle}>
                                        <TouchableOpacity
                                            style={[styles.periodBtn, manualPeriod === 'AM' && styles.periodBtnActive]}
                                            onPress={() => setManualPeriod('AM')}
                                        >
                                            <Text style={[styles.periodText, manualPeriod === 'AM' && styles.periodTextActive]}>AM</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.periodBtn, manualPeriod === 'PM' && styles.periodBtnActive]}
                                            onPress={() => setManualPeriod('PM')}
                                        >
                                            <Text style={[styles.periodText, manualPeriod === 'PM' && styles.periodTextActive]}>PM</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <Text style={styles.timeHelp}>Type exact time (e.g. 08:30)</Text>

                            </View>
                        )}
                    </View>
                )}

                {/* Payment Methods */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    {['Digital Wallet (eSewa/Khalti)', 'Cash on Delivery'].map((method) => (
                        <TouchableOpacity
                            key={method}
                            style={[styles.paymentMethod, selectedMethod === method && styles.activeMethod]}
                            onPress={() => setSelectedMethod(method)}
                        >
                            <View style={styles.radioRow}>
                                <View style={[styles.radio, selectedMethod === method && styles.activeRadio]} />
                                <Text style={styles.methodText}>{method}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

            </ScrollView>

            {/* Place Order Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.placeOrderButton, loading && styles.disabledButton]}
                    onPress={handlePlaceOrder}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.placeOrderText}>
                            {isBusBooking ? 'Confirm Booking' : 'Place Order'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Bus Stop Selector Modal (Only for Food) */}
            {!isBusBooking && (
                <Modal visible={stopModalVisible} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Delivery Bus Stop</Text>
                            <FlatList
                                data={busStops}
                                keyExtractor={(item) => item.name}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalItem}
                                        onPress={() => {
                                            setSelectedStop(item);
                                            setStopModalVisible(false);
                                        }}
                                    >
                                        <Text style={styles.modalItemText}>{item.name}</Text>
                                        {selectedStop?.name === item.name && <Ionicons name="checkmark" size={20} color="#166534" />}
                                    </TouchableOpacity>
                                )}
                            />
                            <TouchableOpacity style={styles.closeButton} onPress={() => setStopModalVisible(false)}>
                                <Text style={styles.closeButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Order Success Modal */}
            <Modal visible={successModalVisible} transparent animationType="fade">
                <View style={styles.successOverlay}>
                    <View style={styles.successContent}>
                        <View style={styles.successIconCircle}>
                            <Ionicons name="checkmark-circle" size={80} color="#fff" />
                        </View>
                        <Text style={styles.successTitle}>Order Successful!</Text>
                        <Text style={styles.successMessage}>
                            Your {isBusBooking ? 'booking' : 'order'} has been placed successfully.
                        </Text>
                        <TouchableOpacity style={styles.successButton} onPress={goToDashboard}>
                            <Text style={styles.successButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    content: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 20,
    },
    section: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 12,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
    },
    itemDesc: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '800',
        color: '#166534',
    },
    helperText: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 12,
    },
    dropdownSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 16,
        borderRadius: 12,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedStopText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    paymentMethod: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    activeMethod: {
        backgroundColor: '#F0FDF4',
        borderRadius: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 0,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D1D5DB',
    },
    activeRadio: {
        borderColor: '#166534',
        borderWidth: 6,
    },
    methodText: {
        fontSize: 15,
        color: '#374151',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 15,
        color: '#111827',
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    placeOrderButton: {
        backgroundColor: '#166534',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#166534',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.7,
    },
    placeOrderText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 300,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalItemText: {
        fontSize: 16,
        color: '#374151',
    },
    closeButton: {
        marginTop: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    // Success Modal Styles
    successOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    successContent: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 32,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    successIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#166534',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    successButton: {
        backgroundColor: '#166534',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    successButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    arrivalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        padding: 10,
        borderRadius: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#FEF3C7',
    },
    arrivalText: {
        fontSize: 13,
        color: '#92400E',
        marginLeft: 6,
    },
    boldArrival: {
        fontWeight: 'bold',
    },
    timeSection: {
        marginTop: 16,
    },
    subLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    timeInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 8,
    },
    timeInput: {
        width: 40,
        height: 48,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    timeColon: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginHorizontal: 2,
    },
    periodToggle: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 4,
    },
    periodBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    periodBtnActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    periodText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
    },
    periodTextActive: {
        color: '#166534',
    },
    timeHelp: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 4,
        fontStyle: 'italic',
    },
});
