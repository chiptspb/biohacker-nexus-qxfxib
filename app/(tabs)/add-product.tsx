
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { Product, Inventory, Frequency, Route, Units, DayOfWeek, MedicationType, ScheduledDose } from '@/types';
import Toast, { ToastType } from '@/components/Toast';
import DateTimePicker from '@react-native-community/datetimepicker';

const FREQUENCIES: Frequency[] = ['Daily', 'Every Other Day', 'Weekly', 'Bi-Weekly', 'Monthly', 'As Needed'];
const ROUTES: Route[] = ['SubQ', 'IM', 'Oral', 'Nasal', 'Topical', 'Vaginal'];
const UNITS: Units[] = ['mg', 'mcg', 'ml', 'IU'];
const DAYS_OF_WEEK: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEDICATION_TYPES: MedicationType[] = ['GLP-1', 'Other Peptide', 'Hormone'];

export default function AddProductScreen() {
  const { user, addProduct, updateInventory, addScheduledDose } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [medicationType, setMedicationType] = useState<MedicationType>('Other Peptide');
  const [doseMg, setDoseMg] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('Daily');
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

  const calculateScheduledDoses = (productId: string, productName: string, doseAmount: number, routeType: Route): ScheduledDose[] => {
    const doses: ScheduledDose[] = [];
    const start = new Date(startingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate doses for the next 90 days
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + 90);

    let currentDate = new Date(start);
    
    while (currentDate <= endDate) {
      let shouldAddDose = false;

      switch (frequency) {
        case 'Daily':
          shouldAddDose = true;
          break;
        case 'Every Other Day':
          const daysDiff = Math.floor((currentDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          shouldAddDose = daysDiff % 2 === 0;
          break;
        case 'Weekly':
          if (daysOfWeek.length > 0) {
            const dayNames: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const currentDay = dayNames[currentDate.getDay()];
            shouldAddDose = daysOfWeek.includes(currentDay);
          } else {
            const weeksDiff = Math.floor((currentDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
            shouldAddDose = currentDate.getDay() === start.getDay() && weeksDiff >= 0;
          }
          break;
        case 'Bi-Weekly':
          const biWeeksDiff = Math.floor((currentDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          shouldAddDose = biWeeksDiff % 14 === 0;
          break;
        case 'Monthly':
          shouldAddDose = currentDate.getDate() === start.getDate();
          break;
        case 'As Needed':
          shouldAddDose = false;
          break;
      }

      if (shouldAddDose) {
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
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

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
