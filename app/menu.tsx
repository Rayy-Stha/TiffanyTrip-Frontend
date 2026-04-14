import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MenuItem, restaurantService } from './services';

export default function Menu() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { restaurantId, restaurantName, tripId, stopName } = params;

    const [cart, setCart] = useState<{ [key: string]: number }>({});
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMenu();
    }, [restaurantId]);

    const loadMenu = async () => {
        if (!restaurantId) return;
        try {
            const response = await restaurantService.getMenu(restaurantId as string);
            if (response && response.menuItems) {
                setMenuItems(response.menuItems);
            }
        } catch (error) {
            console.error('Failed to load menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (id: string, action: 'add' | 'remove') => {
        setCart(prev => {
            const count = prev[id] || 0;
            if (action === 'add') return { ...prev, [id]: count + 1 };
            if (action === 'remove' && count > 0) {
                const newCart = { ...prev, [id]: count - 1 };
                if (newCart[id] === 0) delete newCart[id];
                return newCart;
            }
            return prev;
        });
    };

    const cartTotalItemCount = Object.values(cart).reduce((a, b) => a + b, 0);
    const cartTotalPrice = menuItems.reduce((total, item) => total + (item.price * (cart[item.id] || 0)), 0);

    const renderItem = ({ item }: { item: MenuItem }) => {
        const count = cart[item.id] || 0;
        return (
            <View style={styles.menuItem}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>Rs. {item.price}</Text>
                    <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                </View>
                <View style={styles.itemRight}>
                    <Image
                        source={{ uri: item.image || 'https://via.placeholder.com/100' }}
                        style={styles.itemImage}
                    />
                    <View style={styles.addButtonContainer}>
                        {count > 0 ? (
                            <View style={styles.counter}>
                                <TouchableOpacity onPress={() => toggleItem(item.id, 'remove')}><Ionicons name="remove" size={16} color="#166534" /></TouchableOpacity>
                                <Text style={styles.countText}>{count}</Text>
                                <TouchableOpacity onPress={() => toggleItem(item.id, 'add')}><Ionicons name="add" size={16} color="#166534" /></TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.addButton} onPress={() => toggleItem(item.id, 'add')}>
                                <Text style={styles.addButtonText}>ADD</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const handleViewCart = () => {
        const cartItems = Object.keys(cart).map(id => {
            const item = menuItems.find(i => i.id === id);
            return {
                id,
                name: item?.name,
                price: item?.price,
                quantity: cart[id]
            };
        });

        router.push({
            pathname: '/checkout',
            params: {
                restaurantId,
                restaurantName,
                tripId,
                stopName,
                cartItems: JSON.stringify(cartItems),
                totalAmount: cartTotalPrice,
                isFoodOrder: 'true'
            }
        } as any);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#166534" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{restaurantName || 'Menu'}</Text>
            </View>

            <FlatList
                data={menuItems}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>No menu items available.</Text>}
            />

            {cartTotalItemCount > 0 && (
                <View style={styles.cartBar}>
                    <View>
                        <Text style={styles.cartItems}>{cartTotalItemCount} items</Text>
                        <Text style={styles.cartTotal}>Rs. {cartTotalPrice}</Text>
                    </View>
                    <TouchableOpacity style={styles.viewCartButton} onPress={handleViewCart}>
                        <Text style={styles.viewCartText}>View Cart</Text>
                        <Ionicons name="cart-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
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
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    itemInfo: {
        flex: 1,
        paddingRight: 16,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginVertical: 4,
    },
    itemDesc: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    itemRight: {
        alignItems: 'center',
        position: 'relative',
    },
    itemImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    addButtonContainer: {
        position: 'absolute',
        bottom: -8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    addButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    addButtonText: {
        color: '#166534',
        fontWeight: '700',
        fontSize: 12,
    },
    counter: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    countText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#166534',
    },
    cartBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        padding: 16,
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
    },
    cartItems: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    cartTotal: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    viewCartButton: {
        backgroundColor: '#166534',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    viewCartText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: 16,
        marginTop: 20,
    }
});
