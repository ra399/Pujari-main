import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const { user, token, logout, setUser, currentMode, setCurrentMode } = useAuth();
  const navigation = useNavigation();
  
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    cancelled: 0,
    avgRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('👤 Current User Profile:', user);
    console.log('🔑 Current Role:', user?.role);
    fetchData();
  }, [currentMode]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserProfile(),
      fetchBookingStats()
    ]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchUserProfile = async () => {
    try {
      let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '10.0.2.2');
      }

      const response = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const responseData = await response.json();
        const userData = responseData.data?.user || responseData.user;
        if (userData) {
          console.log('✅ Updated user profile fetched:', userData.role);
          setUser(userData);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchBookingStats = async () => {
    try {
      let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '10.0.2.2');
      }

      if (currentMode === 'PROVIDER') {
        const statsResponse = await fetch(`${apiUrl}/api/providers/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (statsResponse.ok) {
          const result = await statsResponse.json();
          console.log('📥 Provider stats for profile:', JSON.stringify(result));
          const pStats = result.data;
          if (pStats) {
            setStats({
              total: pStats.totalBookings || 0,
              completed: pStats.thisMonthBookings || 0,
              cancelled: pStats.pendingRequests || 0,
              avgRating: pStats.avgRating || 0
            });
          }
        }
      } else {
        const response = await fetch(`${apiUrl}/api/bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const bookings = data.data || [];
          
          const completed = bookings.filter(b => b.status === 'COMPLETED').length;
          const cancelled = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED').length;
          
          setStats({
            total: bookings.length,
            completed,
            cancelled,
            avgRating: 0 
          });
        }
      }
    } catch (error) {
      console.error('Error fetching booking stats:', error);
    }
  };

  const toggleMode = () => {
    const newMode = currentMode === 'USER' ? 'PROVIDER' : 'USER';
    setCurrentMode(newMode);
    Alert.alert(
      'Mode Switched',
      `You are now in ${newMode === 'USER' ? 'User' : 'Provider'} Mode.`
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleNotifications = () => {
    Alert.alert('Coming Soon', 'Notification settings will be available soon!');
  };

  const handleApplyAsProvider = () => {
    Alert.alert(
      'Apply as Service Provider',
      'Would you like to apply to become a service provider?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: () => {
            // TODO: Navigate to provider application screen
            Alert.alert('Application', 'Provider application process will be implemented soon!');
          }
        }
      ]
    );
  };

  const handleHelpFAQ = () => {
    Alert.alert('Help & FAQ', 'For assistance, please contact us at:\nmanideepnaidugorle@gmail.com');
  };

  const handlePrivacyTerms = () => {
    Alert.alert('Privacy & Terms', 'Privacy policy and terms of service will be available soon.');
  };

  const handleContactUs = () => {
    Linking.openURL('mailto:manideepnaidugorle@gmail.com?subject=Support Request');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  // Calculate stats (placeholder for now)
  const bookingsCount = 0;
  const completedCount = 0;
  const avgRating = 0;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5E00']} />
        }
      >
        
        {/* Header Card */}
        <LinearGradient
          colors={['#FF5E00', '#FF2D00']}
          style={styles.headerCard}
        >
          {/* Home Button Left */}
          <TouchableOpacity 
            style={styles.headerIconLeft} 
            onPress={() => navigation.navigate(currentMode === 'PROVIDER' ? 'Home' : 'HomeTab')}
          >
            <Ionicons name="home" size={24} color="white" />
          </TouchableOpacity>
          {/* Mode Switch (Only for Providers) */}
          {user?.role === 'PROVIDER' && (
            <TouchableOpacity style={styles.modeToggle} onPress={toggleMode}>
              <View style={[
                styles.modeTogglePill,
                currentMode === 'PROVIDER' ? styles.modeTogglePillProvider : styles.modeTogglePillUser
              ]}>
                <Ionicons 
                  name={currentMode === 'PROVIDER' ? 'briefcase' : 'person'} 
                  size={14} 
                  color="white" 
                />
                <Text style={styles.modeToggleText}>
                  {currentMode === 'PROVIDER' ? 'Provider Mode' : 'User Mode'}
                </Text>
                <Ionicons name="swap-horizontal" size={14} color="white" />
              </View>
            </TouchableOpacity>
          )}

          {/* Profile Icon */}
          <View style={styles.profileIconContainer}>
            <View style={styles.profileIcon}>
              {user?.profile_pic ? (
                <Image source={{ uri: user.profile_pic }} style={styles.profileImage} />
              ) : (
                <Ionicons name="person-outline" size={48} color="#FF5E00" />
              )}
            </View>
          </View>

          {/* User Info */}
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userPhone}>{user?.phone || ''}</Text>
          {user?.city && (
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={12} color="white" />
              <Text style={styles.locationText}>{user.city}</Text>
            </View>
          )}

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : stats.total}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : (currentMode === 'PROVIDER' ? stats.avgRating.toFixed(1) : stats.cancelled)}</Text>
              <Text style={styles.statLabel}>{currentMode === 'PROVIDER' ? 'Rating' : 'Cancelled'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="person-outline" size={20} color="#64748B" />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="notifications-outline" size={20} color="#64748B" />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
            <View style={styles.soonBadge}>
              <Text style={styles.soonText}>Soon</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          {currentMode === 'PROVIDER' && (
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => navigation.navigate('Availability')}
            >
              <View style={styles.menuIconContainer}>
                <Ionicons name="time-outline" size={20} color="#64748B" />
              </View>
              <Text style={styles.menuText}>Manage Availability</Text>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>

        {/* Become a Provider Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {user?.role === 'PROVIDER' ? 'Manage Account' : 'Become a Provider'}
          </Text>
          
          {user?.role === 'PROVIDER' ? (
            <TouchableOpacity style={styles.providerCard} onPress={toggleMode}>
              <View style={[styles.providerIconContainer, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons 
                  name={currentMode === 'USER' ? "briefcase" : "person"} 
                  size={24} 
                  color="#10B981" 
                />
              </View>
              <View style={styles.providerContent}>
                <Text style={[styles.providerTitle, { color: '#064E3B' }]}>
                  {currentMode === 'USER' ? 'Switch to Provider Mode' : 'Switch to User Mode'}
                </Text>
                <Text style={styles.providerSubtitle}>
                  {currentMode === 'USER' ? 'Manage your services and bookings' : 'Browse and book services'}
                </Text>
              </View>
              <Ionicons name="swap-horizontal" size={24} color="#10B981" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.providerCard} onPress={() => navigation.navigate('ApplyProvider')}>
              <View style={styles.providerIconContainer}>
                <Ionicons name="briefcase" size={24} color="#FF5E00" />
              </View>
              <View style={styles.providerContent}>
                <Text style={styles.providerTitle}>Apply as Service Provider</Text>
                <Text style={styles.providerSubtitle}>Start offering your services</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#FF5E00" />
            </TouchableOpacity>
          )}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleHelpFAQ}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="help-circle-outline" size={20} color="#64748B" />
            </View>
            <Text style={styles.menuText}>Help & FAQ</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyTerms}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" />
            </View>
            <Text style={styles.menuText}>Privacy & Terms</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleContactUs}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="mail-outline" size={20} color="#64748B" />
            </View>
            <Text style={styles.menuText}>Contact Us</Text>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#E11D48" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={styles.version}>Version 1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerCard: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 80,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerIconLeft: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeToggle: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 10,
  },
  modeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modeTogglePillUser: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)', // Soft blue for user mode
  },
  modeTogglePillProvider: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)', // Soft green for provider mode
  },
  modeToggleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  profileIconContainer: {
    marginBottom: 16,
  },
  profileIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 24,
  },
  locationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  soonBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  soonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF5E00',
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF5E00',
  },
  providerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerContent: {
    flex: 1,
  },
  providerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  providerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    color: '#E11D48',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 16,
    marginBottom: 100,
  }
});

export default ProfileScreen;
