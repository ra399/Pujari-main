import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const DAYS = [
  { label: 'Mon', full: 'Monday', value: 1 },
  { label: 'Tue', full: 'Tuesday', value: 2 },
  { label: 'Wed', full: 'Wednesday', value: 3 },
  { label: 'Thu', full: 'Thursday', value: 4 },
  { label: 'Fri', full: 'Friday', value: 5 },
  { label: 'Sat', full: 'Saturday', value: 6 },
  { label: 'Sun', full: 'Sunday', value: 0 },
];

const ManageAvailabilityScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1); // Monday
  
  // availability structure: { 1: [{startTime, endTime}], 2: [], ... }
  const [availability, setAvailability] = useState({
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: []
  });

  const [showPicker, setShowPicker] = useState(false);
  const [pickerConfig, setPickerConfig] = useState({ day: 1, index: 0, type: 'start' });

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyTargetDays, setCopyTargetDays] = useState([]); // Array of day values [1, 2, ...]

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '10.0.2.2');
      }

      const response = await fetch(`${apiUrl}/api/provider/availability/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const rawData = await response.json();
        console.log('📅 Availability response:', JSON.stringify(rawData));
        
        // Handle both direct array and { success, data: [] } formats
        const slots = Array.isArray(rawData) ? rawData : (rawData.data || []);
        
        const organized = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
        slots.forEach(slot => {
          if (organized[slot.dayOfWeek]) {
            organized[slot.dayOfWeek].push({
              startTime: slot.startTime,
              endTime: slot.endTime
            });
          }
        });
        setAvailability(organized);
      } else {
        const err = await response.json();
        console.warn('⚠️ Availability fetch failed:', err.message);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSlot = () => {
    const updated = { ...availability };
    updated[selectedDay].push({ startTime: '09:00', endTime: '12:00' });
    setAvailability(updated);
  };

  const removeSlot = (index) => {
    const updated = { ...availability };
    updated[selectedDay].splice(index, 1);
    setAvailability(updated);
  };

  const updateSlotTime = (day, index, type, time) => {
    const updated = { ...availability };
    updated[day][index][type === 'start' ? 'startTime' : 'endTime'] = time;
    setAvailability(updated);
  };

  const handleTimeChange = (event, date) => {
    setShowPicker(false);
    if (date) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      updateSlotTime(pickerConfig.day, pickerConfig.index, pickerConfig.type, timeString);
    }
  };

  const openPicker = (day, index, type, currentTime) => {
    setPickerConfig({ day, index, type });
    setShowPicker(true);
  };

  const openCopyModal = () => {
    const currentSlots = availability[selectedDay];
    if (currentSlots.length === 0) {
      Alert.alert('Info', 'Add at least one slot to copy');
      return;
    }
    // Pre-select all days except current one by default
    setCopyTargetDays(DAYS.map(d => d.value).filter(v => v !== selectedDay));
    setShowCopyModal(true);
  };

  const toggleCopyTarget = (dayValue) => {
    if (copyTargetDays.includes(dayValue)) {
      setCopyTargetDays(copyTargetDays.filter(d => d !== dayValue));
    } else {
      setCopyTargetDays([...copyTargetDays, dayValue]);
    }
  };

  const confirmCopy = () => {
    if (copyTargetDays.length === 0) {
      Alert.alert('Info', 'Select at least one day');
      return;
    }

    const currentSlots = JSON.parse(JSON.stringify(availability[selectedDay]));
    const updated = { ...availability };
    
    copyTargetDays.forEach(day => {
      updated[day] = JSON.parse(JSON.stringify(currentSlots));
    });
    
    setAvailability(updated);
    setShowCopyModal(false);
    Alert.alert('Success', `Availability copied to ${copyTargetDays.length} days`);
  };

  const clearCurrentDay = () => {
    Alert.alert(
      'Clear Day',
      `Are you sure you want to clear availability for ${getDayName(selectedDay)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive', 
          onPress: () => {
            const updated = { ...availability };
            updated[selectedDay] = [];
            setAvailability(updated);
          } 
        }
      ]
    );
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      if (__DEV__ && Platform.OS === 'android' && apiUrl.includes('localhost')) {
        apiUrl = apiUrl.replace('localhost', '10.0.2.2');
      }

      const formattedData = Object.keys(availability).map(day => ({
        dayOfWeek: parseInt(day),
        slots: availability[day]
      }));

      const response = await fetch(`${apiUrl}/api/provider/availability/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ availability: formattedData })
      });

      if (response.ok) {
        Alert.alert('Success', 'Availability saved successfully');
        navigation.goBack();
      } else {
        const data = await response.json();
        Alert.alert('Error', data.message || 'Failed to save availability');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const renderDayItem = (day) => {
    const isActive = selectedDay === day.value;
    const slotCount = availability[day.value].length;
    
    return (
      <TouchableOpacity 
        key={day.value}
        style={[styles.dayItem, isActive && styles.dayItemActive]}
        onPress={() => setSelectedDay(day.value)}
      >
        <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>{day.label}</Text>
        <Text style={[styles.slotCount, isActive && styles.slotCountActive]}>
          {slotCount > 0 ? slotCount : 'Off'}
        </Text>
      </TouchableOpacity>
    );
  };

  const getDayName = (val) => DAYS.find(d => d.value === val)?.full;

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
        <View>
          <Text style={styles.headerTitle}>Manage Availability</Text>
          <Text style={styles.headerSubtitle}>Set your weekly schedule</Text>
        </View>
      </View>

      <View style={styles.daySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daySelectorContent}>
          {DAYS.map(renderDayItem)}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{getDayName(selectedDay)}</Text>
          <TouchableOpacity style={styles.addSlotBtn} onPress={addSlot}>
            <LinearGradient colors={['#FF5E00', '#FF2D00']} style={styles.addSlotGradient}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addSlotText}>Add Slot</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {availability[selectedDay].length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No slots available for this day</Text>
          </View>
        ) : (
          availability[selectedDay].map((slot, index) => (
            <View key={index} style={styles.slotCard}>
              <View style={styles.timeInputGroup}>
                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>Start Time</Text>
                  <TouchableOpacity 
                    style={styles.timeBox}
                    onPress={() => openPicker(selectedDay, index, 'start', slot.startTime)}
                  >
                    <Text style={styles.timeValue}>{slot.startTime}</Text>
                    <Ionicons name="time-outline" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.timeSeparator}>
                  <View style={styles.separatorLine} />
                </View>

                <View style={styles.timeInput}>
                  <Text style={styles.timeLabel}>End Time</Text>
                  <TouchableOpacity 
                    style={styles.timeBox}
                    onPress={() => openPicker(selectedDay, index, 'end', slot.endTime)}
                  >
                    <Text style={styles.timeValue}>{slot.endTime}</Text>
                    <Ionicons name="time-outline" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => removeSlot(index)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={openCopyModal}>
            <Text style={styles.actionBtnText}>Copy to Days</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={clearCurrentDay}>
            <Text style={styles.actionBtnText}>Clear Day</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            💡 Tip: Set realistic time slots considering travel time between bookings. You can update your availability anytime.
          </Text>
        </View>
        
        <View style={{height: 100}} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveAvailability} disabled={saving}>
          <LinearGradient colors={['#FF5E00', '#FF2D00']} style={styles.saveGradient}>
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Save Availability</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {showPicker && (
        <DateTimePicker
          value={(() => {
            const [h, m] = availability[pickerConfig.day][pickerConfig.index][pickerConfig.type === 'start' ? 'startTime' : 'endTime'].split(':');
            const d = new Date();
            d.setHours(parseInt(h), parseInt(m), 0, 0);
            return d;
          })()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* Copy Selection Modal */}
      <Modal
        visible={showCopyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCopyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Copy {getDayName(selectedDay)}'s Slots</Text>
              <Text style={styles.modalSubtitle}>Select days to apply this schedule</Text>
            </View>

            <View style={styles.daysGrid}>
              {DAYS.map((day) => {
                const isSelected = copyTargetDays.includes(day.value);
                const isCurrent = day.value === selectedDay;
                
                return (
                  <TouchableOpacity 
                    key={day.value}
                    style={[
                      styles.modalDayCircle, 
                      isSelected && styles.modalDayCircleSelected,
                      isCurrent && styles.modalDayCircleDisabled
                    ]}
                    onPress={() => !isCurrent && toggleCopyTarget(day.value)}
                    disabled={isCurrent}
                  >
                    <Text style={[
                      styles.modalDayText, 
                      isSelected && styles.modalDayTextSelected,
                      isCurrent && styles.modalDayTextDisabled
                    ]}>
                      {day.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={16} color="white" style={styles.checkIcon} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setShowCopyModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalConfirmBtn} 
                onPress={confirmCopy}
              >
                <LinearGradient colors={['#FF5E00', '#FF2D00']} style={styles.modalConfirmGradient}>
                  <Text style={styles.modalConfirmText}>Confirm Copy</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  daySelector: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  daySelectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayItem: {
    width: 60,
    height: 65,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayItemActive: {
    backgroundColor: '#FF5E00',
    borderColor: '#FF5E00',
    shadowColor: "#FF5E00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  dayLabelActive: {
    color: 'white',
  },
  slotCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  slotCountActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  addSlotBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addSlotGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  addSlotText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  slotCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  timeInputGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
  },
  timeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  timeSeparator: {
    justifyContent: 'center',
    paddingBottom: 20,
  },
  separatorLine: {
    width: 12,
    height: 1.5,
    backgroundColor: '#CBD5E1',
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  tipCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tipText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  saveButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  saveGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 24,
  },
  modalDayCircle: {
    width: (width - 120) / 4,
    height: (width - 120) / 4,
    borderRadius: (width - 120) / 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalDayCircleSelected: {
    backgroundColor: '#FF5E00',
    borderColor: '#FF5E00',
  },
  modalDayCircleDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    opacity: 0.5,
  },
  modalDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalDayTextSelected: {
    color: 'white',
  },
  modalDayTextDisabled: {
    color: '#CBD5E1',
  },
  checkIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '800',
    color: 'white',
  },
});

export default ManageAvailabilityScreen;
