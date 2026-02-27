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
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const EditProfileScreen = () => {
  const { user, token, setUser, currentMode } = useAuth();
  const navigation = useNavigation();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    city: user?.city || '',
    bio: user?.bio || ''
  });

  // Provider specific state
  const [experienceYears, setExperienceYears] = useState('0');
  const [services, setServices] = useState([]);
  const [location, setLocation] = useState({ city: user?.city || '', lat: '', long: '' });
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.profile_pic || '');
  const [uploadingImage, setUploadingImage] = useState(false);

  React.useEffect(() => {
    if (currentMode === 'PROVIDER') {
      fetchProviderProfile();
    }
  }, [currentMode]);

  const fetchProviderProfile = async () => {
    setFetchLoading(true);
    try {
      let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '10.0.2.2');
      }

      const response = await fetch(`${apiUrl}/api/providers/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setExperienceYears(data.experienceYears?.toString() || '0');
        setServices(data.services || []);
        setLocation({
          city: data.location?.city || user?.city || '',
          lat: data.location?.lat || '',
          long: data.location?.long || ''
        });
        if (data.bio) {
           setFormData(prev => ({ ...prev, bio: data.bio }));
        }
      }
    } catch (error) {
      console.error('Error fetching provider profile:', error);
    } finally {
      setFetchLoading(false);
    }
  };

  const addService = () => {
    setServices([...services, { name: '', price: 0, description: '' }]);
  };

  const updateService = (index, field, value) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const removeService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    setUploadingImage(true);
    try {
      let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '10.0.2.2');
      }

      const formData = new FormData();
      formData.append('image', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        type: 'image/jpeg',
        name: 'profile-pic.jpg',
      });

      const response = await fetch(`${apiUrl}/api/users/upload-profile-pic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        const updatedUser = data.data.user;
        setProfilePic(updatedUser.profile_pic);
        setUser(updatedUser); // Update global user state immediately
      } else {
        Alert.alert('Upload Failed', data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      let city = location.city;
      try {
          const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (reverseGeocode.length > 0) {
              const address = reverseGeocode[0];
              city = address.city || address.region || city;
          }
      } catch (e) {
          console.log("Reverse geocode failed", e);
      }

      setLocation({
        ...location,
        lat: latitude.toString(),
        long: longitude.toString(),
        city: city
      });
      Alert.alert('Location Fetched', 'Coordinates and city have been updated.');
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    setLoading(true);

    try {
      let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '10.0.2.2');
      }

      if (currentMode === 'PROVIDER') {
        // Update Provider Profile
        const providerBody = {
          bio: formData.bio,
          experienceYears: parseInt(experienceYears) || 0,
          location: {
            city: location.city || formData.city,
            lat: location.lat,
            long: location.long
          },
          profile_pic: profilePic,
          services: services.map(s => ({
            name: s.name,
            price: parseFloat(s.price) || 0,
            description: s.description || ''
          }))
        };

        const pResponse = await fetch(`${apiUrl}/api/providers/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(providerBody)
        });

        if (!pResponse.ok) {
          const errorData = await pResponse.json();
          throw new Error(errorData.message || 'Failed to update provider profile');
        }
      }

      // Always update User Profile (for name, email, etc.)
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, profile_pic: profilePic })
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Icon */}
        <View style={styles.profileIconSection}>
          <TouchableOpacity onPress={pickImage} disabled={uploadingImage}>
            <View style={styles.profileImageContainer}>
              {uploadingImage ? (
                <ActivityIndicator color="#FF5E00" />
              ) : profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person" size={48} color="#FF5E00" />
              )}
              {!uploadingImage && (
                <View style={styles.editIconBadge}>
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>
            {uploadingImage ? 'Uploading...' : 'Change Profile Photo'}
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter your name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Phone (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{user?.phone || 'N/A'}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter your email"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Native City */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Native City</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              placeholder="Enter your city"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              placeholder="Tell us about yourself"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Provider Specific Section */}
          {currentMode === 'PROVIDER' && (
            <View style={styles.providerSection}>
              <View style={styles.divider} />
              <Text style={styles.sectionHeader}>Professional Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Experience (Years)</Text>
                <TextInput
                  style={styles.input}
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  keyboardType="numeric"
                  placeholder="e.g. 5"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                    <Text style={[styles.label, {marginBottom: 0}]}>Location Details</Text>
                    <TouchableOpacity onPress={handleGetCurrentLocation} style={styles.detectLocationBtn}>
                        <Ionicons name="locate" size={16} color="#0EA5E9" />
                        <Text style={styles.detectLocationText}>Detect Location</Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.input, { marginBottom: 10 }]}
                  value={location.city}
                  onChangeText={(text) => setLocation({ ...location, city: text })}
                  placeholder="City"
                />
                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 10 }]}
                    value={location.lat}
                    onChangeText={(text) => setLocation({ ...location, lat: text })}
                    placeholder="Latitude"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={location.long}
                    onChangeText={(text) => setLocation({ ...location, long: text })}
                    placeholder="Longitude"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.servicesHeaderRow}>
                <Text style={styles.label}>Services Offered</Text>
                <TouchableOpacity onPress={addService} style={styles.addServiceBtn}>
                  <Ionicons name="add-circle" size={20} color="#FF5E00" />
                  <Text style={styles.addServiceText}>Add Service</Text>
                </TouchableOpacity>
              </View>

              {services.map((service, index) => (
                <View key={index} style={styles.serviceCard}>
                  <View style={styles.serviceCardHeader}>
                    <Text style={styles.serviceIndex}>Service #{index + 1}</Text>
                    <TouchableOpacity onPress={() => removeService(index)}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  
                  <TextInput
                    style={styles.serviceInput}
                    value={service.name}
                    onChangeText={(text) => updateService(index, 'name', text)}
                    placeholder="Service Name (e.g. Puja)"
                  />
                  <TextInput
                    style={styles.serviceInput}
                    value={service.price?.toString()}
                    onChangeText={(text) => updateService(index, 'price', text)}
                    placeholder="Price (INR)"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.serviceInput, { height: 60 }]}
                    value={service.description}
                    onChangeText={(text) => updateService(index, 'description', text)}
                    placeholder="Brief description"
                    multiline
                  />
                </View>
              ))}
            </View>
          )}

        </View>

        {/* Info Note */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Your phone number is verified and cannot be changed. Contact support if you need to update it.
          </Text>
        </View>

      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          <LinearGradient
            colors={['#FF5E00', '#FF2D00']}
            style={styles.gradientButton}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
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
  profileIconSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF5E00',
    marginBottom: 12,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF5E00',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  changePhotoText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  formSection: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
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
    minHeight: 100,
    paddingTop: 16,
  },
  readOnlyInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readOnlyText: {
    fontSize: 15,
    color: '#64748B',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
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
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  providerSection: {
    marginTop: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  servicesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addServiceText: {
    color: '#FF5E00',
    fontSize: 13,
    fontWeight: '700',
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  serviceInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  detectLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  detectLocationText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '700',
    marginLeft: 4,
  }
});

export default EditProfileScreen;
