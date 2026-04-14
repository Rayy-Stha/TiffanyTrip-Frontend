import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuccessModal from '../components/SuccessModal';
import { busService } from './services/busService';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CreateSchedule() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    // Data
    const [buses, setBuses] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);

    // Form
    const [formData, setFormData] = useState({
        busId: '',
        routeId: '',
        departureTime: '', // HH:MM
        arrivalTime: '',   // HH:MM
        fare: '',
        daysOfWeek: [] as string[]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setPageLoading(true);
            const [busesRes, routesRes] = await Promise.all([
                busService.getAllBuses(),
                busService.getOperatorRoutes()
            ]);

            if (busesRes && busesRes.buses) {
                setBuses(busesRes.buses);
            }
            if (routesRes && routesRes.routes) {
                setRoutes(routesRes.routes);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to load buses or routes');
        } finally {
            setPageLoading(false);
        }
    };

    const toggleDay = (day: string) => {
        setFormData(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day]
        }));
    };

    const handleCreate = async () => {
        if (!formData.busId || !formData.routeId || !formData.departureTime || !formData.arrivalTime || !formData.fare || formData.daysOfWeek.length === 0) {
            Alert.alert('Missing Fields', 'Please fill in all fields and select days.');
            return;
        }

        // Basic Time Validation (HH:MM)
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(formData.departureTime) || !timeRegex.test(formData.arrivalTime)) {
            Alert.alert('Invalid Time', 'Please use HH:MM 24-hour format (e.g. 14:30)');
            return;
        }

        try {
            setLoading(true);

            // Construct Date objects for time (using today's date as base, backend cares about time part mostly or needs full ISO)
            // Backend expects Date object. Let's create a dummy date with the time.
            const today = new Date().toISOString().split('T')[0];
            const departureDate = new Date(`${today}T${formData.departureTime}:00`);
            const arrivalDate = new Date(`${today}T${formData.arrivalTime}:00`);

            const res = await busService.createSchedule({
                busId: formData.busId,
                routeId: formData.routeId,
                departureTime: departureDate.toISOString(),
                arrivalTime: arrivalDate.toISOString(),
                daysOfWeek: formData.daysOfWeek,
                fare: parseFloat(formData.fare)
            });

            if (res && res.schedule) {
                setSuccessModalVisible(true);
            }
        } catch (error: any) {
            console.error('Error creating schedule:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create schedule');
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <SafeAreaView style={[styles.container, styles.center]}>
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
                <Text style={styles.headerTitle}>Create Schedule</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Bus Selection */}
                    <Text style={styles.label}>Select Bus *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {buses.length > 0 ? (
                            buses.map(bus => (
                                <TouchableOpacity
                                    key={bus.id}
                                    style={[styles.cardOption, formData.busId === bus.id.toString() && styles.selectedCard]}
                                    onPress={() => setFormData({ ...formData, busId: bus.id.toString() })}
                                >
                                    <View>
                                        <Text style={[styles.cardTitle, formData.busId === bus.id.toString() && styles.selectedCardText]}>{bus.name}</Text>
                                        <Text style={[styles.cardSubtitle, formData.busId === bus.id.toString() && styles.selectedCardText]}>{bus.number}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No buses found. Create one first.</Text>
                        )}
                    </ScrollView>

                    {/* Route Selection */}
                    <Text style={styles.label}>Select Route *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {routes.length > 0 ? (
                            routes.map(route => (
                                <TouchableOpacity
                                    key={route.id}
                                    style={[styles.cardOption, formData.routeId === route.id.toString() && styles.selectedCard]}
                                    onPress={() => setFormData({ ...formData, routeId: route.id.toString() })}
                                >
                                    <View>
                                        <Text style={[styles.cardTitle, formData.routeId === route.id.toString() && styles.selectedCardText]}>{route.name}</Text>
                                        <Text style={[styles.cardSubtitle, formData.routeId === route.id.toString() && styles.selectedCardText]}>{route.origin} - {route.destination}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No routes found.</Text>
                        )}
                    </ScrollView>

                    {/* Time & Fare */}
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Departure (HH:MM) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="08:00"
                                value={formData.departureTime}
                                onChangeText={t => setFormData({ ...formData, departureTime: t })}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.label}>Arrival (HH:MM) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="14:00"
                                value={formData.arrivalTime}
                                onChangeText={t => setFormData({ ...formData, arrivalTime: t })}
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Fare (Rs.) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="1000"
                        keyboardType="numeric"
                        value={formData.fare}
                        onChangeText={t => setFormData({ ...formData, fare: t })}
                    />

                    {/* Days Selection */}
                    <Text style={styles.label}>Running Days *</Text>
                    <View style={styles.daysContainer}>
                        {DAYS_OF_WEEK.map(day => (
                            <TouchableOpacity
                                key={day}
                                style={[styles.dayOption, formData.daysOfWeek.includes(day) && styles.selectedDay]}
                                onPress={() => toggleDay(day)}
                            >
                                <Text style={[styles.dayText, formData.daysOfWeek.includes(day) && styles.selectedDayText]}>
                                    {day.substring(0, 3)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Create Schedule</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            <SuccessModal
                visible={successModalVisible}
                title="Schedule Created!"
                message="The new bus schedule has been successfully created."
                buttonText="Done"
                onButtonPress={() => {
                    setSuccessModalVisible(false);
                    router.back();
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#F9FAFB',
    },
    row: {
        flexDirection: 'row',
    },
    horizontalScroll: {
        marginBottom: 8,
    },
    cardOption: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 10,
        minWidth: 120,
    },
    selectedCard: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    selectedCardText: {
        color: '#3B82F6',
    },
    emptyText: {
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    daysContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    dayOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectedDay: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    dayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    selectedDayText: {
        color: '#fff',
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 32,
        marginBottom: 40,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#93C5FD',
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
