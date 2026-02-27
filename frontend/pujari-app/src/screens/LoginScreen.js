import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import AuthHeader from '../components/auth/AuthHeader';
import AuthInput from '../components/auth/AuthInput';
import InfoNoticeBox from '../components/auth/InfoNoticeBox';
import PrimaryButton from '../components/auth/PrimaryButton';
import AuthFooter from '../components/auth/AuthFooter';
import { colors } from '../theme/colors';

import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { auth } from '../lib/firebase';
import { PhoneAuthProvider } from 'firebase/auth';

const LoginScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaVerifier = React.useRef(null);

  const handleContinue = async () => {
    if (phoneNumber.length < 10) return;
    
    setIsLoading(true);
    try {
      const fullPhoneNumber = `+91${phoneNumber}`;
      console.log('Requesting OTP for:', fullPhoneNumber);

      // 1. Initialize the Phone Auth Provider
      const phoneProvider = new PhoneAuthProvider(auth);

      // 2. Request the verification code (OTP)
      // This will trigger the reCAPTCHA modal if necessary
      const verificationId = await phoneProvider.verifyPhoneNumber(
        fullPhoneNumber,
        recaptchaVerifier.current
      );

      setIsLoading(false);
      
      // 3. Navigate to OTP screen with the real verificationId
      navigation.navigate('OTP', { 
        phoneNumber: fullPhoneNumber,
        verificationId: verificationId 
      });

    } catch (error) {
      console.error('Error sending OTP:', error);
      setIsLoading(false);
      alert('Failed to send OTP: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
        attemptInvisibleVerification={true}
      />

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
};

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

export default LoginScreen;
