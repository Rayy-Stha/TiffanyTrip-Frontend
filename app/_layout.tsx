import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="create-trip" options={{ presentation: 'modal', headerShown: true, title: 'Plan a Trip' }} />
            <Stack.Screen name="trip-details" />
            <Stack.Screen name="bus-search" options={{ headerShown: true, title: 'Find Bus' }} />
            <Stack.Screen name="seat-selection" options={{ headerShown: true, title: 'Select Seats' }} />
            <Stack.Screen name="restaurant-listing" options={{ headerShown: true, title: 'Restaurants' }} />
            <Stack.Screen name="menu" options={{ headerShown: true, title: 'Menu' }} />
            <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Checkout' }} />
            <Stack.Screen name="my-trips" options={{ headerShown: false }} />
            <Stack.Screen name="restaurant-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="bus-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="menu-management" options={{ headerShown: false }} />
            <Stack.Screen name="restaurant-orders" options={{ headerShown: false }} />
            <Stack.Screen name="bus-fleet" options={{ headerShown: false }} />
            <Stack.Screen name="manage-schedules" options={{ headerShown: false }} />
            <Stack.Screen name="booking-list" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: true, title: 'My Profile' }} />
        </Stack>
    );
}
