import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"


const { width, height } = Dimensions.get("window")

const slides = [
  require('../assets/images/slide1.jpeg'),
  require('../assets/images/slide2.jpeg'),
  require('../assets/images/slide3.jpeg'),
]

export default function WelcomeScreen() {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)

  const handleGetStarted = () => {
    router.push('/register' as any)
  }

  const handleSignIn = () => {
    router.push('/login' as any)
  }

  const handleSlideScroll = (event: any) => {
    const slideSize = Math.round(event.nativeEvent.contentOffset.x / (width - 32))
    setCurrentSlide(slideSize)
  }

  // Auto-slide logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextSlide = (prev + 1) % slides.length
        scrollViewRef.current?.scrollTo({
          x: nextSlide * (width - 32),
          animated: true,
        })
        return nextSlide
      })
    }, 4000) // Auto-slide every 4 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
          />
        </View>

        {/* App Name */}
        <Text style={styles.appName}>Triffny Trip</Text>

        {/* Spacer to center content */}
        <View style={styles.centerSpacer} />

        {/* Image Slider */}
        <View style={styles.sliderContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            scrollEventThrottle={16}
            onScroll={handleSlideScroll}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={true}
            style={styles.slider}
            contentContainerStyle={styles.sliderContent}
          >
            {slides.map((slide, index) => (
              <View key={index} style={styles.slideWrapper}>
                <Image
                  source={slide}
                  style={styles.sliderImage}
                />
              </View>
            ))}
          </ScrollView>
          {/* Slider Indicators */}
          <View style={styles.indicatorContainer}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentSlide && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Spacer to center content */}
        <View style={styles.centerSpacer} />

        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSignIn}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 32,
    fontWeight: "900",
    color: "#1b5e20",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  centerSpacer: {
    flex: 0.5,
  },
  sliderContainer: {
    height: 480,
    marginVertical: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  slider: {
    height: "100%",
  },
  sliderContent: {
    height: 450,
  },
  slideWrapper: {
    width: width - 32,
    height: 450,
    justifyContent: "center",
    alignItems: "center",
  },
  sliderImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e0e0e0",
  },
  activeIndicator: {
    backgroundColor: "#1b5e20",
    width: 24,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#1b5e20",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#1b5e20",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 2.5,
    borderColor: "#1b5e20",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1b5e20",
    textAlign: "center",
  },
})
