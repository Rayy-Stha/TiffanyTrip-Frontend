import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SuccessModal from '../components/SuccessModal';
import { busService } from './services/busService';

const BUS_TYPES = ['AC', 'NON_AC', 'SLEEPER', 'SEMI_SLEEPER'];
const AMENITIES_LIST = ['WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Reading Light', 'Snacks'];

export default function CreateBus() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        number: '',
        type: 'AC',
        capacity: '',
        amenities: [] as string[]
    });

    const toggleAmenity = (amenity: string) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleCreate = async () => {
        console.log('🚌 Creating Bus with data:', formData); // Added Debug Log

        if (!formData.name || !formData.number || !formData.capacity) {
            Alert.alert('Missing Fields', 'Please fill in Name, Number, and Capacity.');
            return;
        }

        try {
            setLoading(true);
            const res = await busService.createBus({
                name: formData.name,
                number: formData.number, // Changed from busNumber to number
                type: formData.type,
                capacity: parseInt(formData.capacity),
                amenities: formData.amenities
            });

            if (res && res.bus) {
                setSuccessModalVisible(true);
            }
        } catch (error: any) {
            console.error('Error creating bus:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to create bus');
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
                <Text style={styles.headerTitle}>Add New Bus</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.label}>Bus Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Deluxe Express"
                        value={formData.name}
                        onChangeText={t => setFormData({ ...formData, name: t })}
                    />

                    <Text style={styles.label}>Bus Number (Plate) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. BA 1 KHA 1234"
                        value={formData.number}
                        onChangeText={t => setFormData({ ...formData, number: t })}
                    />

                    <Text style={styles.label}>Capacity (Seats) *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 35"
                        keyboardType="numeric"
                        value={formData.capacity}
                        onChangeText={t => setFormData({ ...formData, capacity: t })}
                    />

                    <Text style={styles.label}>Bus Type *</Text>
                    <View style={styles.typeContainer}>
                        {BUS_TYPES.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.typeOption, formData.type === type && styles.selectedType]}
                                onPress={() => setFormData({ ...formData, type })}
                            >
                                <Text style={[styles.typeText, formData.type === type && styles.selectedTypeText]}>
                                    {type.replace('_', ' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Amenities</Text>
                    <View style={styles.amenitiesContainer}>
                        {AMENITIES_LIST.map(amenity => (
                            <TouchableOpacity
                                key={amenity}
                                style={[styles.amenityOption, formData.amenities.includes(amenity) && styles.selectedAmenity]}
                                onPress={() => toggleAmenity(amenity)}
                            >
                                <Ionicons
                                    name={formData.amenities.includes(amenity) ? "checkbox" : "square-outline"}
                                    size={20}
                                    color={formData.amenities.includes(amenity) ? "#3B82F6" : "#6B7280"}
                                />
                                <Text style={[styles.amenityText, formData.amenities.includes(amenity) && styles.selectedAmenityText]}>
                                    {amenity}
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
                            <Text style={styles.submitButtonText}>Create Bus</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            <SuccessModal
                visible={successModalVisible}
                title="Bus Added!"
                message="The new bus has been successfully added to your fleet."
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
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeOption: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    selectedType: {
        backgroundColor: '#EFF6FF',
        borderColor: '#3B82F6',
    },
    typeText: {
        fontSize: 14,
        color: '#111827', // Changed from #4B5563 to darker black for better contrast
        fontWeight: '500',
    },
    selectedTypeText: {
        color: '#3B82F6',
        fontWeight: '600',
    },
    amenitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    amenityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '45%',
        paddingVertical: 4,
    },
    selectedAmenity: {
        // opacity: 1
    },
    amenityText: {
        fontSize: 14,
        color: '#4B5563',
        marginLeft: 8,
    },
    selectedAmenityText: {
        color: '#111827',
        fontWeight: '500',
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
