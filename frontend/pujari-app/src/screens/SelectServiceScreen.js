import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const SelectServiceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { providerId, providerName } = route.params;

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        console.log('🔍 SelectServiceScreen: Fetching services for providerId:', providerId);
        
        if (!providerId) {
          setErrorMsg('Invalid Provider ID');
          setLoading(false);
          return;
        }

        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
        const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
          ? apiUrl.replace('localhost', '10.0.2.2')
          : apiUrl;

        const url = `${baseUrl}/api/providers/${providerId}`;
        console.log('🔗 Fetching URL:', url);

        const response = await fetch(url);
        console.log('📥 Response status:', response.status);

        if (!response.ok) {
          const text = await response.text();
          console.error('❌ Fetch failed:', text);
          setErrorMsg(`Failed to fetch services (Status: ${response.status})`);
          return;
        }

        const data = await response.json();
        console.log('📦 Services data received:', data.services?.length);
        
        if (data.services) {
          setServices(data.services);
        } else {
             // If manual check fails
            console.warn('⚠️ No services found in response');
        }
      } catch (error) {
        console.error('❌ Error fetching services:', error);
        setErrorMsg('Error connecting to server');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [providerId]);

  const renderServiceCard = ({ item }) => {
    const isSelected = selectedService?._id === item._id;
    return (
      <TouchableOpacity 
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => setSelectedService(item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.serviceName}>{item.name}</Text>
          {isSelected && <Ionicons name="checkmark-circle" size={24} color="#FF5E00" />}
        </View>
        
        <View style={styles.durationRow}>
          <Ionicons name="time-outline" size={14} color="#64748B" />
          <Text style={styles.durationText}>
            {item.duration ? `${item.duration} mins` : 'Variable duration'}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.price}</Text>
          <Text style={styles.taxText}>inclusive of all taxes</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleContinue = () => {
    if (selectedService) {
      navigation.navigate('SelectDateTime', {
        providerId,
        providerName,
        service: selectedService
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF5E00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Select Service</Text>
          <Text style={styles.headerSubtitle}>{providerName || 'Provider'}</Text>
        </View>
      </View>

      <FlatList
        data={services}
        renderItem={renderServiceCard}
        keyExtractor={item => item._id || item.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {errorMsg && (
        <View style={styles.center}>
          <Text style={{color: 'red'}}>{errorMsg}</Text>
        </View>
      )}

      <View style={styles.footer}>
        {selectedService && (
            <View style={styles.noteContainer}>
                 <Text style={styles.noteText}>
                    💡 Note: Prices may vary based on specific requirements. Final price will be confirmed before booking.
                 </Text>
            </View>
        )}
        <TouchableOpacity 
          style={[styles.continueButton, !selectedService && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedService}
        >
          <LinearGradient
            colors={selectedService ? ['#FF5E00', '#FF2D00'] : ['#E2E8F0', '#CBD5E1']}
            style={styles.gradientButton}
          >
            <Text style={styles.continueText}>Continue to Date & Time</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#FF5E00',
    backgroundColor: '#FFF7F2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  durationText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF5E00',
  },
  taxText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  noteContainer: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  noteText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  }
});

export default SelectServiceScreen;
