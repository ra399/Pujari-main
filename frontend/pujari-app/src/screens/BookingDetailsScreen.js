import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Image,
  Dimensions,
  Platform,
  Linking,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const BookingDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookingId } = route.params;
  const { token, currentMode } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Rating State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const isProviderMode = currentMode === 'PROVIDER';

  const fetchBookingDetails = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
        ? apiUrl.replace('localhost', '10.0.2.2')
        : apiUrl;

      const response = await fetch(`${baseUrl}/api/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setBooking(data.data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch booking details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const handleStatusUpdate = async (status) => {
    setActionLoading(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
        ? apiUrl.replace('localhost', '10.0.2.2')
        : apiUrl;

      const endpoint = status === 'APPROVED' ? 'approve' : 'reject';
      const response = await fetch(`${baseUrl}/api/providers/bookings/${bookingId}/${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', `Booking ${status.toLowerCase()} successfully`);
        fetchBookingDetails();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
       Alert.alert('Error', 'Network request failed');
    } finally {
       setActionLoading(false);
    }
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: performCancellation 
        }
      ]
    );
  };

  const performCancellation = async () => {
    setCancelling(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
        ? apiUrl.replace('localhost', '10.0.2.2')
        : apiUrl;

      const response = await fetch(`${baseUrl}/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Booking cancelled successfully');
        fetchBookingDetails(); // Refresh details
      } else {
        Alert.alert('Error', data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      Alert.alert('Error', 'Network request failed');
    } finally {
      setCancelling(false);
    }
  };

  const handleCall = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert('Info', 'Phone number not available');
    }
  };

  const handleMessage = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`sms:${phoneNumber}`);
    } else {
      Alert.alert('Info', 'Phone number not available');
    }
  };
  
  const handleSupport = () => {
      Linking.openURL('mailto:support@pujari.app');
  };

  const handleComplete = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
        ? apiUrl.replace('localhost', '10.0.2.2')
        : apiUrl;

      const response = await fetch(`${baseUrl}/api/bookings/${bookingId}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Booking marked as completed');
        fetchBookingDetails();
      } else {
        Alert.alert('Error', data.message || 'Failed to complete booking');
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      Alert.alert('Error', 'Something went wrong while completing');
    }
  };

  const openRatingModal = () => {
    setRating(0);
    setReview('');
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      setSubmittingRating(true);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
        ? apiUrl.replace('localhost', '10.0.2.2')
        : apiUrl;

      const response = await fetch(`${baseUrl}/api/ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: booking._id,
          rating,
          review
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Thank you for your rating!');
        setShowRatingModal(false);
        fetchBookingDetails(); // Refresh to update isRated status
      } else {
        Alert.alert('Error', data.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5E00" />
      </View>
    );
  }

  if (!booking) return null;

  const statusColor = 
    booking.status === 'APPROVED' ? '#10B981' :
    booking.status === 'COMPLETED' ? '#64748B' :
    booking.status === 'CANCELLED' ? '#EF4444' : '#FF5E00';

  const statusBg = 
    booking.status === 'APPROVED' ? '#ECFDF5' :
    booking.status === 'COMPLETED' ? '#F1F5F9' :
    booking.status === 'CANCELLED' ? '#FEF2F2' : '#FFF7F2';

  const serviceName = booking.serviceKey 
      ? booking.serviceKey.charAt(0).toUpperCase() + booking.serviceKey.slice(1).replace(/_/g, ' ') 
      : 'Service Details';

  const providerUser = booking.provider?.user;
  const customerUser = booking.user;
  
  const displayUser = isProviderMode ? customerUser : providerUser;
  const displayName = displayUser?.name || 'Name not available';
  const displayPhone = isProviderMode ? booking.contactNumber : displayUser?.phone;
  const location = isProviderMode 
    ? booking.serviceAddress 
    : (booking.provider?.location?.city ? `${booking.provider.location.city}, India` : 'Location TBD');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header Gradient */}
        <LinearGradient
          colors={['#FF5E00', '#FF2D00']} // Orange to Red gradient
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top', 'left', 'right']}>
            <View style={styles.headerContent}>
              <View style={styles.headerTopRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={[styles.modePill, isProviderMode ? styles.providerPill : styles.userPill]}>
                  <Text style={styles.modePillText}>{isProviderMode ? 'Provider Mode' : 'User Mode'}</Text>
                </View>
              </View>
              
              <View style={styles.headerTexts}>
                <Text style={styles.bookingId}>Booking ID: #{booking._id.slice(-4)}</Text>
                <Text style={styles.headerServiceName}>{serviceName}</Text>
                <Text style={styles.headerProviderName}>{isProviderMode ? 'Customer: ' : 'Pujari: '}{displayName}</Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.contentContainer}>
          {/* Status Card */}
          <View style={[styles.statusCard, { backgroundColor: statusBg, borderColor: statusColor + '40' }]}>
            <Ionicons 
              name={
                booking.status === 'APPROVED' ? 'checkmark-circle' : 
                booking.status === 'CANCELLED' ? 'close-circle' : 
                booking.status === 'COMPLETED' ? 'ribbon' : 'alert-circle'
              } 
              size={24} 
              color={statusColor} 
            />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusTitle, { color: statusColor }]}>
                {booking.status === 'PENDING' ? 'Pending Approval' : booking.status}
              </Text>
              <Text style={styles.statusDesc}>
                {booking.status === 'PENDING' 
                  ? (isProviderMode ? 'New booking request from customer' : 'Your booking request is being reviewed by the Pujari') 
                  : booking.status === 'APPROVED' ? 'Your booking has been confirmed.' :
                  booking.status === 'CANCELLED' ? 'This booking has been cancelled.' :
                  booking.status === 'REJECTED' ? 'This booking was rejected.' :
                  'This booking is completed.'}
              </Text>
            </View>
          </View>

          {/* Booking Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Booking Details</Text>
            
            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="calendar-outline" size={20} color="#EA580C" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(booking.date)}</Text>
              </View>
            </View>
            
            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="time-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{booking.startTime} - {booking.endTime}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="location-outline" size={20} color="#16A34A" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{location}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: '#FAF5FF' }]}>
                <FontAwesome5 name="rupee-sign" size={16} color="#9333EA" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Total Amount</Text>
                <Text style={styles.priceValue}>₹{booking.price}</Text>
              </View>
            </View>
          </View>

          {/* User Details */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{isProviderMode ? 'Customer Details' : 'Pujari Details'}</Text>
            
            <View style={styles.pujariProfile}>
              <View style={styles.avatar}>
               <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.pujariName}>{displayName}</Text>
                <Text style={styles.pujariRole}>{isProviderMode ? 'Customer' : 'Professional Pujari'}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionBtnOutline} onPress={() => handleCall(displayPhone)}>
                <Ionicons name="call-outline" size={18} color="#10B981" />
                <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionBtnOutline} onPress={() => handleMessage(displayPhone)}>
                <Ionicons name="chatbubble-outline" size={18} color="#3B82F6" />
                <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          {isProviderMode && booking.status === 'PENDING' && (
            <View style={styles.providerActionRow}>
              <TouchableOpacity 
                style={[styles.providerActionBtn, styles.rejectBtnLarge]} 
                onPress={() => handleStatusUpdate('REJECTED')}
                disabled={actionLoading}
              >
                <Text style={styles.rejectBtnTextLarge}>Reject Request</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.providerActionBtn, styles.acceptBtnLarge]} 
                onPress={() => handleStatusUpdate('APPROVED')}
                disabled={actionLoading}
              >
                <Text style={styles.acceptBtnTextLarge}>Accept Booking</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isProviderMode && ['PENDING', 'APPROVED'].includes(booking.status) && (
            <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancelBooking}
                disabled={cancelling}
            >
              {cancelling ? (
                  <ActivityIndicator color="#EF4444" />
              ) : (
                  <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              )}
            </TouchableOpacity>
          )}

          {isProviderMode && booking.status === 'APPROVED' && (
            <TouchableOpacity 
              style={styles.completeBtnLarge} 
              onPress={handleComplete}
            >
              <Ionicons name="checkbox-outline" size={20} color="white" style={{marginRight: 8}}/>
              <Text style={styles.completeBtnTextLarge}>Complete Booking</Text>
            </TouchableOpacity>
          )}

          {!isProviderMode && booking.status === 'COMPLETED' && !booking.isRated && (
             <TouchableOpacity 
                style={styles.rateBtnLarge} 
                onPress={openRatingModal}
              >
                <Ionicons name="star-outline" size={20} color="#FF5E00" style={{marginRight: 8}}/>
                <Text style={styles.rateBtnTextLarge}>Rate & Review Service</Text>
              </TouchableOpacity>
          )}

          {/* Meta Details */}
          <View style={styles.metaCard}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Booking Created</Text>
              <Text style={styles.metaValue}>{new Date(booking.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Service Type</Text>
              <Text style={styles.metaValue}>{serviceName}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Payment Status</Text>
              <Text style={[styles.metaValue, { color: '#F59E0B' }]}>Pending</Text> 
              {/* Add payment logic status if available */}
            </View>
          </View>

          {/* Support */}
          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Need Help?</Text>
            <Text style={styles.supportDesc}>Contact our support team for any queries or assistance</Text>
            <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
               <Ionicons name="mail-outline" size={18} color="#3B82F6" style={{marginRight: 8}}/>
               <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

          <View style={{height: 40}} /> 
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showRatingModal}
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModalContent}>
            <Text style={styles.ratingModalTitle}>Rate Service</Text>
            <Text style={styles.ratingModalSubtitle}>How was your experience?</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Ionicons 
                    name={star <= rating ? "star" : "star-outline"} 
                    size={40} 
                    color="#FF5E00" 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Write a review (optional)"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={review}
              onChangeText={setReview}
              textAlignVertical="top"
            />

            <View style={styles.ratingModalButtons}>
              <TouchableOpacity 
                style={styles.cancelRatingBtn} 
                onPress={() => setShowRatingModal(false)}
                disabled={submittingRating}
              >
                <Text style={styles.cancelRatingText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.submitRatingBtn} 
                onPress={submitRating}
                disabled={submittingRating}
              >
                {submittingRating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.submitRatingText}>Submit</Text>
                 )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  providerPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // Greenish
  },
  userPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // Blueish
  },
  modePillText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  headerTexts: {},
  bookingId: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerServiceName: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerProviderName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: -20, // Overlap effect
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF7F2', // Default
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 94, 0, 0.2)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9', // Subtle border
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 20,
    color: '#FF5E00',
    fontWeight: '800',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
    marginLeft: 60, // Indent to align with text
  },
  pujariProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF5E00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  pujariName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  pujariRole: {
    fontSize: 13,
    color: '#64748B',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  actionBtnText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  providerActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  providerActionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rejectBtnLarge: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  acceptBtnLarge: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  rejectBtnTextLarge: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
  acceptBtnTextLarge: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  metaCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  metaValue: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
  },
  supportCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  supportDesc: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 16,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  supportButtonText: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 13,
  },
  completeBtnLarge: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completeBtnTextLarge: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  rateBtnLarge: {
    backgroundColor: '#FFF7ED',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#FF5E00',
  },
  rateBtnTextLarge: {
    color: '#FF5E00',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingModalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  ratingModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  ratingModalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  reviewInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    height: 100,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 24,
    backgroundColor: '#F8FAFC',
  },
  ratingModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelRatingBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  cancelRatingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  submitRatingBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF5E00',
    alignItems: 'center',
  },
  submitRatingText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
});

export default BookingDetailsScreen;
