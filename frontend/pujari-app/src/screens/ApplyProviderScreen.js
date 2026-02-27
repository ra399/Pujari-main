import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ApplyProviderScreen = () => {
  const { token } = useAuth();
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(false);
  const [serviceInput, setServiceInput] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [experienceYears, setExperienceYears] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      
      setCoordinates({ latitude, longitude });

      // Reverse geocode to get city name
      const reverseGeocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseGeocoded.length > 0) {
        const address = reverseGeocoded[0];
        const cityName = address.city || address.region || address.subregion;
        if (cityName) setLocation(cityName);
      }
      
      Alert.alert('Location Fetched', 'Your current location has been set.');
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Failed to fetch location. Please enter manually.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const addService = () => {
    const trimmed = serviceInput.trim();
    if (!trimmed) return;
    
    if (selectedServices.includes(trimmed)) {
      setServiceInput('');
      return;
    }

    setSelectedServices([...selectedServices, trimmed]);
    setServiceInput('');
  };

  const removeService = (service) => {
    setSelectedServices(selectedServices.filter(s => s !== service));
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      Alert.alert('Validation', 'Please add at least one service');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Validation', 'Please enter your location');
      return;
    }
    if (!experienceYears || isNaN(experienceYears)) {
      Alert.alert('Validation', 'Please enter valid years of experience');
      return;
    }

    setLoading(true);

    try {
      let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '10.0.2.2');
      }

      // Transform services array ['Puja', 'Havan'] into {"puja": true, "havan": true}
      const servicesObj = {};
      selectedServices.forEach(s => {
        servicesObj[s.toLowerCase()] = true;
      });

      const payload = {
        services: servicesObj,
        location: {
            city: location.trim(),
            // Only send geo if coordinates exist
            ...(coordinates ? {
                geo: {
                    type: 'Point',
                    coordinates: [coordinates.longitude, coordinates.latitude]
                }
            } : {})
        },
        experienceYears: parseInt(experienceYears)
      };

      const response = await fetch(`${apiUrl}/api/providers/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Application Submitted',
          'Your application to become a provider has been submitted and is pending approval.',
          [{ text: 'Great!', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply as Provider</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.introSection}>
          <LinearGradient
            colors={['#FFF7ED', '#FFEDD5']}
            style={styles.introCard}
          >
            <Ionicons name="sparkles" size={32} color="#FF5E00" />
            <Text style={styles.introTitle}>Join the Pujari Network</Text>
            <Text style={styles.introSubtitle}>
              Share your spiritual services with devotees in your area and grow your practice.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.formSection}>
          {/* Services Input */}
          <Text style={styles.label}>Services You Offer *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.flexInput}
              value={serviceInput}
              onChangeText={setServiceInput}
              placeholder="Type a service name (e.g. Satyanarayan Puja)"
              placeholderTextColor="#94A3B8"
              onSubmitEditing={addService}
              returnKeyType="add"
            />
            <TouchableOpacity style={styles.addButton} onPress={addService}>
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Capsules */}
          <View style={styles.capsuleContainer}>
            {selectedServices.map((service, index) => (
              <View key={index} style={styles.capsule}>
                <Text style={styles.capsuleText}>{service}</Text>
                <TouchableOpacity onPress={() => removeService(service)}>
                  <Ionicons name="close-circle" size={18} color="#FF5E00" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={styles.label}>Your City / Location *</Text>
                <TouchableOpacity onPress={handleDetectLocation} disabled={detectingLocation}>
                    <Text style={{color: '#FF5E00', fontWeight: 'bold', fontSize: 13}}>
                        {detectingLocation ? 'Detecting...' : 'Detect Location'}
                    </Text>
                </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Mumbai, Delhi, Varanasi"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Experience */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years of Experience *</Text>
            <TextInput
              style={styles.input}
              value={experienceYears}
              onChangeText={setExperienceYears}
              placeholder="e.g. 5"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.guidelinesCard}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.guidelineText}>
            Our team will review your application. Ensure your profile details are accurate for faster approval.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={['#FF5E00', '#FF2D00']}
            style={styles.gradientButton}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Application</Text>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  introSection: {
    padding: 16,
  },
  introCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#9A3412',
    marginTop: 12,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 14,
    color: '#C2410C',
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    padding: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flexInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: '#FF5E00',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capsuleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  capsuleText: {
    fontSize: 14,
    color: '#9A3412',
    fontWeight: '600',
    marginRight: 6,
  },
  inputGroup: {
    marginBottom: 20,
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
  guidelinesCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  guidelineText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
    marginLeft: 12,
  },
  footer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  }
});

export default ApplyProviderScreen;
