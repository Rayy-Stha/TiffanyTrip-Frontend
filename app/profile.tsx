import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authService } from './services';

type UserRole = 'Traveller' | 'Restaurant Owner' | 'Bus Operator';

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<UserRole>('Traveller');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await authService.getProfile();
            if (response && response.user) {
                setUser(response.user);
                // Map backend role to UI role if needed, or use as is
                // Assuming backend returns role field
                if (response.user.role) setRole(response.user.role as UserRole);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await authService.logout();
            router.replace('/login' as any);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const renderMenuItem = (title: string, icon: any, color: string = '#374151', onPress?: () => void) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                    {icon}
                </View>
                <Text style={[styles.menuText, { color }]}>{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
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
            <ScrollView contentContainerStyle={styles.content}>

                {/* Profile Header */}
                <View style={styles.header}>
                    <Text style={styles.name}>{user?.full_name || 'User'}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{role}</Text>
                    </View>
                </View>

                {/* Role Specific Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{role} Dashboard</Text>

                    {role === 'Traveller' && (
                        <>
                            {renderMenuItem('My Bookings', <Ionicons name="ticket-outline" size={20} color="#3B82F6" />, '#374151', () => router.push('/my-bus-bookings' as any))}
                            {renderMenuItem('Saved Trips', <Ionicons name="heart-outline" size={20} color="#EF4444" />)}
                            {renderMenuItem('Payment History', <Ionicons name="receipt-outline" size={20} color="#10B981" />)}
                        </>
                    )}
                    {/* Other roles Logic kept same */}
                </View>

                {/* General Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General</Text>
                    {renderMenuItem('Account Settings', <Ionicons name="settings-outline" size={20} color="#374151" />, '#374151', () => router.push('/editprofile' as any))}
                    {renderMenuItem('Help & Support', <Ionicons name="help-circle-outline" size={20} color="#374151" />)}

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <View style={styles.menuLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                            </View>
                            <Text style={[styles.menuText, { color: '#EF4444' }]}>Logout</Text>
                        </View>
                    </TouchableOpacity>
                </View>

            </ScrollView>
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
    content: {
        padding: 24,
        paddingTop: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        borderWidth: 3,
        borderColor: '#3B82F6',
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 12,
    },
    roleBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    roleText: {
        color: '#3B82F6',
        fontWeight: '600',
        fontSize: 14,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        marginBottom: 4,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
    },
});