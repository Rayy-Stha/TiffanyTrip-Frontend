import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bus, busService } from './services/busService';

export default function BusFleet() {
    const router = useRouter();
    const [buses, setBuses] = useState<Bus[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [formData, setFormData] = useState({ name: '', number: '', type: '', capacity: '', operator: 'My Operator' }); // Operator name might be fetched from user profile ideally

    useEffect(() => {
        fetchBuses();
    }, []);

    const fetchBuses = async () => {
        try {
            setLoading(true);
            const res = await busService.getAllBuses();
            if (res && res.buses) {
                setBuses(res.buses);
            }
        } catch (error) {
            console.error('Error fetching buses:', error);
            Alert.alert('Error', 'Failed to load buses');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.number || !formData.type || !formData.capacity) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        try {
            const res = await busService.createBus({
                name: formData.name,
                number: formData.number,
                type: formData.type,
                capacity: parseInt(formData.capacity),
                operator: formData.operator,
                amenities: ['Wifi', 'Charging Point'] // Default for now, could be added to form
            });

            if (res && res.bus) {
                setModalVisible(false);
                setFormData({ name: '', number: '', type: '', capacity: '', operator: 'My Operator' });
                Alert.alert('Success', 'Bus created successfully!');
                // Refresh the list to show the new bus
                fetchBuses();
            }
        } catch (error) {
            console.error('Error creating bus:', error);
            Alert.alert('Error', 'Failed to create bus');
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this bus?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await busService.deleteBus(id);
                        Alert.alert('Success', 'Bus deleted successfully');
                        // Refresh the list to reflect the deletion
                        fetchBuses();
                    } catch (error) {
                        console.error('Error deleting bus:', error);
                        Alert.alert('Error', 'Failed to delete bus');
                    }
                }
            }
        ]);
    };

    const renderBus = ({ item }: { item: Bus }) => (
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <Ionicons name="bus" size={32} color="#3B82F6" />
            </View>
            <View style={styles.info}>
                <Text style={styles.busNumber}>{item.name}</Text>
                <Text style={styles.details}>{item.number} • {item.type} • {item.capacity} Seats</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
        </View>
    );

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
                <Text style={styles.headerTitle}>My Fleet</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={buses}
                renderItem={renderBus}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.emptyText}>No buses found.</Text>}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add New Bus</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Bus Name (e.g. Deluxe Express)"
                            value={formData.name}
                            onChangeText={t => setFormData({ ...formData, name: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Bus Number (e.g. BA 1 KHA 1234)"
                            value={formData.number}
                            onChangeText={t => setFormData({ ...formData, number: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Type (AC, NON_AC, SLEEPER)"
                            value={formData.type}
                            onChangeText={t => setFormData({ ...formData, type: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Capacity (e.g. 35)"
                            keyboardType="numeric"
                            value={formData.capacity}
                            onChangeText={t => setFormData({ ...formData, capacity: t })}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                                <Text style={styles.saveButtonText}>Add Bus</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        backgroundColor: '#10B981',
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
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    busNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    details: {
        fontSize: 14,
        color: '#6B7280',
    },
    deleteButton: {
        padding: 8,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#9CA3AF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#374151',
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        padding: 14,
        borderRadius: 8,
        backgroundColor: '#10B981',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
