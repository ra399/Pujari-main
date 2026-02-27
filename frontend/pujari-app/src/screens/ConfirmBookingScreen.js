import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const ConfirmBookingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { providerId, providerName, service, date, timeSlot } = route.params;
  const { user, token } = useAuth();

  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirmBooking = async () => {
    // Validation
    if (!address.trim()) {
      Alert.alert('Required Field', 'Please enter the service address');
      return;
    }
    
    if (!contactNumber.trim()) {
      Alert.alert('Required Field', 'Please enter your contact number');
      return;
    }

    setLoading(true);

    try {
      let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      
      if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '10.0.2.2');
      }

      const bookingData = {
        providerId,
        serviceKey: service.key,
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        serviceAddress: address,
        contactNumber,
        notes: notes.trim() || '',
      };

      console.log('Creating booking:', bookingData);

      const response = await fetch(`${apiUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (response.ok) {
        // Navigate to success screen
        navigation.reset({
          index: 0,
          routes: [
            { name: 'Main' },
            { name: 'BookingSuccess' }
          ],
        });
      } else {
        Alert.alert('Booking Failed', data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to create booking. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Confirm Booking</Text>
          <Text style={styles.headerSubtitle}>Review your details</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Booking Details Card */}
        <LinearGradient
          colors={['#FF5E00', '#FF2D00']}
          style={styles.detailsCard}
        >
          <Text style={styles.detailsTitle}>Booking Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pujari</Text>
            <Text style={styles.detailValue}>{providerName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{service.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {service.duration ? `${service.duration} mins` : 'Full day'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{date.toLocaleDateString('en-CA')}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{timeSlot.label}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{service.price}</Text>
          </View>
        </LinearGradient>

        {/* Service Address */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Ionicons name="location" size={18} color="#FF5E00" />
            <Text style={styles.inputLabel}>Service Address *</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Enter complete address where service is required"
            placeholderTextColor="#94A3B8"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Contact Number */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Ionicons name="call" size={18} color="#FF5E00" />
            <Text style={styles.inputLabel}>Contact Number *</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter your contact number"
            placeholderTextColor="#94A3B8"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
          />
        </View>

        {/* Additional Notes */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Ionicons name="document-text" size={18} color="#FF5E00" />
            <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Any special requirements or instructions..."
            placeholderTextColor="#94A3B8"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Important Notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.noticeText}>
            Your booking will be confirmed once the Pujari accepts it. You will receive a notification about the status.
          </Text>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={handleConfirmBooking}
          disabled={loading}
        >
          <LinearGradient
            colors={['#FF5E00', '#FF2D00']}
            style={styles.gradientButton}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.confirmText}>Confirm Booking</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.termsText}>
          By confirming, you agree to our terms and conditions
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 16,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  detailsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 100,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
    marginLeft: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
  }
});

export default ConfirmBookingScreen;
