import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function OrderMap({
    initialRegion,
    restCoord,
    destCoord,
    restaurant,
    deliveryLocation,
    hasDestination
}: any) {
    return (
        <MapView
            style={styles.map}
            initialRegion={initialRegion}
            showsUserLocation={true}
        >
            <Marker coordinate={restCoord} title={restaurant?.name} description="Restaurant Location">
                <View style={styles.markerContainer}>
                    <Ionicons name="restaurant" size={24} color="#EF4444" />
                </View>
            </Marker>

            {hasDestination && (
                <Marker coordinate={destCoord} title={deliveryLocation || 'Delivery Stop'} description="Your Meeting Point">
                    <View style={[styles.markerContainer, { backgroundColor: '#10B981' }]}>
                        <Ionicons name="flag" size={24} color="#fff" />
                    </View>
                </Marker>
            )}

            {hasDestination && (
                <Polyline
                    coordinates={[restCoord, destCoord]}
                    strokeColor="#3B82F6"
                    strokeWidth={4}
                    lineDashPattern={[10, 10]}
                />
            )}
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    markerContainer: {
        backgroundColor: '#fff',
        padding: 6,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    }
});
