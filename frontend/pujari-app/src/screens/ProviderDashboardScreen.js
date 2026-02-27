import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ProviderDashboardScreen = () => {
  const { token, user } = useAuth();
  const navigation = useNavigation();
  const [isActive, setIsActive] = useState(false);
  const [statsData, setStatsData] = useState({
    totalBookings: 0,
    thisMonthBookings: 0,
    avgRating: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      console.log('🚀 Dashboard Focused | User:', user?.name, ' | Role:', user?.role);
      fetchStats();
      fetchProfile();
    }, [token, user])
  );

  const fetchStats = async () => {
    try {
      let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '10.0.2.2');
      }

      console.log('📡 Fetching provider stats from:', `${apiUrl}/api/providers/stats`);
      const response = await fetch(`${apiUrl}/api/providers/stats`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const result = await response.json();
      console.log('📥 Stats response JSON:', JSON.stringify(result));

      if (response.ok && result.data) {
        setStatsData(result.data);
      } else {
        console.warn('⚠️ Stats fetch failed or data missing:', result.message);
      }
    } catch (error) {
      console.error('❌ Error fetching provider stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
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
        console.log('👤 Provider profile response:', JSON.stringify(data));
        const profileData = data.data || data;
        setIsActive(profileData.isActive);
      } else {
        const err = await response.json();
        console.warn('⚠️ Profile fetch failed:', err.message);
      }
    } catch (error) {
      console.error('Error fetching provider profile:', error);
    }
  };

  const toggleActive = async (value) => {
    try {
      setIsActive(value);
      let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '10.0.2.2');
      }
      const response = await fetch(`${apiUrl}/api/providers/me/active`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        setIsActive(!value); // Revert on failure
        const data = await response.json();
        Alert.alert('Status Error', data.message || 'Could not update status');
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
      setIsActive(!value);
    }
  };

  const stats = [
    { 
      label: 'Total Bookings', 
      value: loading ? '-' : statsData.totalBookings.toString(), 
      icon: 'calendar', 
      color: '#EFF6FF', 
      iconColor: '#3B82F6' 
    },
    { 
      label: 'This Month', 
      value: loading ? '-' : statsData.thisMonthBookings.toString(), 
      icon: 'trending-up', 
      color: '#F0FDF4', 
      iconColor: '#22C55E' 
    },
    { 
      label: 'Rating', 
      value: loading ? '-' : statsData.avgRating.toFixed(1), 
      icon: 'star', 
      color: '#FFF7ED', 
      iconColor: '#F59E0B' 
    },
    { 
      label: 'Pending', 
      value: loading ? '-' : statsData.pendingRequests.toString(), 
      icon: 'time', 
      color: '#FAF5FF', 
      iconColor: '#A855F7' 
    },
  ];

  const actions = [
    {
      title: 'Manage Bookings',
      subtitle: 'View and respond to booking requests',
      icon: 'calendar',
      color: '#3B82F6',
      badge: statsData.pendingRequests > 0 ? statsData.pendingRequests : null,
      onPress: () => navigation.navigate('Bookings')
    },
    {
      title: 'Manage Availability',
      subtitle: 'Set your weekly schedule',
      icon: 'time',
      color: '#10B981',
      onPress: () => navigation.navigate('Availability')
    },
    {
      title: 'Earnings & Reports',
      subtitle: 'Track your income and analytics',
      icon: 'stats-chart',
      color: '#8B5CF6',
      onPress: () => Alert.alert('Coming Soon', 'Earnings reports will be available in the next update.')
    }
  ];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <LinearGradient
          colors={['#FF5E00', '#FF2D00']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <View style={styles.headerIconCircle}>
                {user?.profile_pic ? (
                  <Image source={{ uri: user.profile_pic }} style={styles.headerImage} />
                ) : (
                  <Ionicons name="home" size={18} color="white" />
                )}
              </View>
              <View>
                <Text style={styles.greeting}>Namaste</Text>
                <Text style={styles.userName}>{user?.name || 'Pujari'}</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.headerActionBtn}
                onPress={() => navigation.navigate('Profile')}
              >
                <Ionicons name="person-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerStatus}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.verifiedText}>Verified Pujari</Text>
            </View>
            <View style={styles.activeSwitchRow}>
              <Text style={styles.activeLabel}>Active</Text>
              <Switch
                value={isActive}
                onValueChange={toggleActive}
                trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                thumbColor="white"
                ios_backgroundColor="#CBD5E1"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View 
                key={index} 
                style={[styles.statCard, { backgroundColor: stat.color }]}
              >
                <View style={styles.statHeader}>
                  <Ionicons name={stat.icon} size={18} color={stat.iconColor} />
                  <Text style={[styles.statLabel, { color: stat.iconColor }]}>{stat.label}</Text>
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action List */}
        <View style={styles.actionList}>
          {actions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.actionCard} onPress={action.onPress}>
              <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={24} color="white" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
              {action.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{action.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 80,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconCircle: {
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
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 6,
  },
  activeSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginRight: 8,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: -50,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statCard: {
    width: (width - 32 - 32 - 12) / 2, // Accounting for outer padding, inner padding, and gap
    padding: 16,
    borderRadius: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
  },
  actionList: {
    padding: 16,
    marginTop: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  badge: {
    backgroundColor: '#EF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  }
});

export default ProviderDashboardScreen;
