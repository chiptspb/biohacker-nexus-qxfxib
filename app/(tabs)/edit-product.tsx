
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { Frequency, Route, DayOfWeek, MedicationType, ScheduledDose } from '@/types';
import Toast, { ToastType } from '@/components/Toast';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, addWeeks, addMonths, startOfDay, getDay, isBefore, isEqual, subMonths, addYears, format } from 'date-fns';
import { IconSymbol } from '@/components/IconSymbol';

const FREQUENCIES: Frequency[] = [
  'AM Daily',
  'PM Daily',
  'Daily',
  'Every Other Day',
  'Every 3 Days',
  'Every 4 Days',
  'Every 5 Days',
  'Every 6 Days',
  'Weekly',
  'Bi-Weekly',
  'Monthly'
];

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
  const { products, updateProduct, scheduledDoses, replaceScheduledDosesForProduct } = useApp();
  
  const product = products.find(p => p.id === productId);

  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || '');
  const [medicationType, setMedicationType] = useState<MedicationType>(product?.medicationType || 'Other Peptide');
  const [doseMg, setDoseMg] = useState(product?.doseMg.toString() || '');
  const [selectedFrequencies, setSelectedFrequencies] = useState<Frequency[]>(
    product?.frequencies || [product?.frequency || 'Daily']
  );
  const [route, setRoute] = useState<Route>(product?.route || 'SubQ');
  const [schedule, setSchedule] = useState(product?.schedule || '');
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(product?.daysOfWeek || []);
  const [startingDate, setStartingDate] = useState(product?.startingDate ? new Date(product.startingDate + 'T00:00:00') : new Date());
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

  const toggleFrequency = (freq: Frequency) => {
    // Special handling for AM Daily and PM Daily - they can both be selected
    if (freq === 'AM Daily' || freq === 'PM Daily') {
      if (selectedFrequencies.includes(freq)) {
        // Remove this frequency
        const newFreqs = selectedFrequencies.filter(f => f !== freq);
        // If removing both AM and PM, default to Daily
        if (newFreqs.length === 0) {
          setSelectedFrequencies(['Daily']);
        } else {
          setSelectedFrequencies(newFreqs);
        }
      } else {
        // Add this frequency, remove other non-AM/PM frequencies
        const amPmFreqs = selectedFrequencies.filter(f => f === 'AM Daily' || f === 'PM Daily');
        setSelectedFrequencies([...amPmFreqs, freq]);
      }
    } else {
      // For other frequencies, only one can be selected
      setSelectedFrequencies([freq]);
    }
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
   * @returns The next occurrence of the target day (includes the same day if it matches)
   */
  const findNextDayOfWeek = (fromDate: Date, targetDay: number): Date => {
    const currentDay = getDay(fromDate);
    
    // If the starting date is already the target day, use it
    if (currentDay === targetDay) {
      return fromDate;
    }
    
    // Calculate days to add to reach the target day
    let daysToAdd = targetDay - currentDay;
    
    // If target day is earlier in the week, add 7 to get next week's occurrence
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }
    
    return addDays(fromDate, daysToAdd);
  };

  const calculateScheduledDoses = (prodId: string, productName: string, doseAmount: number, routeType: Route): ScheduledDose[] => {
    const doses: ScheduledDose[] = [];
    
    // Use startOfDay to normalize the starting date to midnight local time
    const start = startOfDay(startingDate);
    const today = startOfDay(new Date());
    
    // Always start from the selected starting date (inclusive)
    const effectiveStart = start;
    
    // Generate doses for 1 year ahead from the effective start
    const endDate = addYears(effectiveStart, 1);

    console.log('=== RECALCULATING SCHEDULED DOSES ===');
    console.log('Product:', productName);
    console.log('Frequencies:', selectedFrequencies);
    console.log('Days of Week:', daysOfWeek);
    console.log('Starting Date (local):', format(start, 'yyyy-MM-dd'));
    console.log('Today (local):', format(today, 'yyyy-MM-dd'));
    console.log('Start Day of Week:', getDay(effectiveStart), '(0=Sun, 1=Mon, etc.)');
    console.log('End Date:', format(endDate, 'yyyy-MM-dd'));

    // Process each selected frequency
    selectedFrequencies.forEach(frequency => {
      console.log(`\n--- Processing frequency: ${frequency} ---`);
      
      // Helper function to get interval days based on frequency
      const getIntervalDays = (freq: Frequency): number => {
        switch (freq) {
          case 'AM Daily':
          case 'PM Daily':
          case 'Daily': return 1;
          case 'Every Other Day': return 2;
          case 'Every 3 Days': return 3;
          case 'Every 4 Days': return 4;
          case 'Every 5 Days': return 5;
          case 'Every 6 Days': return 6;
          default: return 1;
        }
      };

      // Determine time and timeOfDay based on frequency
      let scheduledTime = '09:00';
      let timeOfDay: 'AM' | 'PM' | undefined = undefined;
      
      if (frequency === 'AM Daily') {
        scheduledTime = '09:00';
        timeOfDay = 'AM';
      } else if (frequency === 'PM Daily') {
        scheduledTime = '21:00';
        timeOfDay = 'PM';
      }

      if (frequency === 'AM Daily' || frequency === 'PM Daily' || frequency === 'Daily' || 
          frequency === 'Every Other Day' || frequency === 'Every 3 Days' || 
          frequency === 'Every 4 Days' || frequency === 'Every 5 Days' || 
          frequency === 'Every 6 Days') {
        
        // Check if specific days of week are selected
        if (daysOfWeek.length > 0) {
          // User selected specific days - only schedule on those days
          const selectedDayNumbers = daysOfWeek.map(day => DAY_MAP[day]).sort((a, b) => a - b);
          
          console.log(`Specific days selected: ${daysOfWeek.join(', ')}`);
          console.log('Day numbers:', selectedDayNumbers);
          
          // For each selected day of the week
          selectedDayNumbers.forEach(targetDay => {
            // Find the first occurrence of this day on or after the effective start date
            const firstOccurrence = findNextDayOfWeek(effectiveStart, targetDay);
            
            console.log(`\nDay ${targetDay} (${Object.keys(DAY_MAP).find(k => DAY_MAP[k as DayOfWeek] === targetDay)}):`);
            console.log('  First occurrence:', format(firstOccurrence, 'yyyy-MM-dd'));
            
            // Get the interval for this frequency
            const intervalDays = getIntervalDays(frequency);
            
            // Add doses at the specified interval, but only on this day of the week
            let currentDate = firstOccurrence;
            let doseCount = 0;
            
            while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
              const dateString = format(currentDate, 'yyyy-MM-dd');
              
              doses.push({
                id: `${prodId}-${frequency}-${targetDay}-${dateString}-${scheduledTime}`,
                productId: prodId,
                productName,
                doseMg: doseAmount,
                route: routeType,
                scheduledDate: dateString,
                scheduledTime,
                completed: false,
                timeOfDay,
              });
              doseCount++;
              
              // For daily frequencies with specific days, just add 7 days to get next week
              if (frequency === 'Daily' || frequency === 'AM Daily' || frequency === 'PM Daily') {
                currentDate = addWeeks(currentDate, 1);
              } else {
                // For other intervals, we need to find the next occurrence of this day
                // that's at least intervalDays away
                let nextDate = addDays(currentDate, intervalDays);
                // Make sure we land on the correct day of week
                while (getDay(nextDate) !== targetDay) {
                  nextDate = addDays(nextDate, 1);
                }
                currentDate = nextDate;
              }
            }
            console.log(`  Generated ${doseCount} doses`);
          });
        } else {
          // No specific days selected - use regular interval from start date
          const intervalDays = getIntervalDays(frequency);
          let currentDate = effectiveStart;
          let doseCount = 0;
          
          console.log(`Interval: ${intervalDays} days, starting from ${format(currentDate, 'yyyy-MM-dd')}`);
          
          while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            
            doses.push({
              id: `${prodId}-${frequency}-${dateString}-${scheduledTime}`,
              productId: prodId,
              productName,
              doseMg: doseAmount,
              route: routeType,
              scheduledDate: dateString,
              scheduledTime,
              completed: false,
              timeOfDay,
            });
            doseCount++;
            currentDate = addDays(currentDate, intervalDays);
          }
          
          console.log(`Generated ${doseCount} doses for ${frequency}`);
        }
      } else if (frequency === 'Weekly') {
        if (daysOfWeek.length > 0) {
          // Weekly with specific days: Find next occurrence of each selected day, then recur weekly
          const selectedDayNumbers = daysOfWeek.map(day => DAY_MAP[day]).sort((a, b) => a - b);
          
          console.log('Selected days:', daysOfWeek);
          console.log('Day numbers:', selectedDayNumbers);
          
          // For each selected day of the week
          selectedDayNumbers.forEach(targetDay => {
            // Find the first occurrence of this day on or after the effective start date
            const firstOccurrence = findNextDayOfWeek(effectiveStart, targetDay);
            
            console.log(`\nDay ${targetDay} (${Object.keys(DAY_MAP).find(k => DAY_MAP[k as DayOfWeek] === targetDay)}):`);
            console.log('  First occurrence:', format(firstOccurrence, 'yyyy-MM-dd'));
            console.log('  Day of week:', getDay(firstOccurrence));
            
            // Add doses every week on this day
            let currentDate = firstOccurrence;
            let doseCount = 0;
            while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
              const dateString = format(currentDate, 'yyyy-MM-dd');
              
              doses.push({
                id: `${prodId}-${frequency}-${targetDay}-${dateString}-${scheduledTime}`,
                productId: prodId,
                productName,
                doseMg: doseAmount,
                route: routeType,
                scheduledDate: dateString,
                scheduledTime,
                completed: false,
              });
              doseCount++;
              currentDate = addWeeks(currentDate, 1);
            }
            console.log(`  Generated ${doseCount} doses`);
          });
        } else {
          // Weekly without specific days: Use the same day of week as start date
          console.log('No specific days selected, using start date day of week');
          let currentDate = effectiveStart;
          let doseCount = 0;
          while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            
            doses.push({
              id: `${prodId}-${frequency}-${dateString}-${scheduledTime}`,
              productId: prodId,
              productName,
              doseMg: doseAmount,
              route: routeType,
              scheduledDate: dateString,
              scheduledTime,
              completed: false,
            });
            doseCount++;
            currentDate = addWeeks(currentDate, 1);
          }
          console.log(`Generated ${doseCount} doses`);
        }
      } else if (frequency === 'Bi-Weekly') {
        if (daysOfWeek.length > 0) {
          // Bi-weekly with specific days: Find next occurrence of each selected day, then recur every 2 weeks
          const selectedDayNumbers = daysOfWeek.map(day => DAY_MAP[day]).sort((a, b) => a - b);
          
          console.log('Selected days:', daysOfWeek);
          console.log('Day numbers:', selectedDayNumbers);
          
          selectedDayNumbers.forEach(targetDay => {
            const firstOccurrence = findNextDayOfWeek(effectiveStart, targetDay);
            
            console.log(`\nDay ${targetDay} (${Object.keys(DAY_MAP).find(k => DAY_MAP[k as DayOfWeek] === targetDay)}):`);
            console.log('  First occurrence:', format(firstOccurrence, 'yyyy-MM-dd'));
            
            // Add doses every 2 weeks on this day
            let currentDate = firstOccurrence;
            let doseCount = 0;
            while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
              const dateString = format(currentDate, 'yyyy-MM-dd');
              
              doses.push({
                id: `${prodId}-${frequency}-${targetDay}-${dateString}-${scheduledTime}`,
                productId: prodId,
                productName,
                doseMg: doseAmount,
                route: routeType,
                scheduledDate: dateString,
                scheduledTime,
                completed: false,
              });
              doseCount++;
              currentDate = addWeeks(currentDate, 2);
            }
            console.log(`  Generated ${doseCount} doses`);
          });
        } else {
          // Bi-weekly without specific days: Use the same day of week as start date
          console.log('No specific days selected, using start date day of week');
          let currentDate = effectiveStart;
          let doseCount = 0;
          while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
            const dateString = format(currentDate, 'yyyy-MM-dd');
            
            doses.push({
              id: `${prodId}-${frequency}-${dateString}-${scheduledTime}`,
              productId: prodId,
              productName,
              doseMg: doseAmount,
              route: routeType,
              scheduledDate: dateString,
              scheduledTime,
              completed: false,
            });
            doseCount++;
            currentDate = addWeeks(currentDate, 2);
          }
          console.log(`Generated ${doseCount} doses`);
        }
      } else if (frequency === 'Monthly') {
        // Monthly: Add a dose on the same day of each month
        console.log('Monthly frequency, using same day of month');
        let currentDate = effectiveStart;
        let doseCount = 0;
        while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
          const dateString = format(currentDate, 'yyyy-MM-dd');
          
          doses.push({
            id: `${prodId}-${frequency}-${dateString}-${scheduledTime}`,
            productId: prodId,
            productName,
            doseMg: doseAmount,
            route: routeType,
            scheduledDate: dateString,
            scheduledTime,
            completed: false,
          });
          doseCount++;
          currentDate = addMonths(currentDate, 1);
        }
        console.log(`Generated ${doseCount} doses`);
      }
    });

    // Sort doses by date and time
    doses.sort((a, b) => {
      const dateCompare = a.scheduledDate.localeCompare(b.scheduledDate);
      if (dateCompare !== 0) return dateCompare;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });

    console.log(`\n=== TOTAL: Generated ${doses.length} doses for 1 year ===`);
    if (doses.length > 0) {
      console.log('First 10 doses:', doses.slice(0, 10).map(d => ({
        date: d.scheduledDate,
        time: d.scheduledTime,
        timeOfDay: d.timeOfDay,
      })));
    }

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

    if (selectedFrequencies.length === 0) {
      showToast('Please select at least one frequency.', 'error');
      return;
    }

    // Validate starting date is not too far in the past (more than 6 months)
    const sixMonthsAgo = subMonths(new Date(), 6);
    const selectedStart = startOfDay(startingDate);
    if (isBefore(selectedStart, sixMonthsAgo)) {
      showToast('Starting date cannot be more than 6 months in the past.', 'error');
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
        frequency: selectedFrequencies[0], // Primary frequency for backward compatibility
        frequencies: selectedFrequencies, // Store all selected frequencies
        route,
        schedule: schedule.trim() || undefined,
        daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : undefined,
        startingDate: format(startOfDay(startingDate), 'yyyy-MM-dd'),
        notes: notes.trim() || undefined,
        updatedAt: new Date(),
      });

      // Recalculate scheduled doses - preserve completed status for existing doses
      const newDoses = calculateScheduledDoses(productId, name.trim(), doseNum, route);
      
      // Merge with existing completed doses to preserve completion status
      const oldCompletedDoses = scheduledDoses
        .filter(d => d.productId === productId && d.completed)
        .reduce((acc, d) => {
          acc[d.scheduledDate] = true;
          return acc;
        }, {} as Record<string, boolean>);
      
      const mergedDoses = newDoses.map(dose => {
        if (oldCompletedDoses[dose.scheduledDate]) {
          return { ...dose, completed: true };
        }
        return dose;
      });
      
      console.log(`Replacing ${mergedDoses.length} scheduled doses for product ${productId}`);
      replaceScheduledDosesForProduct(productId, mergedDoses);

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
            <Text style={styles.helperText}>
              You can select both AM Daily and PM Daily for twice-daily dosing.
            </Text>
            <View style={styles.optionsGrid}>
              {FREQUENCIES.map(freq => {
                const isSelected = selectedFrequencies.includes(freq);
                
                return (
                  <Pressable
                    key={freq}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                    ]}
                    onPress={() => toggleFrequency(freq)}
                    disabled={isSaving}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {freq}
                    </Text>
                  </Pressable>
                );
              })}
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
            <Text style={styles.helperText}>
              Select when you want to start this protocol. Tap to open calendar picker.
            </Text>
            <Pressable 
              style={[commonStyles.input, styles.datePickerButton]} 
              onPress={() => setShowDatePicker(true)}
              disabled={isSaving}
            >
              <IconSymbol name="calendar" size={20} color={colors.primary} />
              <Text style={styles.datePickerText}>
                {startingDate.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              <IconSymbol name="chevron.down" size={16} color={colors.textSecondary} />
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={startingDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={subMonths(new Date(), 6)}
                maximumDate={addYears(new Date(), 2)}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setStartingDate(selectedDate);
                  }
                }}
                textColor={colors.text}
                themeVariant="light"
              />
            )}
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Day(s) of Week (optional)</Text>
            <Text style={styles.helperText}>
              Select specific days for doses. For example, select Mon & Thu for twice-weekly dosing on those days.
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
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
