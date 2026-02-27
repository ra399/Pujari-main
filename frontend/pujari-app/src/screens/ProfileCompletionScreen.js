import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Alert,
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import AuthInput from '../components/auth/AuthInput';
import PrimaryButton from '../components/auth/PrimaryButton';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const ProfileCompletionScreen = () => {
  const { user, token, setToken, setUser, setRole } = useAuth();
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(user?.profile_pic || null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const pickImage = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to upload your profile picture.');
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

  const handleComplete = async () => {
    if (!fullName || !city) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: fullName,
          city: city,
          bio: bio,
          role: 'USER'
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Success! Update local context to trigger navigation
        setUser(data.data);
        setRole(data.data.role);
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Icon */}
          <View style={styles.headerIconContainer}>
            <View style={styles.orangeBox}>
              <Ionicons name="sparkles" size={32} color="white" />
            </View>
          </View>

          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Help us personalize your experience</Text>

          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickImage} disabled={uploadingImage}>
              <View style={styles.avatarCircle}>
                {uploadingImage ? (
                  <ActivityIndicator color="#FF5E00" />
                ) : profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.profileImage} />
                ) : (
                  <Feather name="user" size={60} color="#E2E8F0" />
                )}
              </View>
              <View style={styles.cameraButton}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <AuthInput 
              label="Full Name *"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
            />

            <AuthInput 
              label="City *"
              placeholder="Select your city"
              icon="map-pin"
              value={city}
              onChangeText={setCity}
            />

            <AuthInput 
              label="Bio (Optional)"
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={bio}
              onChangeText={setBio}
            />
          </View>

          <View style={styles.footer}>
            <PrimaryButton 
              title="Complete Profile"
              onPress={handleComplete}
              loading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerIconContainer: {
    marginBottom: 24,
  },
  orangeBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FF5E00', // Modern orange
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#FF5E00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 32,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF1E7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF5E00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  form: {
    marginBottom: 24,
  },
  footer: {
    marginTop: 10,
  },
});

export default ProfileCompletionScreen;
