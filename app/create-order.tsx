import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { orderService } from './services/orderService';
import { MenuItem, restaurantService } from './services/restaurantService';

interface CartItem {
    menuItem: MenuItem;
    quantity: number;
}

export default function CreateOrder() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const restaurantId = parseInt(params.restaurantId as string);
    const bookingId = params.bookingId ? parseInt(params.bookingId as string) : undefined;

    const [loading, setLoading] = useState(true);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [deliveryLocation, setDeliveryLocation] = useState('');
    const [cartModalVisible, setCartModalVisible] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMenu();
    }, [restaurantId]);

    const fetchMenu = async () => {
        try {
            setLoading(true);
            const res = await restaurantService.getMenu(restaurantId.toString());
            if (res && res.menuItems) {
                setMenuItems(res.menuItems.filter(item => item.isAvailable));
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
            Alert.alert('Error', 'Failed to load menu');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (menuItem: MenuItem) => {
        const existingItem = cart.find(item => item.menuItem.id === menuItem.id);
        if (existingItem) {
            setCart(cart.map(item =>
                item.menuItem.id === menuItem.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { menuItem, quantity: 1 }]);
        }
        Alert.alert('Added', `${menuItem.name} added to cart`);
    };

    const updateQuantity = (menuItemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(cart.filter(item => item.menuItem.id !== menuItemId));
        } else {
            setCart(cart.map(item =>
                item.menuItem.id === menuItemId
                    ? { ...item, quantity: newQuantity }
                    : item
            ));
        }
    };

    const getTotalAmount = () => {
        return cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    };

    const handleSubmitOrder = async () => {
        if (cart.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your cart');
            return;
        }

        try {
            setSubmitting(true);
            const orderData = {
                restaurantId: typeof restaurantId === 'string' ? parseInt(restaurantId) : restaurantId,
                items: cart.map(item => ({
                    menuItemId: parseInt(item.menuItem.id),
                    quantity: item.quantity
                })),
                deliveryLocation: deliveryLocation || 'Seat delivery',
                ...(bookingId && { bookingId: typeof bookingId === 'string' ? parseInt(bookingId) : bookingId })
            };

            console.log('📦 Submitting order:', JSON.stringify(orderData, null, 2));

            const response = await orderService.createOrder(orderData);
            console.log('✅ Order response:', response);

            setSuccessModalVisible(true);
            setCart([]);
            setCartModalVisible(false);
        } catch (error: any) {
            console.error('❌ Error creating order:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
        } finally {
            setSubmitting(false);
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

    const renderMenuItem = ({ item }: { item: MenuItem }) => (
        <View style={styles.menuCard}>
            <View style={styles.menuInfo}>
                <Text style={styles.menuName}>{item.name}</Text>
                {item.description && (
                    <Text style={styles.menuDescription}>{item.description}</Text>
                )}
                <View style={styles.menuFooter}>
                    <Text style={styles.menuPrice}>Rs. {item.price.toFixed(2)}</Text>
                    {item.category && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{item.category}</Text>
                        </View>
                    )}
                </View>
            </View>
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => addToCart(item)}
            >
                <Ionicons name="add-circle" size={32} color="#10B981" />
            </TouchableOpacity>
        </View>
    );

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View style={styles.cartItem}>
            <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.menuItem.name}</Text>
                <Text style={styles.cartItemPrice}>Rs. {item.menuItem.price.toFixed(2)} each</Text>
            </View>
            <View style={styles.quantityControls}>
                <TouchableOpacity
                    onPress={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                    style={styles.quantityButton}
                >
                    <Ionicons name="remove-circle-outline" size={24} color="#EF4444" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                    onPress={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                    style={styles.quantityButton}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#10B981" />
                </TouchableOpacity>
            </View>
            <Text style={styles.cartItemTotal}>Rs. {(item.menuItem.price * item.quantity).toFixed(2)}</Text>
        </View>
    );

    if (loading) {
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
                <Text style={styles.headerTitle}>Order Food</Text>
                <TouchableOpacity
                    onPress={() => setCartModalVisible(true)}
                    style={styles.cartButton}
                >
                    <Ionicons name="cart" size={24} color="#3B82F6" />
                    {cart.length > 0 && (
                        <View style={styles.cartBadge}>
                            <Text style={styles.cartBadgeText}>{cart.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <FlatList
                data={menuItems}
                renderItem={renderMenuItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No menu items available</Text>
                    </View>
                }
            />

            {/* Cart Modal */}
            <Modal visible={cartModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Your Cart</Text>
                            <TouchableOpacity onPress={() => setCartModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        {cart.length > 0 ? (
                            <>
                                <FlatList
                                    data={cart}
                                    renderItem={renderCartItem}
                                    keyExtractor={item => item.menuItem.id.toString()}
                                    style={styles.cartList}
                                />

                                <View style={styles.deliverySection}>
                                    <Text style={styles.deliveryLabel}>Delivery Location (Optional)</Text>
                                    <TextInput
                                        style={styles.deliveryInput}
                                        placeholder="e.g., Seat 12A or Bus Stop"
                                        value={deliveryLocation}
                                        onChangeText={setDeliveryLocation}
                                    />
                                </View>

                                <View style={styles.totalSection}>
                                    <Text style={styles.totalLabel}>Total Amount</Text>
                                    <Text style={styles.totalAmount}>Rs. {getTotalAmount().toFixed(2)}</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.submitButton}
                                    onPress={handleSubmitOrder}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.submitButtonText}>Place Order</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.emptyCart}>
                                <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
                                <Text style={styles.emptyCartText}>Your cart is empty</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Order Success Modal */}
            <Modal visible={successModalVisible} transparent animationType="fade">
                <View style={styles.successOverlay}>
                    <View style={styles.successContent}>
                        <View style={styles.successIconCircle}>
                            <Ionicons name="checkmark-circle" size={80} color="#fff" />
                        </View>
                        <Text style={styles.successTitle}>Order Successful!</Text>
                        <Text style={styles.successMessage}>
                            Your order has been placed successfully.
                        </Text>
                        <TouchableOpacity style={styles.successButton} onPress={goToDashboard}>
                            <Text style={styles.successButtonText}>OK</Text>
                        </TouchableOpacity>
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
    center: {
        justifyContent: 'center',
        alignItems: 'center',
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
    cartButton: {
        padding: 4,
        position: 'relative',
    },
    cartBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
    },
    menuCard: {
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
    menuInfo: {
        flex: 1,
    },
    menuName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    menuDescription: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 8,
    },
    menuFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#10B981',
    },
    categoryBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 11,
        color: '#3B82F6',
        fontWeight: '600',
    },
    addButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    cartList: {
        maxHeight: 300,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    cartItemInfo: {
        flex: 1,
    },
    cartItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    cartItemPrice: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginRight: 12,
    },
    quantityButton: {
        padding: 4,
    },
    quantityText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        minWidth: 24,
        textAlign: 'center',
    },
    cartItemTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
        minWidth: 70,
        textAlign: 'right',
    },
    deliverySection: {
        marginTop: 20,
    },
    deliveryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    deliveryInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 2,
        borderTopColor: '#E5E7EB',
        marginTop: 16,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    submitButton: {
        backgroundColor: '#10B981',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyCart: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyCartText: {
        fontSize: 16,
        color: '#9CA3AF',
        marginTop: 16,
    },
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
});
