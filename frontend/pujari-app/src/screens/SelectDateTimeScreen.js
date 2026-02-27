import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const SelectDateTimeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { providerId, providerName, service } = route.params;

  const [availability, setAvailability] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate next 14 days
  useEffect(() => {
    const nextDays = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        nextDays.push(d);
    }
    setDates(nextDays);
    setSelectedDate(nextDays[0]); // Select today by default
  }, []);

  // Fetch Availability
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
        const baseUrl = (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost'))
          ? apiUrl.replace('localhost', '10.0.2.2')
          : apiUrl;

        const response = await fetch(`${baseUrl}/api/providers/${providerId}`);
        const data = await response.json();
        
        if (response.ok && data.availability) {
          setAvailability(data.availability);
        }
      } catch (error) {
        console.error('Error fetching availability:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [providerId]);

  const getDayName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const getDayNumber = (date) => {
    return date.getDate();
  };

  // Helper to convert "HH:MM" to minutes since midnight
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Helper to convert minutes to "HH:MM"
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Generate available time slots based on availability and service duration
  const getSlotsForSelectedDate = () => {
      if (!selectedDate || !availability || !service) return [];
      
      const dayIndex = selectedDate.getDay(); 
      const daySlots = availability.filter(a => Number(a.dayOfWeek) === dayIndex);
      
      if (daySlots.length === 0) return [];

      const serviceDuration = service.duration || 60; // Default 60 mins if not specified
      const allTimeSlots = [];

      daySlots.forEach(slot => {
        const startMinutes = timeToMinutes(slot.startTime);
        const endMinutes = timeToMinutes(slot.endTime);
        
        // Generate 30-minute interval slots
        // Each slot must have enough time for the service duration
        for (let time = startMinutes; time + serviceDuration <= endMinutes; time += 30) {
          const slotStart = minutesToTime(time);
          const slotEnd = minutesToTime(time + serviceDuration);
          
          allTimeSlots.push({
            startTime: slotStart,
            endTime: slotEnd,
            label: `${slotStart}-${slotEnd}`
          });
        }
      });

      return allTimeSlots;
  };

  const availableSlots = getSlotsForSelectedDate();

  const handleContinue = () => {
      if (selectedSlot) {
        navigation.navigate('ConfirmBooking', {
          providerId,
          providerName,
          service,
          date: selectedDate,
          timeSlot: selectedSlot
        });
      }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Select Date & Time</Text>
          <Text style={styles.headerSubtitle}>{service?.name}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Date Selection */}
        <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
                <Ionicons name="calendar-outline" size={20} color="#FF5E00" />
                <Text style={styles.sectionTitle}>Select Date</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateList}>
                {dates.map((date, index) => {
                    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                    return (
                        <TouchableOpacity 
                            key={index} 
                            style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                            onPress={() => {
                                setSelectedDate(date);
                                setSelectedSlot(null); // Reset slot on date change
                            }}
                        >
                            <Text style={[styles.dayName, isSelected && styles.textSelected]}>{getDayName(date)}</Text>
                            <Text style={[styles.dayNumber, isSelected && styles.textSelected]}>{getDayNumber(date)}</Text>
                            <Text style={[styles.monthName, isSelected && styles.textSelected]}>
                                {date.toLocaleDateString('en-US', { month: 'short' })}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
                <Ionicons name="time-outline" size={20} color="#FF5E00" />
                <Text style={styles.sectionTitle}>Select Time Slot</Text>
            </View>
            {availableSlots.length > 0 ? (
                <View style={styles.slotsGrid}>
                    {availableSlots.map((slot, index) => {
                        const isSelected = selectedSlot?.label === slot.label;
                        return (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.slotCard, isSelected && styles.slotCardSelected]}
                                onPress={() => setSelectedSlot(slot)}
                            >
                                <Text style={[styles.slotTime, isSelected && styles.textSelected]}>{slot.label}</Text>
                                <Text style={[styles.slotStatus, isSelected && styles.textSelected]}>Available</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ) : (
                 <View style={styles.noSlotsContainer}>
                     <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                     <Text style={styles.noSlotsText}>No slots available for this date.</Text>
                     <Text style={styles.noSlotsSubtext}>Please select another date.</Text>
                 </View>
            )}
        </View>

        {/* Booking Summary */}
        {selectedSlot && (
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Booking Summary</Text>
                
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Service</Text>
                    <Text style={styles.summaryValue}>{service?.name}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Duration</Text>
                    <Text style={styles.summaryValue}>
                        {service?.duration ? `${service.duration} mins` : 'Flexible'}
                    </Text>
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Date</Text>
                    <Text style={styles.summaryValue}>
                        {selectedDate ? selectedDate.toLocaleDateString('en-CA') : '-'}
                    </Text>
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Time</Text>
                    <Text style={styles.summaryValue}>{selectedSlot.label}</Text>
                </View>
                
                <View style={styles.divider} />
                
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalValue}>₹{service?.price}</Text>
                </View>
            </View>
        )}

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.continueButton, !selectedSlot && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedSlot}
        >
          <LinearGradient
            colors={selectedSlot ? ['#FF5E00', '#FF2D00'] : ['#E2E8F0', '#CBD5E1']}
            style={styles.gradientButton}
          >
            <Text style={styles.continueText}>Continue to Confirm</Text>
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
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 8,
  },
  dateList: {
    paddingRight: 16,
  },
  dateCard: {
    width: 70,
    height: 85,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
  },
  dateCardSelected: {
    backgroundColor: '#FF5E00',
    borderColor: '#FF5E00',
    shadowColor: "#FF5E00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayName: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  monthName: {
    fontSize: 11,
    color: '#94A3B8',
  },
  textSelected: {
    color: 'white',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  slotCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotCardSelected: {
    backgroundColor: '#FF5E00',
    borderColor: '#FF5E00',
  },
  slotTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  slotStatus: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
  noSlotsContainer: {
      alignItems: 'center',
      paddingVertical: 40,
      backgroundColor: 'white',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#F1F5F9',
  },
  noSlotsText: {
      color: '#64748B',
      fontSize: 14,
      marginTop: 12,
      fontWeight: '600',
  },
  noSlotsSubtext: {
      color: '#94A3B8',
      fontSize: 12,
      marginTop: 4,
  },
  summaryCard: {
      margin: 16,
      backgroundColor: '#FFF7ED',
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: '#FF5E00',
  },
  summaryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1E293B',
      marginBottom: 16,
  },
  summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
  },
  summaryLabel: {
      fontSize: 13,
      color: '#64748B',
  },
  summaryValue: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1E293B',
  },
  divider: {
      height: 1,
      backgroundColor: '#FED7AA',
      marginVertical: 12,
  },
  totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  totalLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: '#1E293B',
  },
  totalValue: {
      fontSize: 20,
      fontWeight: '800',
      color: '#EA580C',
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

export default SelectDateTimeScreen;
