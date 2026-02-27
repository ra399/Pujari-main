import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../theme/colors';

const TABS = ['Pending', 'Approved', 'Completed', 'Cancelled'];

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const BookingsScreen = () => {
  const { user, token, currentMode } = useAuth();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Pending');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const isProviderMode = currentMode === 'PROVIDER';
  
  // Filter State
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStatus, setTempStatus] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: null,
    endDate: null,
    status: []
  });

  // Rating State
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchBookings = async () => {
    try {
      if (!token) return;

      console.log('📡 Fetching bookings. Mode:', currentMode);
      setLoading(true);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
        ? apiUrl.replace('localhost', '10.0.2.2')
        : apiUrl;

      let queryParams = new URLSearchParams();
      
      if (appliedFilters.startDate) queryParams.append('startDate', appliedFilters.startDate.toISOString());
      if (appliedFilters.endDate) queryParams.append('endDate', appliedFilters.endDate.toISOString());
      
      // If in provider mode, use the provider bookings endpoint
      const endpoint = isProviderMode ? '/api/providers/bookings' : '/api/bookings';
      const fullUrl = `${baseUrl}${endpoint}?${queryParams.toString()}`;
      console.log('🔗 URL:', fullUrl);

      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        }
      });
      const data = await response.json();
      console.log('📥 Bookings data count:', data.data?.length);
      
      if (data.success && Array.isArray(data.data)) {
        data.data.forEach(b => {
            if(b.status === 'COMPLETED') {
                console.log(`🔍 Booking ${b._id} - Status: ${b.status} - isRated: ${b.isRated}`);
            }
        });
        setBookings(data.data);
      } else {
        console.warn('⚠️ Bookings fetch returned no array:', data.message);
        setBookings([]);
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [token, appliedFilters, currentMode])
  );

  const getFilteredBookings = () => {
    let filtered = bookings;
    const tabStatus = activeTab.toUpperCase();
    
    if (tabStatus === 'CANCELLED') {
      filtered = filtered.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED');
    } else {
      filtered = filtered.filter(b => b.status === tabStatus);
    }
    
    return filtered;
  };

  const applyFilters = () => {
    setAppliedFilters({
      startDate: startDate,
      endDate: endDate,
      status: tempStatus
    });
    setShowFilter(false);
    if (tempStatus.length > 0) {
      const statusMap = { 'PENDING': 'Pending', 'APPROVED': 'Approved', 'COMPLETED': 'Completed', 'CANCELLED': 'Cancelled' };
      const newTab = statusMap[tempStatus[0]]; 
      if (newTab) setActiveTab(newTab);
    }
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setTempStatus([]);
    setAppliedFilters({
      startDate: null,
      endDate: null,
      status: []
    });
    setShowFilter(false);
  };

  const onStartDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (selectedDate) setStartDate(selectedDate);
  };

  const onEndDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (selectedDate) setEndDate(selectedDate);
  };

  const getCount = (tabName) => {
    const status = tabName.toUpperCase();
    if (status === 'CANCELLED') {
      return bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED').length;
    }
    return bookings.filter(b => b.status === status).length;
  };

  const handleApprove = async (id) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
        ? apiUrl.replace('localhost', '10.0.2.2')
        : apiUrl;

      const response = await fetch(`${baseUrl}/api/providers/bookings/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Booking approved successfully');
        fetchBookings();
      } else {
        Alert.alert('Error', data.message || 'Failed to approve booking');
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      Alert.alert('Error', 'Something went wrong while approving');
    }
  };

  const handleReject = async (id) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
        ? apiUrl.replace('localhost', '10.0.2.2')
        : apiUrl;

      const response = await fetch(`${baseUrl}/api/providers/bookings/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Booking rejected successfully');
        fetchBookings();
      } else {
        Alert.alert('Error', data.message || 'Failed to reject booking');
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      Alert.alert('Error', 'Something went wrong while rejecting');
    }
  };

  const handleComplete = async (id) => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
        ? apiUrl.replace('localhost', '10.0.2.2')
        : apiUrl;

      const response = await fetch(`${baseUrl}/api/bookings/${id}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', 'Booking marked as completed');
        fetchBookings();
      } else {
        Alert.alert('Error', data.message || 'Failed to complete booking');
      }
    } catch (error) {
      console.error('Error completing booking:', error);
      Alert.alert('Error', 'Something went wrong while completing');
    }
  };

  const openRatingModal = (bookingId) => {
    setSelectedBookingId(bookingId);
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
          bookingId: selectedBookingId,
          rating,
          review
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Thank you for your rating!');
        setShowRatingModal(false);
        fetchBookings(); // Refresh to update isRated status
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

  const renderBookingCard = ({ item }) => {
    let statusColor = '#FF5E00';
    let statusBg = '#FFF5EB';
    
    if (item.status === 'APPROVED') {
      statusColor = '#10B981';
      statusBg = '#ECFDF5';
    } else if (item.status === 'COMPLETED') {
      statusColor = '#64748B';
      statusBg = '#F1F5F9';
    } else if (item.status === 'CANCELLED' || item.status === 'REJECTED') {
      statusColor = '#EF4444';
      statusBg = '#FEF2F2';
    }

    const displayUser = isProviderMode ? item.user : item.provider?.user;
    const name = displayUser?.name || 'Unknown';
    const phone = isProviderMode ? item.contactNumber : (displayUser?.phone || 'N/A');

    const serviceName = item.serviceKey 
      ? item.serviceKey.charAt(0).toUpperCase() + item.serviceKey.slice(1).replace(/_/g, ' ') 
      : 'Service';
    
    const location = isProviderMode
      ? (item.serviceAddress || 'Address not provided')
      : (item.provider?.location?.city ? `${item.provider.location.city}, India` : 'Location TBD');

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('BookingDetails', { bookingId: item._id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
          <Text style={styles.bookingId}>ID: #{item._id.slice(-4)}</Text>
        </View>

        {/* User Info Row */}
        <View style={styles.userInfoRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userInfoText}>
            <Text style={styles.userNameInCard}>{name}</Text>
            {phone && (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={12} color="#64748B" />
                <Text style={styles.phoneText}>{phone}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardDivider} />

        <Text style={styles.serviceName}>{serviceName}</Text>

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
          <Text style={styles.detailText}>
            {formatDate(item.date)} • {item.startTime}-{item.endTime}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#94A3B8" />
          <Text style={styles.detailText} numberOfLines={1}>{location}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.price}>₹{item.price}</Text>
          
          {isProviderMode && item.status === 'PENDING' && (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={styles.rejectBtn} 
                onPress={() => handleReject(item._id)}
              >
                <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.acceptBtn} 
                onPress={() => handleApprove(item._id)}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                <Text style={styles.acceptBtnText}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}

          {isProviderMode && item.status === 'APPROVED' && (
            <TouchableOpacity 
              style={styles.completeBtn} 
              onPress={() => handleComplete(item._id)}
            >
              <Ionicons name="checkbox-outline" size={18} color="white" />
              <Text style={styles.completeBtnText}>Complete Booking</Text>
            </TouchableOpacity>
          )}

          {!isProviderMode && item.status === 'COMPLETED' && !item.isRated && (
             <TouchableOpacity 
                style={styles.rateBtn} 
                onPress={() => openRatingModal(item._id)}
              >
                <Ionicons name="star-outline" size={16} color="#FF5E00" />
                <Text style={styles.rateBtnText}>Rate & Review</Text>
              </TouchableOpacity>
          )}

          {!isProviderMode && item.status === 'COMPLETED' && item.isRated && (
             <View style={styles.ratedBadge}>
                <Ionicons name="star" size={14} color="#D97706" />
                <Text style={styles.ratedBadgeText}>You rated this</Text>
             </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => isProviderMode ? navigation.navigate('Home') : navigation.navigate('HomeTab')}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{isProviderMode ? 'Service Bookings' : 'My Bookings'}</Text>
            <Text style={styles.subtitle}>{isProviderMode ? 'Manage your service requests' : 'Track your puja bookings'}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilter(true)}>
          <Ionicons name="funnel-outline" size={20} color="#FF5E00" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          data={TABS}
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          renderItem={({ item }) => {
            const isActive = activeTab === item;
            const count = getCount(item);
            return (
              <TouchableOpacity 
                style={[styles.tab, isActive && styles.activeTab]}
                onPress={() => setActiveTab(item)}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                  {item} ({count})
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF5E00" />
        </View>
      ) : (
        <FlatList
          data={getFilteredBookings()}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} colors={['#FF5E00']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No {activeTab.toLowerCase()} bookings found.</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilter}
        onRequestClose={() => setShowFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Bookings</Text>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <TouchableOpacity onPress={clearFilters} style={{marginRight: 16}}>
                  <Text style={styles.clearFiltersText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFilter(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.statusOptions}>
              {['PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    tempStatus.includes(status) && styles.statusOptionActive
                  ]}
                  onPress={() => setTempStatus([status])}
                >
                  <Text style={[
                    styles.statusOptionText,
                    tempStatus.includes(status) && styles.statusOptionTextActive
                  ]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.dateInputs}>
              <TouchableOpacity 
                style={styles.dateInput} 
                onPress={() => {
                  setShowStartPicker(!showStartPicker);
                  setShowEndPicker(false);
                }}
              >
                <Text style={{color: startDate ? '#1E293B' : '#94A3B8'}}>
                  {startDate ? startDate.toLocaleDateString() : 'Select Start Date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.dateInput} 
                onPress={() => {
                  setShowEndPicker(!showEndPicker);
                  setShowStartPicker(false);
                }}
              >
                <Text style={{color: endDate ? '#1E293B' : '#94A3B8'}}>
                  {endDate ? endDate.toLocaleDateString() : 'Select End Date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

             {(showStartPicker || showEndPicker) && (
              <DateTimePicker
                value={showStartPicker ? (startDate || new Date()) : (endDate || new Date())}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={showStartPicker ? onStartDateChange : onEndDateChange}
                maximumDate={new Date(2030, 12, 31)}
                minimumDate={new Date(2020, 0, 1)}
              />
            )}

            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    </SafeAreaView>
  );
};
  
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  activeTab: {
    backgroundColor: '#FF5E00',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: 'white',
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  bookingId: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF5E00',
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF5E00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfoText: {
    flex: 1,
  },
  userNameInCard: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#10B981',
  },
  acceptBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 450,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  clearFiltersText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    marginTop: 12,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
    marginBottom: 10,
  },
  statusOptionActive: {
    backgroundColor: '#FFF7F2',
    borderColor: '#FF5E00',
  },
  statusOptionText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  statusOptionTextActive: {
    color: '#FF5E00',
  },
  dateInputs: {
    gap: 12,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#FF5E00',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  completeBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginLeft: 'auto', // Push to right
  },
  completeBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  rateBtn: {
    backgroundColor: '#FFF7ED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF5E00',
    marginLeft: 'auto',
  },
  rateBtnText: {
    color: '#FF5E00',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  ratingModalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    alignSelf: 'center',
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
  ratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginLeft: 'auto',
  },
  ratedBadgeText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
});

export default BookingsScreen;
