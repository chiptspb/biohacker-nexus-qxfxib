
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { DoseLog, Route } from '@/types';
import DateTimePicker from '@react-native-community/datetimepicker';

const ROUTES: Route[] = ['SubQ', 'IM', 'Oral', 'Nasal', 'Topical', 'IV', 'Vaginal'];

export default function LogDoseScreen() {
  const { products, inventory, addDoseLog, updateInventory } = useApp();
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [amount, setAmount] = useState('');
  const [route, setRoute] = useState<Route>('SubQ');
  const [site, setSite] = useState('');
  const [sideEffects, setSideEffects] = useState('');

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

    // Check inventory
    const inv = inventory.find(i => i.productId === selectedProductId);
    if (inv && inv.quantity < amountNum) {
      Alert.alert(
        'Low Stock Warning',
        `Current stock: ${inv.quantity}mg. You're logging ${amountNum}mg. Continue anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => saveDoseLog(amountNum, inv) },
        ]
      );
      return;
    }

    saveDoseLog(amountNum, inv);
  };

  const saveDoseLog = (amountNum: number, inv: any) => {
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

    Alert.alert('Success', 'Dose logged successfully!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
            <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
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
              />
            )}
          </View>

          {/* Time */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Time *</Text>
            <Pressable style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
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
            />
          </View>

          {/* Submit Button */}
          <Pressable style={buttonStyles.primary} onPress={handleSubmit}>
            <Text style={buttonStyles.buttonText}>Log Dose</Text>
          </Pressable>

          <Pressable style={[buttonStyles.outline, { marginTop: 12 }]} onPress={() => router.back()}>
            <Text style={buttonStyles.buttonTextOutline}>Cancel</Text>
          </Pressable>
        </ScrollView>
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
});
