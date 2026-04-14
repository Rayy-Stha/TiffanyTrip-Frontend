import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationPickerMap from '../components/LocationPickerMap';
import SuccessModal from '../components/SuccessModal';
import { busService } from './services/busService';

export default function CreateRoute() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        name: '',
        origin: '',
        destination: '',
        distance: '',
        duration: ''
    });

    // Map Integration
    const [showMapModal, setShowMapModal] = useState(false);
    const [currentStopIndex, setCurrentStopIndex] = useState<number | null>(null);
    const [tempCoordinate, setTempCoordinate] = useState<{ latitude: number, longitude: number } | null>(null);

    // Dynamic Stops
    const [stops, setStops] = useState([{ name: '', lat: '', lng: '', arrivalTime: '' }]);

    useEffect(() => {
        if (params.editRoute) {
            try {
                const routeData = JSON.parse(params.editRoute as string);
                setEditId(routeData.id.toString());
                setFormData({
                    name: routeData.name || '',
                    origin: routeData.origin || '',
                    destination: routeData.destination || '',
                    distance: routeData.distance ? routeData.distance.toString() : '',
                    duration: routeData.duration ? routeData.duration.toString() : ''
                });

                if (routeData.stops && Array.isArray(routeData.stops) && routeData.stops.length > 0) {
                    setStops(routeData.stops.map((s: any) => ({
                        name: s.name || '',
                        lat: s.lat ? s.lat.toString() : '',
                        lng: s.lng ? s.lng.toString() : '',
                        arrivalTime: s.arrivalTime ? s.arrivalTime.toString() : ''
                    })));
                }
            } catch (err) {
                console.error("Error parsing edit route:", err);
            }
        }
    }, [params.editRoute]);

    const addStop = () => {
        setStops([...stops, { name: '', lat: '', lng: '', arrivalTime: '' }]);
    };

    const removeStop = (index: number) => {
        if (stops.length > 1) {
            setStops(stops.filter((_, i) => i !== index));
        }
    };

    const updateStop = (index: number, field: string, value: string) => {
        const newStops = [...stops];
        newStops[index] = { ...newStops[index], [field]: value };
        setStops(newStops);
    };

    const openMapForStop = (index: number) => {
        setCurrentStopIndex(index);
        const stop = stops[index];
        if (stop.lat && stop.lng && !isNaN(parseFloat(stop.lat)) && !isNaN(parseFloat(stop.lng))) {
            setTempCoordinate({ latitude: parseFloat(stop.lat), longitude: parseFloat(stop.lng) });
        } else {
            setTempCoordinate(null);
        }
        setShowMapModal(true);
    };

    const handleLocationSelect = (coord: any) => {
        setTempCoordinate(coord);
    };

    const confirmLocation = () => {
        if (currentStopIndex !== null && tempCoordinate) {
            // Single atomic update to avoid stale closure overwrite bug
            setStops(prev => {
                const updated = [...prev];
                updated[currentStopIndex] = {
                    ...updated[currentStopIndex],
                    lat: tempCoordinate.latitude.toFixed(6),
                    lng: tempCoordinate.longitude.toFixed(6),
                };
                return updated;
            });
        }
        setShowMapModal(false);
    };

    const handleCreate = async () => {
        if (!formData.name || !formData.origin || !formData.destination || !formData.distance || !formData.duration) {
            Alert.alert('Missing Fields', 'Please fill out all route details.');
            return;
        }

        // Validate stops
        const invalidStops = stops.some(s => !s.name || !s.lat || !s.lng);
        if (invalidStops) {
            Alert.alert('Missing Stop Data', 'Please ensure all stops have a name and coordinates.');
            return;
        }

        try {
            setLoading(true);

            // Cast stops to actual numbers for db
            const formattedStops = stops.map(s => ({
                name: s.name,
                lat: parseFloat(s.lat),
                lng: parseFloat(s.lng),
                arrivalTime: s.arrivalTime || '0'
            }));

            const res = editId
                ? await busService.updateRoute(editId, {
                    name: formData.name,
                    origin: formData.origin,
                    destination: formData.destination,
                    distance: parseFloat(formData.distance),
                    duration: parseInt(formData.duration),
                    stops: formattedStops
                })
                : await busService.createRoute({
                    name: formData.name,
                    origin: formData.origin,
                    destination: formData.destination,
                    distance: parseFloat(formData.distance),
                    duration: parseInt(formData.duration),
                    stops: formattedStops
                });

            if (res && res.route) {
                setSuccessModalVisible(true);
            }
        } catch (error: any) {
            console.error('Error saving route:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to save route');
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
                <Text style={styles.headerTitle}>{editId ? 'Edit Route' : 'Create New Route'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>

                    <Text style={styles.sectionTitle}>Basic Details</Text>

                    <Text style={styles.label}>Route Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. KTM-PKR Express"
                        value={formData.name}
                        onChangeText={t => setFormData({ ...formData, name: t })}
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Origin *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Kathmandu"
                                value={formData.origin}
                                onChangeText={t => setFormData({ ...formData, origin: t })}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.label}>Destination *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Pokhara"
                                value={formData.destination}
                                onChangeText={t => setFormData({ ...formData, destination: t })}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.label}>Total Distance (km) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="200"
                                keyboardType="numeric"
                                value={formData.distance}
                                onChangeText={t => setFormData({ ...formData, distance: t })}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.label}>Est. Duration (mins) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="420"
                                keyboardType="numeric"
                                value={formData.duration}
                                onChangeText={t => setFormData({ ...formData, duration: t })}
                            />
                        </View>
                    </View>

                    <View style={styles.stopsHeader}>
                        <Text style={styles.sectionTitle}>Route Stops</Text>
                        <TouchableOpacity onPress={addStop} style={styles.addStopBtn}>
                            <Ionicons name="add-circle" size={20} color="#3B82F6" />
                            <Text style={styles.addStopText}>Add Stop</Text>
                        </TouchableOpacity>
                    </View>

                    {stops.map((stop, index) => (
                        <View key={index} style={styles.stopCard}>
                            <View style={styles.stopHeader}>
                                <Text style={styles.stopTitle}>Stop {index + 1}</Text>
                                {stops.length > 1 && (
                                    <TouchableOpacity onPress={() => removeStop(index)}>
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="Stop Location Name"
                                value={stop.name}
                                onChangeText={t => updateStop(index, 'name', t)}
                            />

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.subLabel}>Est. Arrival Offset (mins from origin)</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. 45"
                                        keyboardType="numeric"
                                        value={stop.arrivalTime}
                                        onChangeText={t => updateStop(index, 'arrivalTime', t)}
                                    />
                                </View>
                            </View>


                            {stop.lat && stop.lng ? (
                                <View style={styles.coordPreview}>
                                    <Ionicons name="location" size={16} color="#10B981" />
                                    <Text style={styles.coordText}>
                                        Location Set: {parseFloat(stop.lat).toFixed(4)}, {parseFloat(stop.lng).toFixed(4)}
                                    </Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                style={[styles.mapButton, (!stop.lat || !stop.lng) && styles.mapButtonPrimary]}
                                onPress={() => openMapForStop(index)}
                            >
                                <Ionicons name="map" size={18} color={(!stop.lat || !stop.lng) ? '#fff' : '#3B82F6'} />
                                <Text style={[styles.mapButtonText, (!stop.lat || !stop.lng) && { color: '#fff' }]}>
                                    {stop.lat && stop.lng ? 'Update Location on Map' : 'Set Location on Map'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleCreate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>{editId ? 'Update Route' : 'Save Custom Route'}</Text>
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
                        <Text style={styles.headerTitle}>Select Stop Location</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={styles.mapContainer}>
                        <LocationPickerMap
                            onSelectLocation={handleLocationSelect}
                            initialLocation={tempCoordinate}
                        />
                        {Platform.OS !== 'web' && (
                            <View style={styles.mapOverlay}>
                                <Text style={styles.mapOverlayText}>Tap anywhere on the map to place the stop marker.</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.confirmButton} onPress={confirmLocation}>
                            <Text style={styles.confirmButtonText}>Confirm Location</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            <SuccessModal
                visible={successModalVisible}
                title={editId ? "Route Updated!" : "Route Created!"}
                message={editId ? "The route has been successfully updated." : "The new route has been successfully created."}
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 8,
        marginBottom: 8,
    },
    stopsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
    },
    addStopBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    addStopText: {
        color: '#3B82F6',
        fontWeight: '600',
        marginLeft: 4,
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
    subLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        marginTop: 8,
    },
    stopCard: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    stopHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    stopTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4B5563',
    },
    submitButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
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
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EFF6FF',
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    mapButtonText: {
        color: '#3B82F6',
        fontWeight: '600',
        marginLeft: 6,
    },
    mapButtonPrimary: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    coordPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginTop: 10,
        marginBottom: 4,
    },
    coordText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '600',
        marginLeft: 6,
        fontFamily: 'monospace',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#fff',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    mapOverlay: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mapOverlayText: {
        textAlign: 'center',
        color: '#374151',
        fontWeight: '500',
        fontSize: 14,
    },
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
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
