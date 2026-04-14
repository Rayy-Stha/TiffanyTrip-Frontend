import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationPickerMap from '../components/LocationPickerMap';
import SuccessModal from '../components/SuccessModal';
import { busService } from './services/busService';
import { restaurantService } from './services/restaurantService';

export default function CreateRestaurant() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingRoutes, setLoadingRoutes] = useState(true);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [routes, setRoutes] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        cuisine: '',
        routeId: '',
        busStop: '',
        description: '',
    });
    const [selectedRouteStops, setSelectedRouteStops] = useState<any[]>([]);

    // Map state
    const [showMapModal, setShowMapModal] = useState(false);
    const [pickedCoord, setPickedCoord] = useState<{ latitude: number; longitude: number } | null>(null);
    const [tempCoord, setTempCoord] = useState<{ latitude: number; longitude: number } | null>(null);

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const res = await busService.getAllRoutes();
            if (res && res.routes) {
                setRoutes(res.routes);
            }
        } catch (error) {
            console.error('Error fetching routes:', error);
            Alert.alert('Error', 'Failed to load routes. Please check your connection.');
        } finally {
            setLoadingRoutes(false);
        }
    };

    const handleLocationSelect = (coord: any) => {
        setTempCoord(coord);
    };

    const confirmMapLocation = () => {
        if (tempCoord) {
            setPickedCoord(tempCoord);
        }
        setShowMapModal(false);
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.location || !formData.cuisine || !formData.routeId) {
            Alert.alert('Missing Fields', 'Please fill in all required fields (Name, Location, Cuisine, Route).');
            return;
        }

        try {
            setLoading(true);
            const res = await restaurantService.createRestaurant({
                name: formData.name,
                location: formData.location,
                cuisine: formData.cuisine,
                routeId: formData.routeId,
                busStop: formData.busStop || undefined,
                description: formData.description,
                // Pass coordinates if picked
                ...(pickedCoord && {
                    latitude: pickedCoord.latitude,
                    longitude: pickedCoord.longitude,
                }),
            });

            if (res && res.restaurant) {
                setSuccessModalVisible(true);
            }
        } catch (error: any) {
            console.error('Error creating restaurant:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create restaurant');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Restaurant (WITH MAP)</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.label}>Restaurant Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Tasty Bites"
                        value={formData.name}
                        onChangeText={t => setFormData({ ...formData, name: t })}
                    />

                    <Text style={styles.label}>Location (City/Area) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Kathmandu"
                        value={formData.location}
                        onChangeText={t => setFormData({ ...formData, location: t })}
                    />

                    {/* Map Location Picker */}
                    <Text style={styles.label}>Pin on Map (Optional)</Text>
                    {pickedCoord && (
                        <View style={styles.coordPreview}>
                            <Ionicons name="location" size={14} color="#10B981" />
                            <Text style={styles.coordText}>
                                {pickedCoord.latitude.toFixed(5)}, {pickedCoord.longitude.toFixed(5)}
                            </Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={[styles.mapButton, !pickedCoord && styles.mapButtonPrimary]}
                        onPress={() => {
                            setTempCoord(pickedCoord);
                            setShowMapModal(true);
                        }}
                    >
                        <Ionicons name="map" size={18} color={!pickedCoord ? '#fff' : '#3B82F6'} />
                        <Text style={[styles.mapButtonText, !pickedCoord && { color: '#fff' }]}>
                            {pickedCoord ? 'Change Map Location' : 'Pick Location on Map'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>Cuisine Type *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Nepali, Indian, Continental"
                        value={formData.cuisine}
                        onChangeText={t => setFormData({ ...formData, cuisine: t })}
                    />

                    <Text style={styles.label}>Route *</Text>
                    <View style={styles.routeList}>
                        {loadingRoutes ? (
                            <ActivityIndicator size="small" color="#3B82F6" style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
                        ) : routes.length > 0 ? (
                            routes.map(route => (
                                <TouchableOpacity
                                    key={route.id}
                                    style={[
                                        styles.routeOption,
                                        formData.routeId === route.id.toString() && styles.selectedRoute
                                    ]}
                                    onPress={() => {
                                        setFormData({ ...formData, routeId: route.id.toString(), busStop: '' });
                                        setSelectedRouteStops(route.stops || []);
                                    }}
                                >
                                    <Text style={[
                                        styles.routeText,
                                        formData.routeId === route.id.toString() && styles.selectedRouteText
                                    ]}>
                                        {route.name} ({route.origin} - {route.destination})
                                    </Text>
                                    {formData.routeId === route.id.toString() && (
                                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.noRoutes}>No routes available. Please contact admin.</Text>
                        )}
                    </View>

                    {/* Bus Stop Picker - shown after a route is selected */}
                    {selectedRouteStops.length > 0 && (
                        <>
                            <Text style={styles.label}>Bus Stop *</Text>
                            <Text style={styles.sublabel}>Which bus stop is your restaurant near?</Text>
                            <View style={styles.routeList}>
                                {selectedRouteStops.map((stop: any, idx: number) => (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[
                                            styles.routeOption,
                                            formData.busStop === stop.name && styles.selectedStop
                                        ]}
                                        onPress={() => setFormData({ ...formData, busStop: stop.name })}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                                            <Ionicons
                                                name="location"
                                                size={16}
                                                color={formData.busStop === stop.name ? '#fff' : '#F59E0B'}
                                            />
                                            <Text style={[
                                                styles.routeText,
                                                formData.busStop === stop.name && styles.selectedRouteText
                                            ]}>
                                                {stop.name}
                                            </Text>
                                        </View>
                                        {formData.busStop === stop.name && (
                                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Tell us about your restaurant..."
                        multiline
                        value={formData.description}
                        onChangeText={t => setFormData({ ...formData, description: t })}
                    />

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Create Restaurant</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Map Modal */}
            <Modal visible={showMapModal} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowMapModal(false)} style={styles.backButton}>
                            <Ionicons name="close" size={28} color="#111827" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Pin Restaurant Location</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={{ flex: 1 }}>
                        <LocationPickerMap
                            onSelectLocation={handleLocationSelect}
                            initialLocation={tempCoord}
                        />
                        {Platform.OS !== 'web' && (
                            <View style={styles.mapOverlay}>
                                <Text style={styles.mapOverlayText}>Tap anywhere on the map to pin the restaurant.</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.confirmButton} onPress={confirmMapLocation}>
                            <Text style={styles.confirmButtonText}>Confirm Location</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            <SuccessModal
                visible={successModalVisible}
                title="Restaurant Created!"
                message="Your restaurant has been successfully created and linked to the route."
                buttonText="Go to Dashboard"
                onButtonPress={() => {
                    setSuccessModalVisible(false);
                    router.replace('/restaurant-dashboard' as any);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    content: { padding: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#111827',
        backgroundColor: '#F9FAFB',
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    coordPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 6,
    },
    coordText: { fontSize: 12, color: '#10B981', fontWeight: '600', marginLeft: 6 },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        gap: 8,
    },
    mapButtonPrimary: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    mapButtonText: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },
    routeList: { marginTop: 8, gap: 8 },
    routeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    sublabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 8, marginTop: -4 },
    selectedRoute: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
    selectedStop: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
    routeText: { fontSize: 14, color: '#374151', flex: 1 },
    selectedRouteText: { color: '#fff', fontWeight: '600' },
    noRoutes: { color: '#9CA3AF', fontStyle: 'italic', marginTop: 4 },
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
    disabledButton: { backgroundColor: '#93C5FD', opacity: 0.7 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#fff',
    },
    mapOverlay: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    mapOverlayText: { color: '#374151', fontWeight: '500', fontSize: 13 },
    modalFooter: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    confirmButton: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
