import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [topPujaris, setTopPujaris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('Detecting...');
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName(user?.city || 'Mumbai'); // Fallback
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        let reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          setLocationName(address.city || address.region || 'Mumbai');
        }
      } catch (error) {
        console.log('Location error:', error);
        setLocationName(user?.city || 'Mumbai');
      }
    })();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
        
        // Android Emulator fix
        const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
          ? apiUrl.replace('localhost', '10.0.2.2')
          : apiUrl;

        const [servicesRes, providersRes] = await Promise.all([
          fetch(`${baseUrl}/api/providers/services`),
          fetch(`${baseUrl}/api/providers?limit=10`)
        ]);

        const servicesData = await servicesRes.json();
        const providersData = await providersRes.json();

        if (Array.isArray(servicesData)) {
          setServices(servicesData);
        }

        if (Array.isArray(providersData)) {
          setTopPujaris(providersData);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={'#FF5E00'} />
      </View>
    );
  }

  const handleSearchTextChange = async (text) => {
    setSearchText(text);
    if (text.length > 1) {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
        const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
          ? apiUrl.replace('localhost', '10.0.2.2')
          : apiUrl;
        
        const response = await fetch(`${baseUrl}/api/providers/suggestions?q=${text}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setSearchText(suggestion);
    setShowSuggestions(false);
    navigation.navigate('ProvidersList', { search: suggestion });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]} keyboardShouldPersistTaps="handled">
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#FF5E00', '#FF2D00']}
            style={styles.headerGradient}
          >
            <SafeAreaView>
              <View style={styles.topBar}>
                <View style={styles.userInfo}>
                  <View style={styles.sparkleIcon}>
                    {user?.profile_pic ? (
                      <Image source={{ uri: user.profile_pic }} style={styles.headerImage} />
                    ) : (
                      <Ionicons name="home" size={18} color="white" />
                    )}
                  </View>
                  <View>
                    <Text style={styles.greeting}>Namaste</Text>
                    <Text style={styles.userName}>{user?.name || 'Amit Patel'}</Text>
                  </View>
                </View>
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    style={styles.headerIcon}
                    onPress={() => navigation.navigate('Bookings')}
                  >
                    <Ionicons name="calendar-outline" size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.headerIcon}
                    onPress={() => navigation.navigate('Profile')}
                  >
                    <Ionicons name="person-outline" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.mainTitle}>Find Your Perfect Pujari</Text>

              {/* Search Card */}
              <View style={[styles.searchCard, { zIndex: 100 }]}>
                <View style={styles.searchInputRow}>
                  <Ionicons name="search-outline" size={20} color="#94A3B8" />
                  <TextInput 
                    placeholder="Search by service or location..." 
                    style={styles.searchInput}
                    placeholderTextColor="#94A3B8"
                    value={searchText}
                    onChangeText={handleSearchTextChange}
                    onSubmitEditing={() => navigation.navigate('ProvidersList', { search: searchText })}
                    returnKeyType="search"
                    onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                  />
                  {searchText.length > 0 && (
                     <TouchableOpacity onPress={() => {
                         setSearchText('');
                         setSuggestions([]);
                         setShowSuggestions(false);
                     }}>
                        <Ionicons name="close-circle" size={18} color="#94A3B8" />
                     </TouchableOpacity>
                  )}
                </View>
                
                {showSuggestions && suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((item, index) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionPress(item)}
                      >
                        <Ionicons name="search-outline" size={16} color="#94A3B8" style={{marginRight: 10}}/>
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={styles.divider} />
                <TouchableOpacity style={styles.locationRow}>
                  <Ionicons name="location-outline" size={20} color="#FF5E00" />
                  <Text style={styles.locationText}>{locationName}</Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesList}>
            {services.map((item) => (
              <TouchableOpacity key={item.id} style={styles.serviceItem}>
                <Text style={styles.serviceIcon}>{item.icon}</Text>
                <Text style={styles.serviceName}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Top Rated Pujaris Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Rated Pujaris</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProvidersList')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {topPujaris.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.pujariCard}
              onPress={() => navigation.navigate('ProviderDetails', { providerId: item.id })}
            >
              <View style={styles.pujariImageContainer}>
                <Image source={{ uri: item.image }} style={styles.pujariImage} />
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="white" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
              </View>
              <View style={styles.pujariInfo}>
                <Text style={styles.pujariName}>{item.name}</Text>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Ionicons name="location" size={14} color="#CBD5E1" />
                    <Text style={styles.detailText}>{item.location}</Text>
                  </View>
                  <View style={styles.dot} />
                  <Text style={styles.detailText}>{item.experience}</Text>
                </View>
                
                <View style={styles.tagsRow}>
                  {item.tags.slice(0, 2).map((tag, idx) => (
                    <View key={idx} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.reviewsText}>{item.reviews}</Text>
                  <Text style={styles.priceText}>{item.price}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  greeting: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  userName: {
    fontSize: 18,
    color: 'white',
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white',
    width: '70%',
    lineHeight: 34,
    marginBottom: 24,
  },
  searchCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 16,
  },
  viewAll: {
    color: '#FF5E00',
    fontWeight: '700',
    fontSize: 14,
  },
  servicesList: {
    paddingRight: 24,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  pujariCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  pujariImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 16,
    position: 'relative',
  },
  pujariImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  ratingBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF5E00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  ratingText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 2,
  },
  pujariInfo: {
    flex: 1,
    marginLeft: 16,
  },
  pujariName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  tag: {
    backgroundColor: '#FFF7F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#FF5E00',
    fontSize: 11,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewsText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  suggestionText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
});

export default HomeScreen;
