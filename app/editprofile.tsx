import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useCallback, useEffect, useState } from "react"
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { authService } from "./services"

interface EditProfileData {
    full_name: string
    phone: string
}

export default function EditProfileScreen() {
    const router = useRouter()
    const [formData, setFormData] = useState<EditProfileData>({
        full_name: "",
        phone: "",
    })
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)

    const loadUserData = useCallback(async () => {
        try {
            const response = await authService.getProfile();
            if (response && response.user) {
                setFormData({
                    full_name: response.user.full_name || "",
                    phone: response.user.phone || "",
                });
            }
        } catch (error: any) {
            console.error("Load user data error:", error);
            if (error.status === 401) {
                router.replace('/login' as any);
            }
        } finally {
            setInitialLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    const handleUpdateProfile = async () => {
        // Validation
        if (!formData.full_name.trim() && !formData.phone.trim()) {
            Alert.alert("Error", "Please provide at least one field to update");
            return;
        }

        if (formData.phone.trim() && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone.trim())) {
            Alert.alert("Error", "Please enter a valid phone number");
            return;
        }

        setLoading(true);

        try {
            const updateData: any = {};
            if (formData.full_name.trim()) updateData.full_name = formData.full_name.trim();
            if (formData.phone.trim()) updateData.phone = formData.phone.trim();

            await authService.updateProfile(updateData);

            Alert.alert("Success", "Profile updated successfully!", [
                {
                    text: "OK",
                    onPress: () => router.replace('/profile' as any)
                },
            ]);
        } catch (error: any) {
            console.error("Update profile error:", error);
            Alert.alert("Error", error.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1b5e20" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={styles.headerRight} />
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                    {/* Form */}
                    <View style={styles.form}>
                        {/* Full Name */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#999"
                                    value={formData.full_name}
                                    onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                                />
                            </View>
                        </View>

                        {/* Phone */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Phone Number</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your phone number"
                                    placeholderTextColor="#999"
                                    value={formData.phone}
                                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                    keyboardType="phone-pad"
                                />
                            </View>
                        </View>

                        {/* Update Button */}
                        <TouchableOpacity
                            style={[styles.updateButton, loading && styles.buttonDisabled]}
                            onPress={handleUpdateProfile}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.updateButtonText}>
                                {loading ? "Updating..." : "Update Profile"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    keyboardView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: 16,
        color: "#666",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e5e5",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1b5e20",
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    form: {
        width: "100%",
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f8f8",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e5e5",
        paddingHorizontal: 14,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 15,
        color: "#1a1a1a",
    },
    updateButton: {
        backgroundColor: "#1b5e20",
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        shadowColor: "#1b5e20",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        marginTop: 20,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    updateButtonText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#fff",
    },
})