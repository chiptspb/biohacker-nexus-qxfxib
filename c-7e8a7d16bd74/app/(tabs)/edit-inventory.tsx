
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useApp } from '@/contexts/AppContext';
import { Inventory, Units } from '@/types';
import Toast, { ToastType } from '@/components/Toast';

const UNITS: Units[] = ['mg', 'mcg', 'ml', 'IU'];

export default function EditInventoryScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { products, inventory, updateInventory } = useApp();
  
  const product = products.find(p => p.id === productId);
  const existingInv = inventory.find(i => i.productId === productId);

  const [quantity, setQuantity] = useState(existingInv?.quantity.toString() || '');
  const [unit, setUnit] = useState<Units>(existingInv?.unit || 'mg');
  const [lotNumber, setLotNumber] = useState(existingInv?.lotNumber || '');
  const [storage, setStorage] = useState(existingInv?.storage || '');

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

  if (!product) {
    return (
      <View style={commonStyles.centerContent}>
        <Text style={commonStyles.text}>Product not found</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!quantity) {
      showToast('Please enter the quantity.', 'error');
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum < 0) {
      showToast('Please enter a valid quantity.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      // Simulate Firebase save delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const inv: Inventory = {
        id: existingInv?.id || Date.now().toString(),
        productId,
        userId: product.userId,
        quantity: qtyNum,
        unit,
        lotNumber: lotNumber.trim() || undefined,
        storage: storage.trim() || undefined,
        lastUpdated: new Date(),
      };

      updateInventory(inv);

      showToast('Inventory updated successfully!', 'success');
      
      // Navigate to dashboard after short delay to show toast
      setTimeout(() => {
        router.push('/(tabs)/(home)/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Error updating inventory:', error);
      showToast('Failed to update inventory. Please try again.', 'error');
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Edit Inventory',
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
          <View style={styles.productHeader}>
            <Text style={commonStyles.title}>{product.name}</Text>
            <Text style={commonStyles.textSecondary}>
              {product.doseMg}mg per dose • {product.frequency}
            </Text>
          </View>

          <View style={commonStyles.section}>
            <Text style={commonStyles.label}>Quantity *</Text>
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
            <Text style={commonStyles.label}>Lot Number (optional)</Text>
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
            <Text style={commonStyles.label}>Storage Instructions (optional)</Text>
            <TextInput
              style={commonStyles.inputMultiline}
              value={storage}
              onChangeText={setStorage}
              placeholder="e.g., Refrigerate 2-8°C, protect from light"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
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
  productHeader: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
