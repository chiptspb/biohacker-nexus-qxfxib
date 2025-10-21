
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { Product, Inventory, Frequency, Route, Units, DayOfWeek, MedicationType, ScheduledDose } from '@/types';
import Toast, { ToastType } from '@/components/Toast';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, addWeeks, addMonths, startOfDay, getDay, isBefore, isEqual, isAfter, subMonths, addYears } from 'date-fns';
import { IconSymbol } from '@/components/IconSymbol';

const FREQUENCIES: Frequency[] = [
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
const UNITS: Units[] = ['mg', 'mcg', 'ml', 'IU'];
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

export default function AddProductScreen() {
  const { user, addProduct, updateInventory, addScheduledDose } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [medicationType, setMedicationType] = useState<MedicationType>('Other Peptide');
  const [doseMg, setDoseMg] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('Weekly');
  const [route, setRoute] = useState<Route>('SubQ');
  const [schedule, setSchedule] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([]);
  const [startingDate, setStartingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Inventory fields
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<Units>('mg');
  const [lotNumber, setLotNumber] = useState('');
  const [storage, setStorage] = useState('');

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
   * @returns The next occurrence of the target day (could be the same day if it matches)
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

  const calculateScheduledDoses = (productId: string, productName: string, doseAmount: number, routeType: Route): ScheduledDose[] => {
    const doses: ScheduledDose[] = [];
    const start = startOfDay(new Date(startingDate));
    const today = startOfDay(new Date());
    
    // If start date is in the past, begin from today for future doses
    const effectiveStart = isBefore(start, today) ? today : start;
    
    // Generate doses for 1 year ahead (365 days)
    const endDate = addYears(effectiveStart, 1);

    console.log('Calculating doses:', {
      productName,
      frequency,
      daysOfWeek,
      originalStartDate: start.toISOString(),
      effectiveStartDate: effectiveStart.toISOString(),
      startDay: getDay(effectiveStart),
      endDate: endDate.toISOString(),
    });

    // Helper function to get interval days based on frequency
    const getIntervalDays = (freq: Frequency): number => {
      switch (freq) {
        case 'Daily': return 1;
        case 'Every Other Day': return 2;
        case 'Every 3 Days': return 3;
        case 'Every 4 Days': return 4;
        case 'Every 5 Days': return 5;
        case 'Every 6 Days': return 6;
        default: return 1;
      }
    };

    if (frequency === 'Daily' || frequency === 'Every Other Day' || 
        frequency === 'Every 3 Days' || frequency === 'Every 4 Days' || 
        frequency === 'Every 5 Days' || frequency === 'Every 6 Days') {
      // Fixed interval frequencies
      const intervalDays = getIntervalDays(frequency);
      let currentDate = effectiveStart;
      
      while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
        doses.push({
          id: `${productId}-${currentDate.toISOString()}`,
          productId,
          productName,
          doseMg: doseAmount,
          route: routeType,
          scheduledDate: currentDate.toISOString().split('T')[0],
          scheduledTime: '09:00',
          completed: false,
        });
        currentDate = addDays(currentDate, intervalDays);
      }
    } else if (frequency === 'Weekly') {
      if (daysOfWeek.length > 0) {
        // Weekly with specific days: Find next occurrence of each selected day, then recur weekly
        const selectedDayNumbers = daysOfWeek.map(day => DAY_MAP[day]).sort((a, b) => a - b);
        
        console.log('Selected days:', daysOfWeek, 'Day numbers:', selectedDayNumbers);
        
        // For each selected day of the week
        selectedDayNumbers.forEach(targetDay => {
          // Find the first occurrence of this day on or after the effective start date
          const firstOccurrence = findNextDayOfWeek(effectiveStart, targetDay);
          
          console.log(`First occurrence of day ${targetDay} (${Object.keys(DAY_MAP).find(k => DAY_MAP[k as DayOfWeek] === targetDay)}):`, firstOccurrence.toISOString(), 'Day:', getDay(firstOccurrence));
          
          // Add doses every week on this day
          let currentDate = firstOccurrence;
          while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
            doses.push({
              id: `${productId}-${currentDate.toISOString()}`,
              productId,
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
        let currentDate = effectiveStart;
        while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
          doses.push({
            id: `${productId}-${currentDate.toISOString()}`,
            productId,
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
          const firstOccurrence = findNextDayOfWeek(effectiveStart, targetDay);
          
          // Add doses every 2 weeks on this day
          let currentDate = firstOccurrence;
          while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
            doses.push({
              id: `${productId}-${currentDate.toISOString()}`,
              productId,
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
        let currentDate = effectiveStart;
        while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
          doses.push({
            id: `${productId}-${currentDate.toISOString()}`,
            productId,
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
      let currentDate = effectiveStart;
      while (isBefore(currentDate, endDate) || isEqual(currentDate, endDate)) {
        doses.push({
          id: `${productId}-${currentDate.toISOString()}`,
          productId,
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

    console.log(`Generated ${doses.length} doses for 1 year. First 5:`, doses.slice(0, 5).map(d => ({
      date: d.scheduledDate,
      day: getDay(new Date(d.scheduledDate + 'T00:00:00'))
    })));

    return doses;
  };

  const handleSubmit = async () => {
    if (!name.trim() || !doseMg) {
      showToast('Please enter product name and dose amount.', 'error');
      return;
    }

    const doseNum = parseFloat(doseMg);
    if (isNaN(doseNum) || doseNum <= 0) {
      showToast('Please enter a valid dose amount.', 'error');
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

      const productId = Date.now().toString();

      const product: Product = {
        id: productId,
        userId: user?.id || 'user-1',
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addProduct(product);

      // Add initial inventory if quantity provided
      if (quantity) {
        const qtyNum = parseFloat(quantity);
        if (!isNaN(qtyNum) && qtyNum > 0) {
          const inventory: Inventory = {
            id: Date.now().toString(),
            productId,
            userId: user?.id || 'user-1',
            quantity: qtyNum,
            unit,
            lotNumber: lotNumber.trim() || undefined,
            storage: storage.trim() || undefined,
            lastUpdated: new Date(),
          };
          updateInventory(inventory);
        }
      }

      // Calculate and add scheduled doses
      const scheduledDoses = calculateScheduledDoses(productId, product.name, doseNum, route);
      console.log(`Adding ${scheduledDoses.length} scheduled doses to context`);
      scheduledDoses.forEach(dose => addScheduledDose(dose));

      showToast('Medication added successfully!', 'success');
      
      // Navigate to dashboard after short delay to show toast
      setTimeout(() => {
        router.push('/(tabs)/(home)/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error adding product:', error);
      showToast('Failed to add medication. Please try again.', 'error');
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Product',
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
          {/* Product Information */}
          <Text style={[commonStyles.sectionTitle, { marginBottom: 16 }]}>Product Information</Text>

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
              Select specific days for doses. Leave empty to use starting date&apos;s day of week.
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

          {/* Initial Inventory */}
          <View style={commonStyles.divider} />
          <Text style={[commonStyles.sectionTitle, { marginBottom: 16 }]}>Initial Inventory (Optional)</Text>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Quantity</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[commonStyles.input, { flex: 1 }]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="e.g., 1000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                editable={!isSaving}
              />
              <View style={styles.unitPicker}>
                {UNITS.map(u => (
                  <Pressable
                    key={u}
                    style={[
                      styles.unitOption,
                      unit === u && styles.unitOptionSelected,
                    ]}
                    onPress={() => setUnit(u)}
                    disabled={isSaving}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        unit === u && styles.unitOptionTextSelected,
                      ]}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Lot Number</Text>
            <TextInput
              style={commonStyles.input}
              value={lotNumber}
              onChangeText={setLotNumber}
              placeholder="e.g., LOT12345"
              placeholderTextColor={colors.textSecondary}
              editable={!isSaving}
            />
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Storage Instructions</Text>
            <TextInput
              style={commonStyles.input}
              value={storage}
              onChangeText={setStorage}
              placeholder="e.g., Refrigerate 2-8°C"
              placeholderTextColor={colors.textSecondary}
              editable={!isSaving}
            />
          </View>

          {/* Submit Buttons */}
          <Pressable 
            style={[buttonStyles.primary, isSaving && { opacity: 0.6 }]} 
            onPress={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={buttonStyles.buttonText}>Add Product</Text>
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
  unitPicker: {
    flexDirection: 'row',
    gap: 4,
  },
  unitOption: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 50,
    alignItems: 'center',
  },
  unitOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  unitOptionTextSelected: {
    color: colors.text,
  },
});
