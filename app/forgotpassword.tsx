import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { authService } from "./services/authService"

interface ForgotPasswordData {
    email: string
    otp: string
    newPassword: string
}

export default function ForgotPasswordScreen() {
    const router = useRouter()
    const [step, setStep] = useState<'email' | 'reset'>('email')
    const [formData, setFormData] = useState<ForgotPasswordData>({
        email: "",
        otp: "",
        newPassword: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSendForgotPassword = async () => {
        // Validation
        if (!formData.email) {
            Alert.alert("Error", "Please enter your email")
            return
        }

        setLoading(true)

        try {
            await authService.resetCode({ email: formData.email });
            Alert.alert("Success", "Password reset code sent to your email")
            setStep('reset')
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to send reset code")
            console.error("Forgot password error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async () => {
        // Validation
        if (!formData.otp || !formData.newPassword) {
            Alert.alert("Error", "Please fill in all fields")
            return
        }

        if (formData.otp.length !== 5) {
            Alert.alert("Error", "Please enter a valid 5-digit code")
            return
        }

        if (formData.newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters")
            return
        }

        setLoading(true)

        try {
            await authService.resetPassword({
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.newPassword,
            });

            Alert.alert("Success", "Password reset successfully!", [
                { text: "OK", onPress: () => router.replace('/login' as any) },
            ])
        } catch (error: any) {
            Alert.alert("Error", error.message || "Password reset failed")
            console.error("Reset password error:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
                {/* Back Button */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1b5e20" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../assets/images/forgotpass.jpg')}
                                style={styles.logo}
                            />
                        </View>

                        <Text style={styles.title}>
                            {step === 'email' ? 'Forgot Password?' : 'Reset Password'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {step === 'email'
                                ? 'Enter your email to receive reset code'
                                : 'Enter the code and your new password'
                            }
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {step === 'email' ? (
                            <>
                                {/* Email */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Email</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your email"
                                            placeholderTextColor="#999"
                                            value={formData.email}
                                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                {/* Forgot Password Button */}
                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleSendForgotPassword}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.buttonText}>
                                        {loading ? "Sending..." : "Send Reset Code"}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {/* OTP */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Reset Code</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="key-outline" size={20} color="#999" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter 5-digit code"
                                            placeholderTextColor="#999"
                                            value={formData.otp}
                                            onChangeText={(text) => setFormData({ ...formData, otp: text })}
                                            keyboardType="number-pad"
                                            maxLength={5}
                                        />
                                    </View>
                                </View>

                                {/* New Password */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>New Password</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter new password"
                                            placeholderTextColor="#999"
                                            value={formData.newPassword}
                                            onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
                                            secureTextEntry={!showPassword}
                                            autoCapitalize="none"
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                            <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#999" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Reset Password Button */}
                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.buttonText}>
                                        {loading ? "Resetting..." : "Reset Password"}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
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
    topBar: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: "center",
    },
    header: {
        marginBottom: 30,
        alignItems: "center",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#f5f5f5",
        justifyContent: "center",
        alignItems: "center",
    },
    logoContainer: {
        marginBottom: 16,
        alignItems: "center",
    },
    logo: {
        width: 300,
        height: 300,
        resizeMode: "contain",
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1b5e20",
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
        textAlign: "center",
    },
    form: {
        width: "100%",
    },
    inputContainer: {
        marginBottom: 18,
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
    eyeIcon: {
        padding: 8,
    },
    button: {
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
    buttonText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff",
    },
})