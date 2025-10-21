
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { Product, Inventory, Frequency, Route, Units } from '@/types';

const FREQUENCIES: Frequency[] = ['Daily', 'Every Other Day', 'Weekly', 'Bi-Weekly', 'Monthly', 'As Needed'];
const ROUTES: Route[] = ['SubQ', 'IM', 'Oral', 'Nasal', 'Topical', 'IV', 'Vaginal'];
const UNITS: Units[] = ['mg', 'mcg', 'ml', 'IU'];

export default function AddProductScreen() {
  const { user, addProduct, updateInventory } = useApp();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [doseMg, setDoseMg] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('Daily');
  const [route, setRoute] = useState<Route>('SubQ');
  const [schedule, setSchedule] = useState('');
  const [notes, setNotes] = useState('');
  
  // Inventory fields
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<Units>('mg');
  const [lotNumber, setLotNumber] = useState('');
  const [storage, setStorage] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !doseMg) {
      Alert.alert('Missing Information', 'Please enter product name and dose amount.');
      return;
    }

    const doseNum = parseFloat(doseMg);
    if (isNaN(doseNum) || doseNum <= 0) {
      Alert.alert('Invalid Dose', 'Please enter a valid dose amount.');
      return;
    }

    const productId = Date.now().toString();

    const product: Product = {
      id: productId,
      userId: user?.id || 'user-1',
      name: name.trim(),
      category: category.trim() || 'General',
      doseMg: doseNum,
      frequency,
      route,
      schedule: schedule.trim() || undefined,
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

    Alert.alert('Success', 'Product added successfully!', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
            />
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Category (optional)</Text>
            <TextInput
              style={commonStyles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., GLP-1, Peptide, TRT"
              placeholderTextColor={colors.textSecondary}
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
            <Text style={commonStyles.label}>Schedule (optional)</Text>
            <TextInput
              style={commonStyles.input}
              value={schedule}
              onChangeText={setSchedule}
              placeholder="e.g., Morning with breakfast"
              placeholderTextColor={colors.textSecondary}
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
            />
          </View>

          {/* Submit Buttons */}
          <Pressable style={buttonStyles.primary} onPress={handleSubmit}>
            <Text style={buttonStyles.buttonText}>Add Product</Text>
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
