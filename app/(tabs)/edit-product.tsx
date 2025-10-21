
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { Frequency, Route, DayOfWeek, MedicationType, ScheduledDose } from '@/types';
import Toast, { ToastType } from '@/components/Toast';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, addWeeks, addMonths, startOfDay, getDay, isBefore, isEqual } from 'date-fns';

const FREQUENCIES: Frequency[] = ['Daily', 'Every Other Day', 'Weekly', 'Bi-Weekly', 'Monthly', 'As Needed'];
const ROUTES: Route[] = ['SubQ', 'IM', 'Oral', 'Nasal', 'Topical', 'Vaginal'];
const DAYS_OF_WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEDICATION_TYPES: MedicationType[] = ['GLP-1', 'Other Peptide', 'Hormone'];

// Map DayOfWeek to JavaScript day numbers (0 = Sunday, 6 = Saturday)
const DAY_MAP: Record<DayOfWeek, number> = {
  'Sun': 0,
  'Mon': 1,
  'Tue': 2,
  'Wed': 3,
  'Thu': 4,
  'Fri': 5,
  'Sat': 6,
};

export default function EditProductScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { products, updateProduct, scheduledDoses, setScheduledDoses, addScheduledDose } = useApp();
  
  const product = products.find(p => p.id === productId);

  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || '');
  const [medicationType, setMedicationType] = useState<MedicationType>(product?.medicationType || 'Other Peptide');
  const [doseMg, setDoseMg] = useState(product?.doseMg.toString() || '');
  const [frequency, setFrequency] = useState<Frequency>(product?.frequency || 'Daily');
  const [route, setRoute] = useState<Route>(product?.route || 'SubQ');
  const [schedule, setSchedule] = useState(product?.schedule || '');
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(product?.daysOfWeek || []);
  const [startingDate, setStartingDate] = useState(product?.startingDate ? new Date(product.startingDate) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState(product?.notes || '');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const toggleDayOfWeek = (day: DayOfWeek) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };

  /**
   * Find the next occurrence of a specific day of the week from a given date
   * @param fromDate - The date to start searching from
   * @param targetDay - The target day of the week (0 = Sunday, 6 = Saturday)
   * @returns The next occurrence of the target day
   */
  const findNextDayOfWeek = (fromDate: Date, targetDay: number): Date => {
    const currentDay = getDay(fromDate);
    let daysToAdd = targetDay - currentDay;
    
    // If the target day is today or in the past this week, move to next week
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }
    
    return addDays(fromDate, daysToAdd);
  };

  const calculateScheduledDoses = (prodId: string, productName: string, doseAmount: number, routeType: Route): ScheduledDose[] => {
    const doses: ScheduledDose[] = [];
    const start = startOfDay(new Date(startingDate));
    
    // Generate doses for the next 90 days
    const endDate = addDays(start, 90);

    console.log('Calculating doses:', {
      productName,
      frequency,
      daysOfWeek,
      startDate: start.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (frequency === 'As Needed') {
      // No scheduled doses for "As Needed"
      return doses;
    }

    if (frequency === 'Daily') {
      // Daily: Add a dose every day
      let currentDate = start;
      while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
        doses.push({
          id: `${prodId}-${currentDate.toISOString()}`,
          productId: prodId,
          productName,
          doseMg: doseAmount,
          route: routeType,
          scheduledDate: currentDate.toISOString().split('T')[0],
          scheduledTime: '09:00',
          completed: false,
        });
        currentDate = addDays(currentDate, 1);
      }
    } else if (frequency === 'Every Other Day') {
      // Every Other Day: Add a dose every 2 days
      let currentDate = start;
      while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
        doses.push({
          id: `${prodId}-${currentDate.toISOString()}`,
          productId: prodId,
          productName,
          doseMg: doseAmount,
          route: routeType,
          scheduledDate: currentDate.toISOString().split('T')[0],
          scheduledTime: '09:00',
          completed: false,
        });
        currentDate = addDays(currentDate, 2);
      }
    } else if (frequency === 'Weekly') {
      if (daysOfWeek.length > 0) {
        // Weekly with specific days: Find next occurrence of each selected day, then recur weekly
        const selectedDayNumbers = daysOfWeek.map(day => DAY_MAP[day]).sort((a, b) => a - b);
        
        console.log('Selected days:', daysOfWeek, 'Day numbers:', selectedDayNumbers);
        
        // For each selected day of the week
        selectedDayNumbers.forEach(targetDay => {
          // Find the first occurrence of this day on or after the start date
          let currentDate = start;
          const startDay = getDay(start);
          
          if (startDay === targetDay) {
            // If start date is already the target day, use it
            currentDate = start;
          } else {
            // Find next occurrence of target day
            currentDate = findNextDayOfWeek(start, targetDay);
          }
          
          console.log(`First occurrence of day ${targetDay}:`, currentDate.toISOString());
          
          // Add doses every week on this day
          while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
            doses.push({
              id: `${prodId}-${currentDate.toISOString()}`,
              productId: prodId,
              productName,
              doseMg: doseAmount,
              route: routeType,
              scheduledDate: currentDate.toISOString().split('T')[0],
              scheduledTime: '09:00',
              completed: false,
            });
            currentDate = addWeeks(currentDate, 1);
          }
        });
      } else {
        // Weekly without specific days: Use the same day of week as start date
        let currentDate = start;
        while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
          doses.push({
            id: `${prodId}-${currentDate.toISOString()}`,
            productId: prodId,
            productName,
            doseMg: doseAmount,
            route: routeType,
            scheduledDate: currentDate.toISOString().split('T')[0],
            scheduledTime: '09:00',
            completed: false,
          });
          currentDate = addWeeks(currentDate, 1);
        }
      }
    } else if (frequency === 'Bi-Weekly') {
      if (daysOfWeek.length > 0) {
        // Bi-weekly with specific days: Find next occurrence of each selected day, then recur every 2 weeks
        const selectedDayNumbers = daysOfWeek.map(day => DAY_MAP[day]).sort((a, b) => a - b);
        
        selectedDayNumbers.forEach(targetDay => {
          let currentDate = start;
          const startDay = getDay(start);
          
          if (startDay === targetDay) {
            currentDate = start;
          } else {
            currentDate = findNextDayOfWeek(start, targetDay);
          }
          
          // Add doses every 2 weeks on this day
          while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
            doses.push({
              id: `${prodId}-${currentDate.toISOString()}`,
              productId: prodId,
              productName,
              doseMg: doseAmount,
              route: routeType,
              scheduledDate: currentDate.toISOString().split('T')[0],
              scheduledTime: '09:00',
              completed: false,
            });
            currentDate = addWeeks(currentDate, 2);
          }
        });
      } else {
        // Bi-weekly without specific days: Use the same day of week as start date
        let currentDate = start;
        while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
          doses.push({
            id: `${prodId}-${currentDate.toISOString()}`,
            productId: prodId,
            productName,
            doseMg: doseAmount,
            route: routeType,
            scheduledDate: currentDate.toISOString().split('T')[0],
            scheduledTime: '09:00',
            completed: false,
          });
          currentDate = addWeeks(currentDate, 2);
        }
      }
    } else if (frequency === 'Monthly') {
      // Monthly: Add a dose on the same day of each month
      let currentDate = start;
      while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
        doses.push({
          id: `${prodId}-${currentDate.toISOString()}`,
          productId: prodId,
          productName,
          doseMg: doseAmount,
          route: routeType,
          scheduledDate: currentDate.toISOString().split('T')[0],
          scheduledTime: '09:00',
          completed: false,
        });
        currentDate = addMonths(currentDate, 1);
      }
    }

    // Sort doses by date
    doses.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

    console.log(`Generated ${doses.length} doses. First 5:`, doses.slice(0, 5).map(d => d.scheduledDate));

    return doses;
  };

  if (!product) {
    return (
      <View style={commonStyles.centerContent}>
        <Text style={commonStyles.text}>Product not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!name.trim() || !doseMg) {
      showToast('Please enter product name and dose amount.', 'error');
      return;
    }

    const doseNum = parseFloat(doseMg);
    if (isNaN(doseNum) || doseNum <= 0) {
      showToast('Please enter a valid dose amount.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      // Simulate Firebase save delay
      await new Promise(resolve => setTimeout(resolve, 800));

      updateProduct({
        ...product,
        name: name.trim(),
        category: category.trim() || 'General',
        medicationType,
        doseMg: doseNum,
        frequency,
        route,
        schedule: schedule.trim() || undefined,
        daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : undefined,
        startingDate: startingDate.toISOString().split('T')[0],
        notes: notes.trim() || undefined,
        updatedAt: new Date(),
      });

      // Recalculate scheduled doses
      const existingDoses = scheduledDoses.filter(d => d.productId !== productId);
      const newDoses = calculateScheduledDoses(productId, name.trim(), doseNum, route);
      setScheduledDoses([...existingDoses, ...newDoses]);

      showToast('Product updated successfully!', 'success');
      
      // Navigate to dashboard after short delay to show toast
      setTimeout(() => {
        router.push('/(tabs)/(home)/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error updating product:', error);
      showToast('Failed to update product. Please try again.', 'error');
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Product',
          headerShown: true,
        }}
      />
      <View style={commonStyles.container}>
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />

        <ScrollView style={commonStyles.content} contentContainerStyle={commonStyles.scrollContent}>
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Product Name *</Text>
            <TextInput
              style={commonStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Semaglutide, BPC-157"
              placeholderTextColor={colors.textSecondary}
              editable={!isSaving}
            />
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Medication Type *</Text>
            <View style={styles.optionsGrid}>
              {MEDICATION_TYPES.map(type => (
                <Pressable
                  key={type}
                  style={[
                    styles.option,
                    medicationType === type && styles.optionSelected,
                  ]}
                  onPress={() => setMedicationType(type)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.optionText,
                      medicationType === type && styles.optionTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Category (optional)</Text>
            <TextInput
              style={commonStyles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., Weight Loss, Recovery"
              placeholderTextColor={colors.textSecondary}
              editable={!isSaving}
            />
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Dose Amount (mg) *</Text>
            <TextInput
              style={commonStyles.input}
              value={doseMg}
              onChangeText={setDoseMg}
              placeholder="e.g., 0.5, 250"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              editable={!isSaving}
            />
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Frequency *</Text>
            <View style={styles.optionsGrid}>
              {FREQUENCIES.map(freq => (
                <Pressable
                  key={freq}
                  style={[
                    styles.option,
                    frequency === freq && styles.optionSelected,
                  ]}
                  onPress={() => setFrequency(freq)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.optionText,
                      frequency === freq && styles.optionTextSelected,
                    ]}
                  >
                    {freq}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Route of Administration *</Text>
            <View style={styles.optionsGrid}>
              {ROUTES.map(r => (
                <Pressable
                  key={r}
                  style={[
                    styles.option,
                    route === r && styles.optionSelected,
                  ]}
                  onPress={() => setRoute(r)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.optionText,
                      route === r && styles.optionTextSelected,
                    ]}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Starting Date *</Text>
            <Pressable 
              style={commonStyles.input} 
              onPress={() => setShowDatePicker(true)}
              disabled={isSaving}
            >
              <Text style={{ color: colors.text, fontSize: 16 }}>
                {startingDate.toLocaleDateString()}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={startingDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setStartingDate(selectedDate);
                  }
                }}
              />
            )}
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Day(s) of Week (optional)</Text>
            <Text style={styles.helperText}>
              Select specific days for doses. Leave empty for all days.
            </Text>
            <View style={styles.daysGrid}>
              {DAYS_OF_WEEK.map(day => (
                <Pressable
                  key={day}
                  style={[
                    styles.dayOption,
                    daysOfWeek.includes(day) && styles.dayOptionSelected,
                  ]}
                  onPress={() => toggleDayOfWeek(day)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.dayOptionText,
                      daysOfWeek.includes(day) && styles.dayOptionTextSelected,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Schedule (optional)</Text>
            <TextInput
              style={commonStyles.input}
              value={schedule}
              onChangeText={setSchedule}
              placeholder="e.g., Morning with breakfast"
              placeholderTextColor={colors.textSecondary}
              editable={!isSaving}
            />
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Notes (optional)</Text>
            <TextInput
              style={commonStyles.inputMultiline}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional notes about this product..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              editable={!isSaving}
            />
          </View>

          <Pressable 
            style={[buttonStyles.primary, isSaving && { opacity: 0.6 }]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={buttonStyles.buttonText}>Save Changes</Text>
            )}
          </Pressable>

          <Pressable 
            style={[buttonStyles.outline, { marginTop: 12 }]} 
            onPress={() => router.back()}
            disabled={isSaving}
          >
            <Text style={buttonStyles.buttonTextOutline}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayOption: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: 60,
    alignItems: 'center',
  },
  dayOptionSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  dayOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  dayOptionTextSelected: {
    color: colors.text,
  },
});
