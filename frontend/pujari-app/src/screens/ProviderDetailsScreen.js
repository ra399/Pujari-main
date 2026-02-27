import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const ProviderDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { providerId } = route.params;
  const { user } = useAuth();
  
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const fetchProviderDetails = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
        ? apiUrl.replace('localhost', '10.0.2.2')
        : apiUrl;

      const response = await fetch(`${baseUrl}/api/providers/${providerId}`);
      const data = await response.json();
      
      if (response.ok) {
        setProvider(data);
        if (data.services && data.services.length > 0) {
          setSelectedService(data.services[0]); // Default to first service
        }
      } else {
        console.error('Failed to fetch provider details:', data);
      }

      // Fetch Reviews
      const reviewsRes = await fetch(`${baseUrl}/api/ratings/providers/${providerId}/ratings`);
      const reviewsData = await reviewsRes.json();
      if (reviewsData.success) {
        setReviews(reviewsData.data);
      }
    } catch (error) {
      console.error('Error fetching provider details:', error);
    } finally {
      setLoading(false);
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderDetails();
  }, [providerId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5E00" />
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Provider not found.</Text>
      </View>
    );
  }

  const formatTime = (time) => {
      // Basic formatting assuming time is "HH:MM"
      return time; 
  };
  
  const renderStars = (rating) => {
    return (
      <View style={{flexDirection: 'row', gap: 2}}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons 
            key={star} 
            name={star <= rating ? "star" : "star-outline"} 
            size={14} 
            color="#F59E0B" 
          />
        ))}
      </View>
    );
  };
  
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 100}}>
        {/* Header Image & Actions */}
        <View style={styles.headerImageContainer}>
            <Image 
                source={{ uri: provider.image || 'https://images.unsplash.com/photo-1542358827-046645934149?q=80&w=600&auto=format&fit=crop' }} 
                style={styles.headerImage} 
            />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.imageOverlay}
            />
            
            <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                    <Text style={styles.verifiedText}>Verified</Text>
                </View>
            </SafeAreaView>

            <View style={styles.headerInfo}>
                <Text style={styles.name}>{provider.name}</Text>
                <View style={styles.ratingRow}>
                     <View style={styles.ratingPill}>
                         <Ionicons name="star" size={14} color="#F59E0B" />
                         <Text style={styles.ratingVal}>{provider.rating ? provider.rating.toFixed(1) : 'New'}</Text>
                     </View>
                     <Text style={styles.reviewCount}>({provider.ratingCount || 0} reviews)</Text>
                     <View style={styles.dot} />
                     <Ionicons name="location" size={16} color="rgba(255,255,255,0.8)" />
                     <Text style={styles.location}>{provider.location.city}</Text>
                </View>
            </View>
        </View>

        {/* Floating Stats Card */}
        <View style={styles.statsCard}>
            <View style={styles.statItem}>
                <View style={[styles.statIcon, {backgroundColor: '#FFEDD5'}]}>
                    <MaterialCommunityIcons name="medal-outline" size={24} color="#F97316" />
                </View>
                <Text style={styles.statLabel}>Experience</Text>
                <Text style={styles.statValue}>{provider.experienceYears} Years</Text>
            </View>
            <View style={styles.dividerVertical} />
            <View style={styles.statItem}>
                <View style={[styles.statIcon, {backgroundColor: '#E0E7FF'}]}>
                    <Ionicons name="language" size={24} color="#4F46E5" />
                </View>
                <Text style={styles.statLabel}>Languages</Text>
                <Text style={styles.statValue} numberOfLines={1}>
                    {provider.languages && provider.languages.length > 0 ? provider.languages.join(', ') : 'Hindi'}
                </Text>
            </View>
             <View style={styles.dividerVertical} />
            <View style={styles.statItem}>
                <View style={[styles.statIcon, {backgroundColor: '#DCFCE7'}]}>
                    <Ionicons name="sparkles-outline" size={24} color="#16A34A" />
                </View>
                <Text style={styles.statLabel}>Services</Text>
                <Text style={styles.statValue}>{provider.services.length}</Text>
            </View>
        </View>

        {/* Services Section */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBg}>
                  <Text>🕉️</Text>
                </View>
                <Text style={styles.sectionTitle}>Services Offered</Text>
            </View>
            
            {provider.services.map((service, index) => (
                <View key={index} style={styles.serviceCard}>
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{service.name}</Text>
                        <View style={styles.durationRow}>
                             <Ionicons name="time-outline" size={14} color="#64748B" />
                             <Text style={styles.durationText}>
                                {service.duration ? `${service.duration} mins` : 'Variable duration'}
                             </Text>
                        </View>
                    </View>
                    <Text style={styles.servicePrice}>₹{service.price}</Text>
                </View>
            ))}
        </View>


        {/* Availability Section */}
        <View style={styles.section}>
             <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBg}>
                  <Text>📅</Text>
                </View>
                <Text style={styles.sectionTitle}>Weekly Availability</Text>
            </View>

            <View style={styles.calendarCard}>
                 {weekDays.map((day, idx) => {
                     // Map day string to index (assuming 0=Sun, 1=Mon...)
                     // current weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                     // Mon(0 in array) -> 1 (db)
                     // Sun(6 in array) -> 0 (db)
                     
                     let dbDayIndex;
                     if (day === 'Sun') dbDayIndex = 0;
                     else {
                        // Mon-Sat: Mon is 1, Sat is 6.
                        // In our array Mon is index 0. So idx + 1 within 0-5 range?
                        // weekDays = [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
                        // idx:        0    1    2    3    4    5    6
                        // db:         1    2    3    4    5    6    0
                        dbDayIndex = idx + 1;
                     }
                     
                     // Check if there is availability for this day
                     // db stores dayOfWeek as Number
                     const slots = provider.availability ? provider.availability.filter(a => Number(a.dayOfWeek) === dbDayIndex) : [];
                     const isAvailable = slots.length > 0;
                     
                     return (
                         <View key={idx} style={styles.dayRow}>
                             <Text style={styles.dayText}>{day}</Text>
                             <View style={styles.slotsContainer}>
                                 {isAvailable ? (
                                     slots.map((slot, sIdx) => (
                                         <View key={sIdx} style={styles.slotBadge}>
                                            <Text style={styles.slotText}>{slot.startTime}-{slot.endTime}</Text>
                                         </View>
                                     ))
                                 ) : (
                                     <Text style={styles.unavailableText}>Unavailable</Text>
                                 )}
                             </View>
                         </View>
                     );
                 })}
            </View>
        </View>

         {/* Specializations (Mocked tags based on Services for now) */}
         <View style={styles.section}>
             <Text style={styles.subsectionTitle}>Specializations</Text>
             <View style={styles.tagsContainer}>
                 {provider.services.slice(0, 5).map((s, i) => (
                     <View key={i} style={styles.tagBadge}>
                         <Text style={styles.tagText}>{s.name}</Text>
                     </View>
                 ))}
             </View>
         </View>

         {/* Reviews Section */}
         <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBg}>
                  <Text>⭐</Text>
                </View>
                <Text style={styles.sectionTitle}>Customer Reviews</Text>
            </View>

            {reviewsLoading ? (
               <ActivityIndicator color="#FF5E00" />
            ) : reviews.length > 0 ? (
               reviews.map((review, index) => (
                 <View key={index} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                       <View style={styles.reviewerInfo}>
                          <View style={styles.reviewerAvatar}>
                            <Text style={styles.reviewerInitial}>
                              {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                          </View>
                          <View>
                             <Text style={styles.reviewerName}>{review.user?.name || 'Anonymous User'}</Text>
                             <Text style={styles.reviewDate}>
                               {new Date(review.createdAt).toLocaleDateString()}
                             </Text>
                          </View>
                       </View>
                       {renderStars(review.rating)}
                    </View>
                    {review.review && (
                      <Text style={styles.reviewText}>{review.review}</Text>
                    )}
                 </View>
               ))
            ) : (
               <View style={styles.emptyReviewContainer}>
                  <Text style={styles.emptyReviewText}>No reviews yet. Be the first to rate!</Text>
               </View>
            )}
         </View>

      </ScrollView>

      {/* Bottom Sticky Footer */}
      <View style={styles.stickyFooter}>
          <View>
              <Text style={styles.startFromText}>Starting from</Text>
              <Text style={styles.startFromPrice}>
                  ₹{provider.services.length > 0 ? Math.min(...provider.services.map(s => s.price)) : 0}
              </Text>
          </View>
          <TouchableOpacity 
              style={styles.bookButtonContainer}
              onPress={() => {
                  console.log('🚀 Navigating to SelectService with ID:', provider.providerId);
                  navigation.navigate('SelectService', { 
                    providerId: provider.providerId, 
                    providerName: provider.name 
                  });
              }}
          >
              <LinearGradient
                  colors={['#FF5E00', '#FF2D00']}
                  start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                  style={styles.bookButton}
              >
                  <Text style={styles.bookButtonText}>Book Now</Text>
              </LinearGradient>
          </TouchableOpacity>
      </View>
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
  headerImageContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10, 
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  headerInfo: {
    position: 'absolute',
    bottom: 40, // More space for stats card overlap
    left: 20,
    right: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  ratingVal: {
    color: 'white',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 4,
  },
  reviewCount: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginLeft: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginHorizontal: 8,
  },
  location: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: -30,
    backgroundColor: 'white',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 16, // Slightly reduced padding
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align tops of columns
    minHeight: 80, // Ensure minimum height
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4, // Prevent text touching edges
  },
  statIcon: {
    width: 40, // Slightly smaller icons
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 13, // Slightly smaller text
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 18, // Better line height for wrapping
  },
  dividerVertical: {
    width: 1,
    height: '80%', // Relative height
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
    marginBottom: 8, // Add bottom margin to sections
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF5E00',
  },
  calendarCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  dayText: {
    width: 40, // Fixed width for day name
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 6,
  },
  slotsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: 4,
  },
  slotText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '600',
  },
  unavailableText: {
     fontSize: 12,
     color: '#94A3B8',
     fontStyle: 'italic',
     marginTop: 6,
  },
  subsectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1E293B',
      marginBottom: 12,
  },
  tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
  },
  tagBadge: {
      backgroundColor: '#FFF7ED',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#FFEDD5',
  },
  tagText: {
      color: '#EA580C',
      fontSize: 12,
      fontWeight: '600',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  startFromText: {
      fontSize: 12,
      color: '#64748B',
  },
  startFromPrice: {
      fontSize: 20,
      fontWeight: '800',
      color: '#1E293B',
  },
  bookButtonContainer: {
      width: '50%',
  },
  bookButton: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
  },
  bookButtonText: {
      color: 'white',
      fontWeight: '700',
      fontSize: 16,
  },
  reviewCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4E6', // Light pink/red
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E11D48',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  reviewDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  reviewText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  emptyReviewContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyReviewText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
});

export default ProviderDetailsScreen;
