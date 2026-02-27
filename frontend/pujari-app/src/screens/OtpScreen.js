import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, PhoneAuthProvider, signInWithCredential } from '../lib/firebase';
import OtpInput from '../components/auth/OtpInput';
import PrimaryButton from '../components/auth/PrimaryButton';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const OtpScreen = ({ route, navigation }) => {
  const { phoneNumber, verificationId } = route.params || {};
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(24);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    if (!verificationId) {
      Alert.alert('Error', 'Verification session has expired. Please try again.');
      navigation.goBack();
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create the credential using the verification ID and the user's OTP
      const credential = PhoneAuthProvider.credential(verificationId, fullCode);

      // 2. Sign in with the credential
      const userCredential = await signInWithCredential(auth, credential);
      
      console.log('🔥 Firebase Auth Success. UID:', userCredential.user.uid);
      
      // The onAuthStateChanged listener in AuthContext should pick this up,
      // but if it's slow or missed, we can provide feedback.
      setIsLoading(true); // Keep loading until AuthContext redirects
      
    } catch (error) {
      console.error('Verification failed:', error);
      let message = 'Invalid code. Please check your message and try again.';
      
      if (error.code === 'auth/invalid-verification-code') {
        message = 'The OTP you entered is incorrect.';
      } else if (error.code === 'auth/code-expired') {
        message = 'This code has expired. Please resend a new one.';
      }
      
      Alert.alert('Verification Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const isComplete = code.every(digit => digit !== '');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.title}>Verify Phone Number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.bold}>{phoneNumber}</Text>
        </Text>

        <OtpInput code={code} setCode={setCode} />

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>
            Resend code in <Text style={styles.timerText}>{timer}s</Text>
          </Text>
        </View>

        <View style={styles.helpBox}>
          <View style={styles.helpHeader}>
            <Ionicons name="bulb-outline" size={18} color="#2563EB" />
            <Text style={styles.helpTitle}>Didn't receive the code?</Text>
          </View>
          <Text style={styles.helpMessage}>
            Check your messages or try resending the OTP
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton 
          title="Verify & Continue"
          onPress={handleVerify}
          disabled={!isComplete}
          loading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.sizes.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '700',
    color: colors.primary,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  resendText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  timerText: {
    color: colors.secondary,
    fontWeight: '700',
  },
  helpBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 16,
    padding: 16,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginLeft: 8,
  },
  helpMessage: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
    marginLeft: 26,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
});

export default OtpScreen;
