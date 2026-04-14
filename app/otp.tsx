import AsyncStorage from "@react-native-async-storage/async-storage"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
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
import SuccessModal from '../components/SuccessModal'
import { authService } from "./services/authService"

export default function OTPScreen() {
    const router = useRouter()
    const { email: paramEmail } = useLocalSearchParams<{ email?: string }>()
    const [otp, setOtp] = useState(["", "", "", "", ""])
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState<string>("")
    const [successModalVisible, setSuccessModalVisible] = useState(false)
    const [successRoute, setSuccessRoute] = useState<string>("")
    const inputRefs = useRef<(TextInput | null)[]>([])

    useEffect(() => {
        if (typeof paramEmail === "string" && paramEmail.length > 0) {
            setEmail(paramEmail)
            AsyncStorage.setItem("pendingEmail", paramEmail).catch(() => { })
        } else {
            AsyncStorage.getItem("pendingEmail").then((val) => {
                if (val) setEmail(val)
            }).catch(() => { })
        }
    }, [paramEmail])

    const handleOtpChange = (text: string, index: number) => {
        // Only allow numbers
        const numericText = text.replace(/[^0-9]/g, "")

        if (numericText.length > 0) {
            const newOtp = [...otp]
            newOtp[index] = numericText[numericText.length - 1]
            setOtp(newOtp)

            // Move to next input
            if (index < 4) {
                inputRefs.current[index + 1]?.focus()
            }
        }
    }

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handleVerifyOTP = async () => {
        const otpString = otp.join("")
        if (otpString.length !== 5) {
            Alert.alert("Error", "Please enter a valid 5-digit code")
            return
        }
        if (!email) {
            Alert.alert("Error", "Missing email for verification. Please register again.")
            return
        }

        setLoading(true)

        try {
            const data = await authService.verifyOtp({ email, otp: otpString });

            // Store token and user data
            await AsyncStorage.setItem('token', data.token);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));
            await AsyncStorage.removeItem("pendingEmail");

            const role = data.user.role?.toLowerCase();
            const getDashboardRoute = () => {
                if (role === 'restaurant') return '/restaurant-dashboard';
                if (role === 'bus_operator') return '/bus-dashboard';
                return '/dashboard';
            };

            setSuccessRoute(getDashboardRoute());
            setSuccessModalVisible(true)
        } catch (error: any) {
            Alert.alert("Error", error.message || "OTP verification failed")
            console.error("OTP verification error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleResendOTP = async () => {
        setLoading(true)

        try {
            await authService.resendOtp({ email });

            Alert.alert("Success", "OTP sent to your email")
            setOtp(["", "", "", "", ""])
            inputRefs.current[0]?.focus()
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to resend OTP")
            console.error("Resend OTP error:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
                <View style={styles.content}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Image source={require("../assets/images/logo.png")} style={styles.logo} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Verify OTP</Text>
                    <Text style={styles.subtitle}>Enter the 5-digit code sent to your email</Text>

                    {/* OTP Input Circles */}
                    <View style={styles.otpInputContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { inputRefs.current[index] = ref }}
                                style={styles.otpCircle}
                                value={digit}
                                onChangeText={(text) => handleOtpChange(text, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                editable={!loading}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    {/* Verify Button */}
                    <TouchableOpacity
                        style={[styles.verifyButton, loading && styles.buttonDisabled]}
                        onPress={handleVerifyOTP}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.verifyButtonText}>{loading ? "Verifying..." : "Verify OTP"}</Text>
                    </TouchableOpacity>

                    {/* Resend OTP */}
                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>Didn&apos;t receive the code? </Text>
                        <TouchableOpacity onPress={handleResendOTP} disabled={loading}>
                            <Text style={styles.resendLink}>Resend OTP</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <SuccessModal
                visible={successModalVisible}
                title="Registration Successful!"
                message="Welcome to Triffny Trip! You have been successfully verified and logged in."
                buttonText="Continue to Dashboard"
                onButtonPress={() => {
                    setSuccessModalVisible(false)
                    if (successRoute) {
                        router.replace(successRoute as any)
                    }
                }}
            />
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
    content: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    logoContainer: {
        marginBottom: 32,
        alignItems: "center",
    },
    logo: {
        width: 350,
        height: 350,
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
        marginBottom: 40,
    },
    otpInputContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        marginBottom: 32,
        width: "100%",
    },
    otpCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: "#1b5e20",
        backgroundColor: "#fff",
        fontSize: 24,
        fontWeight: "700",
        color: "#1b5e20",
        textAlign: "center",
        shadowColor: "#1b5e20",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    verifyButton: {
        backgroundColor: "#1b5e20",
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 48,
        alignItems: "center",
        shadowColor: "#1b5e20",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        width: "100%",
        marginBottom: 24,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    verifyButtonText: {
        fontSize: 15,
        fontWeight: "700",
        color: "#fff",
    },
    resendContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    resendText: {
        fontSize: 13,
        color: "#666",
    },
    resendLink: {
        fontSize: 13,
        color: "#1b5e20",
        fontWeight: "700",
    },
})