import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import AuthHeader from '../components/auth/AuthHeader';
import AuthInput from '../components/auth/AuthInput';
import InfoNoticeBox from '../components/auth/InfoNoticeBox';
import PrimaryButton from '../components/auth/PrimaryButton';
import AuthFooter from '../components/auth/AuthFooter';
import { colors } from '../theme/colors';

export default function LoginScreen() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleContinue = async () => {
        // Only continue if the phone number is valid (10 digits)
        if (phoneNumber.length < 10) return;

        setIsLoading(true);
        try {
            // Logic for Firebase Phone Auth would go here
            // For now, we simulate sending the OTP and navigating
            console.log('Requesting OTP for:', `+91${phoneNumber}`);

            // Artificial delay to mimic network request
            setTimeout(() => {
                setIsLoading(false);
                // Navigate to OTP page
                router.push({
                    pathname: '/otp',
                    params: { phoneNumber: `+91${phoneNumber}` }
                });
            }, 1000);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.content}>
                        <AuthHeader
                            title="Welcome to Pujari Seva"
                            subtitle="Enter your phone number to get started"
                        />

                        <AuthInput
                            label="Phone Number"
                            icon="smartphone"
                            isPhone
                            countryCode="+91"
                            value={phoneNumber}
                            onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                            placeholder="98765 43210"
                            keyboardType="phone-pad"
                            maxLength={10}
                        />

                        <InfoNoticeBox
                            title="Secure & Private"
                            message="We'll send you a one-time password (OTP) to verify your number."
                        />
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <PrimaryButton
                        title="Continue"
                        onPress={handleContinue}
                        disabled={phoneNumber.length < 10}
                        loading={isLoading}
                    />
                    <AuthFooter />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 0 : 40,
    },
});
