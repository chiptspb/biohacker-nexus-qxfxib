
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, Modal, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { DoseLog, Route } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { IconSymbol } from '@/components/IconSymbol';
import { startOfDay, endOfDay, parseISO, isBefore, isWithinInterval, differenceInHours } from 'date-fns';

const ROUTES: Route[] = ['SubQ', 'IM', 'Oral', 'Nasal', 'Topical', 'Vaginal'];

export default function LogDoseScreen() {
  const { products, inventory, addDoseLog, updateInventory, scheduledDoses, markDoseAsCompleted } = useApp();
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [amount, setAmount] = useState('');
  const [route, setRoute] = useState<Route>('SubQ');
  const [site, setSite] = useState('');
  const [sideEffects, setSideEffects] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSubmit = () => {
    if (!selectedProductId || !amount) {
      Alert.alert('Missing Information', 'Please select a product and enter the dose amount.');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid dose amount.');
      return;
    }

    // Check if there's a scheduled dose within today's calendar day (12:00 AM - 11:59 PM) for this product
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    
    const upcomingDoses = scheduledDoses.filter(dose => {
      if (dose.productId !== selectedProductId || dose.completed) {
        return false;
      }
      
      const doseDateTime = parseISO(`${dose.scheduledDate}T${dose.scheduledTime}:00`);
      return isWithinInterval(doseDateTime, { start: todayStart, end: todayEnd });
    });

    // Sort by date to get the next scheduled dose
    upcomingDoses.sort((a, b) => {
      const dateA = parseISO(`${a.scheduledDate}T${a.scheduledTime}:00`);
      const dateB = parseISO(`${b.scheduledDate}T${b.scheduledTime}:00`);
      return dateA.getTime() - dateB.getTime();
    });

    const nextScheduledDose = upcomingDoses[0];

    if (nextScheduledDose) {
      // There's a scheduled dose today - prompt the user
      const doseDateTime = parseISO(`${nextScheduledDose.scheduledDate}T${nextScheduledDose.scheduledTime}:00`);
      const hoursUntil = differenceInHours(doseDateTime, now);
      const timeDisplay = nextScheduledDose.timeOfDay || nextScheduledDose.scheduledTime;
      
      Alert.alert(
        'Scheduled Dose Detected',
        `You have a dose of ${selectedProduct?.name} scheduled for ${timeDisplay} today${hoursUntil > 0 ? ` (in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''})` : ''}.\n\nDoes this dose replace the scheduled dose, or is it an additional dose?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Additional Dose',
            onPress: () => checkInventoryAndSave(amountNum, null),
          },
          {
            text: 'Replace Scheduled',
            onPress: () => checkInventoryAndSave(amountNum, nextScheduledDose.id),
            style: 'default',
          },
        ],
        { cancelable: true }
      );
    } else {
      // No scheduled dose today - proceed normally
      checkInventoryAndSave(amountNum, null);
    }
  };

  const checkInventoryAndSave = (amountNum: number, scheduledDoseIdToReplace: string | null) => {
    // Check inventory
    const inv = inventory.find(i => i.productId === selectedProductId);
    if (inv && inv.quantity < amountNum) {
      Alert.alert(
        'Low Stock Warning',
        `Current stock: ${inv.quantity}mg. You're logging ${amountNum}mg. Continue anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => saveDoseLog(amountNum, inv, scheduledDoseIdToReplace) },
        ]
      );
      return;
    }

    saveDoseLog(amountNum, inv, scheduledDoseIdToReplace);
  };

  const saveDoseLog = async (amountNum: number, inv: any, scheduledDoseIdToReplace: string | null) => {
    setIsSaving(true);

    try {
      // Simulate Firebase save delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const log: DoseLog = {
        id: Date.now().toString(),
        productId: selectedProductId,
        userId: 'user-1',
        date,
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        amount: amountNum,
        route,
        site: site || undefined,
        sideEffects: sideEffects || undefined,
        createdAt: new Date(),
      };

      addDoseLog(log);

      // Update inventory
      if (inv) {
        updateInventory({
          ...inv,
          quantity: inv.quantity - amountNum,
          lastUpdated: new Date(),
        });
      }

      // If replacing a scheduled dose, mark it as completed
      if (scheduledDoseIdToReplace) {
        console.log('Marking scheduled dose as completed:', scheduledDoseIdToReplace);
        markDoseAsCompleted(scheduledDoseIdToReplace);
      }

      setIsSaving(false);
      setShowSuccessModal(true);

      // Auto-dismiss after 2.5 seconds and navigate to dashboard
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push('/(tabs)/(home)/dashboard');
      }, 2500);
    } catch (error) {
      console.error('Error saving dose log:', error);
      setIsSaving(false);
      setErrorMessage('Failed to log dose. Please try again.');
      setShowErrorModal(true);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.push('/(tabs)/(home)/dashboard');
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Log Dose',
          headerShown: true,
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView style={commonStyles.content} contentContainerStyle={commonStyles.scrollContent}>
          {/* Product Selection */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Product *</Text>
            <View style={styles.pickerContainer}>
              {products.map(product => (
                <Pressable
                  key={product.id}
                  style={[
                    styles.pickerOption,
                    selectedProductId === product.id && styles.pickerOptionSelected,
                  ]}
                  onPress={() => setSelectedProductId(product.id)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedProductId === product.id && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {product.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Date */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Date *</Text>
            <Pressable 
              style={styles.dateButton} 
              onPress={() => setShowDatePicker(true)}
              disabled={isSaving}
            >
              <Text style={styles.dateButtonText}>
                {date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDate(selectedDate);
                }}
                textColor={colors.text}
                themeVariant="light"
              />
            )}
          </View>

          {/* Time */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Time *</Text>
            <Pressable 
              style={styles.dateButton} 
              onPress={() => setShowTimePicker(true)}
              disabled={isSaving}
            >
              <Text style={styles.dateButtonText}>
                {time.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </Pressable>
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedTime) => {
                  setShowTimePicker(Platform.OS === 'ios');
                  if (selectedTime) setTime(selectedTime);
                }}
                textColor={colors.text}
                themeVariant="light"
              />
            )}
          </View>

          {/* Amount */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Amount (mg) *</Text>
            <TextInput
              style={commonStyles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder={selectedProduct ? `${selectedProduct.doseMg}` : 'Enter amount'}
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
              editable={!isSaving}
            />
          </View>

          {/* Route */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Route of Administration *</Text>
            <View style={styles.routeGrid}>
              {ROUTES.map(r => (
                <Pressable
                  key={r}
                  style={[
                    styles.routeOption,
                    route === r && styles.routeOptionSelected,
                  ]}
                  onPress={() => setRoute(r)}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.routeOptionText,
                      route === r && styles.routeOptionTextSelected,
                    ]}
                  >
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Site */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Injection Site (optional)</Text>
            <TextInput
              style={commonStyles.input}
              value={site}
              onChangeText={setSite}
              placeholder="e.g., Left abdomen, Right thigh"
              placeholderTextColor={colors.textSecondary}
              editable={!isSaving}
            />
          </View>

          {/* Side Effects */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Side Effects / Notes (optional)</Text>
            <TextInput
              style={commonStyles.inputMultiline}
              value={sideEffects}
              onChangeText={setSideEffects}
              placeholder="Any side effects or notes..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              editable={!isSaving}
            />
          </View>

          {/* Submit Button */}
          <Pressable 
            style={[buttonStyles.primary, isSaving && { opacity: 0.6 }]} 
            onPress={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={buttonStyles.buttonText}>Log Dose</Text>
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

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="fade"
          onRequestClose={handleCloseSuccessModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModalContent}>
              <View style={styles.successIconContainer}>
                <IconSymbol name="checkmark.circle.fill" size={80} color={colors.text} />
              </View>
              <Text style={styles.successModalTitle}>Dose logged successfully!</Text>
              <Pressable style={styles.successModalButton} onPress={handleCloseSuccessModal}>
                <Text style={styles.successModalButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal
          visible={showErrorModal}
          transparent
          animationType="fade"
          onRequestClose={handleCloseErrorModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.errorModalContent}>
              <View style={styles.errorIconContainer}>
                <IconSymbol name="xmark.circle.fill" size={80} color={colors.text} />
              </View>
              <Text style={styles.errorModalTitle}>Error</Text>
              <Text style={styles.errorModalMessage}>{errorMessage}</Text>
              <Pressable style={styles.errorModalButton} onPress={handleCloseErrorModal}>
                <Text style={styles.errorModalButtonText}>Try Again</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    gap: 8,
  },
  pickerOption: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  pickerOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  pickerOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerOptionTextSelected: {
    fontWeight: '600',
    color: colors.primary,
  },
  dateButton: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  routeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  routeOption: {
    backgroundColor: colors.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  routeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  routeOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  routeOptionTextSelected: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: colors.success,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  successModalButton: {
    backgroundColor: colors.text,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 120,
  },
  successModalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'center',
  },
  errorModalContent: {
    backgroundColor: colors.alert,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorModalMessage: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  errorModalButton: {
    backgroundColor: colors.text,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 120,
  },
  errorModalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.alert,
    textAlign: 'center',
  },
});
