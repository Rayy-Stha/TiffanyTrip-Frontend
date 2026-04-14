import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import SuccessModal from '../components/SuccessModal';
import { tripService } from './services';

export default function CreateTrip() {
    const router = useRouter();
    const [tripName, setTripName] = useState('');
    const [destination, setDestination] = useState('');
    const [budget, setBudget] = useState('');
    const [loading, setLoading] = useState(false);
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    // Date Picker State
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const onStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const onEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const handleCreateTrip = async () => {
        if (!tripName || !destination || !budget) {
            Alert.alert('Missing Information', 'Please fill in all details to create your trip.');
            return;
        }

        setLoading(true);
        try {
            await tripService.createTrip({
                name: tripName,
                destination,
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
                budget: parseFloat(budget)
            });

            setSuccessModalVisible(true);
        } catch (error: any) {
            console.error('Failed to create trip:', error);
            Alert.alert('Error', error.message || 'Could not create trip. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Plan a New Trip</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Trip Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Summer Vacation 2024"
                        value={tripName}
                        onChangeText={setTripName}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Destination</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="search" size={20} color="#6B7280" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, styles.inputWithIcon]}
                            placeholder="Where are you going?"
                            value={destination}
                            onChangeText={setDestination}
                        />
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={[styles.formGroup, styles.halfWidth]}>
                        <Text style={styles.label}>Start Date</Text>
                        {Platform.OS === 'web' ? (
                            // @ts-ignore
                            <input
                                type="date"
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                    borderRadius: 12,
                                    padding: '14px 16px',
                                    fontSize: 16,
                                    color: '#111827',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    border: '1px solid #E5E7EB',
                                }}
                                value={startDate.toISOString().split('T')[0]}
                                onChange={(e: any) => {
                                    const date = new Date(e.target.value);
                                    if (!isNaN(date.getTime())) {
                                        setStartDate(date);
                                    }
                                }}
                            />
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowStartPicker(true)}
                                >
                                    <Text style={styles.dateText}>{startDate instanceof Date && !isNaN(startDate.getTime()) ? formatDate(startDate) : 'Select Date'}</Text>
                                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                </TouchableOpacity>
                                {showStartPicker && (
                                    <DateTimePicker
                                        testID="dateTimePicker"
                                        value={startDate || new Date()}
                                        mode="date"
                                        is24Hour={true}
                                        display="default"
                                        onChange={onStartDateChange}
                                    />
                                )}
                            </>
                        )}
                    </View>

                    <View style={[styles.formGroup, styles.halfWidth]}>
                        <Text style={styles.label}>End Date</Text>
                        {Platform.OS === 'web' ? (
                            // @ts-ignore
                            <input
                                type="date"
                                style={{
                                    backgroundColor: '#F9FAFB',
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                    borderRadius: 12,
                                    padding: '14px 16px',
                                    fontSize: 16,
                                    color: '#111827',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    border: '1px solid #E5E7EB',
                                }}
                                value={endDate.toISOString().split('T')[0]}
                                onChange={(e: any) => {
                                    const date = new Date(e.target.value);
                                    if (!isNaN(date.getTime())) {
                                        setEndDate(date);
                                    }
                                }}
                            />
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.dateButton}
                                    onPress={() => setShowEndPicker(true)}
                                >
                                    <Text style={styles.dateText}>{endDate instanceof Date && !isNaN(endDate.getTime()) ? formatDate(endDate) : 'Select Date'}</Text>
                                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                                </TouchableOpacity>
                                {showEndPicker && (
                                    <DateTimePicker
                                        testID="dateTimePicker"
                                        value={endDate || new Date()}
                                        mode="date"
                                        is24Hour={true}
                                        display="default"
                                        onChange={onEndDateChange}
                                        minimumDate={startDate}
                                    />
                                )}
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Estimated Budget (NPR)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., 25000"
                        keyboardType="numeric"
                        value={budget}
                        onChangeText={setBudget}
                    />
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.createButton, loading && styles.disabledButton]}
                    onPress={handleCreateTrip}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.createButtonText}>Create Trip</Text>
                    )}
                </TouchableOpacity>
            </View>

            <SuccessModal
                visible={successModalVisible}
                title="Trip Planned!"
                message={`Your trip to ${destination} has been successfully created. Get ready for an adventure!`}
                buttonText="Go to Dashboard"
                onButtonPress={() => {
                    setSuccessModalVisible(false);
                    router.push('/dashboard' as any);
                }}
            />
        </View>
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
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    content: {
        padding: 24,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
    },
    inputContainer: {
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        top: 16,
        zIndex: 1,
    },
    inputWithIcon: {
        paddingLeft: 48,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfWidth: {
        width: '48%',
    },
    dateButton: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 16,
        color: '#111827',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    createButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        opacity: 0.7,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
