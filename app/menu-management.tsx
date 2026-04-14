import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MenuItem, restaurantService } from './services/restaurantService';

export default function MenuManagement() {
    const router = useRouter();
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [restaurantId, setRestaurantId] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState({ name: '', price: '', description: '', isAvailable: true, category: 'Main' });

    useEffect(() => {
        fetchMenu();
    }, []);

    const fetchMenu = async () => {
        try {
            setLoading(true);
            try {
                const restaurantRes = await restaurantService.getMyRestaurant();
                if (restaurantRes && restaurantRes.restaurant) {
                    setRestaurantId(restaurantRes.restaurant.id);
                    // Initial load of items from the restaurant fetch if available, or fetch separately
                    if (restaurantRes.restaurant.menuItems) {
                        setMenuItems(restaurantRes.restaurant.menuItems);
                    } else {
                        const menuRes = await restaurantService.getMenu(restaurantRes.restaurant.id);
                        if (menuRes) {
                            setMenuItems(menuRes.menuItems);
                        }
                    }
                }
            } catch (err: any) {
                if (err.message && err.message.includes('not found')) {
                    Alert.alert('Restaurant Required', 'You need to create a restaurant profile first.', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                } else {
                    console.error('Error fetching menu:', err);
                    Alert.alert('Error', 'Failed to load menu items');
                }
            }
        } catch (error) {
            console.error('General Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (item?: MenuItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                price: item.price.toString(),
                description: item.description || '',
                isAvailable: item.isAvailable,
                category: item.category || 'Main'
            });
        } else {
            setEditingItem(null);
            setFormData({ name: '', price: '', description: '', isAvailable: true, category: 'Main' });
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!restaurantId) return;

        try {
            if (editingItem) {
                // Update
                const res = await restaurantService.updateMenuItem(editingItem.id, {
                    name: formData.name,
                    price: parseFloat(formData.price),
                    description: formData.description,
                    isAvailable: formData.isAvailable,
                    category: formData.category
                });
                if (res && res.menuItem) {
                    setMenuItems(prev => prev.map(item => item.id === editingItem.id ? res.menuItem : item));
                    setModalVisible(false);
                }
            } else {
                // Create
                const res = await restaurantService.createMenuItem({
                    restaurantId,
                    name: formData.name,
                    price: parseFloat(formData.price),
                    description: formData.description,
                    isAvailable: formData.isAvailable,
                    category: formData.category
                });
                if (res && res.menuItem) {
                    setMenuItems(prev => [...prev, res.menuItem]);
                    setModalVisible(false);
                }
            }
        } catch (error) {
            console.error('Error saving item:', error);
            Alert.alert('Error', 'Failed to save menu item');
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this item?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await restaurantService.deleteMenuItem(id);
                        setMenuItems(prev => prev.filter(item => item.id !== id));
                    } catch (error) {
                        console.error('Error deleting item:', error);
                        Alert.alert('Error', 'Failed to delete item');
                    }
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: MenuItem }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} style={styles.image} />
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>Rs. {item.price}</Text>
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: item.isAvailable ? '#DEF7EC' : '#FEE2E2' }]}>
                        <Text style={[styles.statusText, { color: item.isAvailable ? '#03543F' : '#B91C1C' }]}>
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity onPress={() => openModal(item)} style={[styles.actionButton, styles.editButton]}>
                    <Ionicons name="create-outline" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionButton, styles.deleteButton]}>
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
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
                <Text style={styles.headerTitle}>Menu Management</Text>
                <TouchableOpacity onPress={() => openModal()} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={menuItems}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.emptyText}>No menu items found. Add some!</Text>}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add New Item'}</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Item Name"
                            value={formData.name}
                            onChangeText={t => setFormData({ ...formData, name: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Price"
                            keyboardType="numeric"
                            value={formData.price}
                            onChangeText={t => setFormData({ ...formData, price: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Category (e.g., Main, Starter)"
                            value={formData.category}
                            onChangeText={t => setFormData({ ...formData, category: t })}
                        />
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Description"
                            multiline
                            value={formData.description}
                            onChangeText={t => setFormData({ ...formData, description: t })}
                        />

                        <View style={styles.switchContainer}>
                            <Text>Available</Text>
                            <Switch
                                value={formData.isAvailable}
                                onValueChange={v => setFormData({ ...formData, isAvailable: v })}
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                                <Text style={styles.saveButtonText}>Save</Text>
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
        marginBottom: 16,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        overflow: 'hidden',
    },
    image: {
        width: 100,
        height: 100,
        resizeMode: 'cover',
    },
    info: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },
    price: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
    },
    description: {
        fontSize: 12,
        color: '#6B7280',
    },
    statusContainer: {
        flexDirection: 'row',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    actions: {
        justifyContent: 'space-around',
        padding: 8,
        borderLeftWidth: 1,
        borderLeftColor: '#F3F4F6',
    },
    actionButton: {
        padding: 8,
        borderRadius: 8,
    },
    editButton: {
        backgroundColor: '#F59E0B',
    },
    deleteButton: {
        backgroundColor: '#EF4444',
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
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
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
        backgroundColor: '#3B82F6',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
