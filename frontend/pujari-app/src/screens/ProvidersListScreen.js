import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  FlatList,
  Platform,
  Dimensions,
  Image,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ProvidersListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(route.params?.search || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      try {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: location.coords.latitude,
          long: location.coords.longitude
        });
      } catch (error) {
        console.log('Location error:', error);
      }
    })();
  }, []);



  const handleSearchTextChange = async (text) => {
    setSearchQuery(text);
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
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    // Debounce/Logic in useEffect will trigger the search automatically
  };
  
  // Filters
  const [cityFilter, setCityFilter] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [showFilter, setShowFilter] = useState(false);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
        ? apiUrl.replace('localhost', '10.0.2.2')
        : apiUrl;

      let queryParams = new URLSearchParams();
      queryParams.append('limit', '100'); // Get many providers
      
      if (searchQuery) queryParams.append('service', searchQuery);
      if (cityFilter) queryParams.append('city', cityFilter);
      if (minRating > 0) queryParams.append('minRating', minRating.toString());

      // Auto-apply 50km radius filter if location is available
      if (userLocation) {
        queryParams.append('lat', userLocation.lat.toString());
        queryParams.append('long', userLocation.long.toString());
        queryParams.append('radius', '50');
      }

      const url = `${baseUrl}/api/providers?${queryParams.toString()}`;
      console.log('Fetching providers:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Providers data:', data);
      
      if (Array.isArray(data)) {
        setProviders(data);
      } else if (data && Array.isArray(data.data)) {
         // Handle wrapped response if applicable
         setProviders(data.data);
      } else if (data && Array.isArray(data.providers)) {
         setProviders(data.providers); 
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProviders();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [searchQuery, cityFilter, minRating, userLocation]);

  const renderProvider = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ProviderDetails', { providerId: item.id })}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.image }} style={styles.providerImage} />
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="white" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.providerName}>{item.name}</Text>
        <Text style={styles.reviewsText}>{item.reviews}</Text>
        
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={14} color="#64748B" />
          <Text style={styles.detailText}>{item.location || 'Location Not Set'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="briefcase-outline" size={14} color="#64748B" />
          <Text style={styles.detailText}>{item.experience}</Text>
        </View>

        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        
        <Text style={styles.priceText}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={() => navigation && navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search services (e.g. Puja)"
              value={searchQuery}
              onChangeText={handleSearchTextChange}
              placeholderTextColor="#94A3B8"
              onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
              }}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                }} style={{padding: 4}}>
                   <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
             )}
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilter(true)}>
            <Ionicons name="options-outline" size={24} color="#FF5E00" />
          </TouchableOpacity>
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
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF5E00" />
        </View>
      ) : (
        <FlatList
          data={providers}
          renderItem={renderProvider}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No providers found matching your criteria.</Text>
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
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.filterLabel}>Location (City)</Text>
            <TextInput 
              style={styles.filterInput}
              placeholder="Enter City"
              value={cityFilter}
              onChangeText={setCityFilter}
            />

            <Text style={styles.filterLabel}>Minimum Rating</Text>
            <View style={styles.ratingOptions}>
              {[0, 3, 4, 4.5].map((rating) => (
                <TouchableOpacity 
                  key={rating}
                  style={[styles.ratingOption, minRating === rating && styles.ratingOptionActive]}
                  onPress={() => setMinRating(rating)}
                >
                  <Text style={[styles.ratingOptionText, minRating === rating && styles.ratingOptionTextActive]}>
                    {rating === 0 ? 'Any' : `${rating}+ Stars`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => setShowFilter(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
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
    padding: 20,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1E293B',
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#FFF7F2',
    borderRadius: 12,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    position: 'relative',
  },
  providerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF5E00',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 2,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  providerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  reviewsText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  tag: {
    backgroundColor: '#FFF7F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#FF5E00',
    fontWeight: '600',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 8,
    textAlign: 'right',
  },
  emptyText: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 16,
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
    minHeight: 400,
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
  filterLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    marginTop: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  ratingOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ratingOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  ratingOptionActive: {
    backgroundColor: '#FFF7F2',
    borderColor: '#FF5E00',
  },
  ratingOptionText: {
    color: '#64748B',
    fontWeight: '600',
  },
  ratingOptionTextActive: {
    color: '#FF5E00',
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

export default ProvidersListScreen;
