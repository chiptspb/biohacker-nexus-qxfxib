
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';

export default function InventoryScreen() {
  const { products, inventory } = useApp();

  const getMonthsSupply = (productId: string) => {
    const product = products.find(p => p.id === productId);
    const inv = inventory.find(i => i.productId === productId);
    
    if (!product || !inv) return 0;

    // Calculate total doses per month based on all frequencies
    const frequencies = product.frequencies || [product.frequency];
    let dosesPerMonth = 0;
    
    frequencies.forEach(freq => {
      switch (freq) {
        case 'AM Daily':
        case 'PM Daily':
        case 'Daily':
          dosesPerMonth += 30;
          break;
        case 'Every Other Day':
          dosesPerMonth += 15;
          break;
        case 'Every 3 Days':
          dosesPerMonth += 10;
          break;
        case 'Every 4 Days':
          dosesPerMonth += 7.5;
          break;
        case 'Every 5 Days':
          dosesPerMonth += 6;
          break;
        case 'Every 6 Days':
          dosesPerMonth += 5;
          break;
        case 'Weekly':
          if (product.daysOfWeek && product.daysOfWeek.length > 0) {
            dosesPerMonth += product.daysOfWeek.length * 4;
          } else {
            dosesPerMonth += 4;
          }
          break;
        case 'Bi-Weekly':
          if (product.daysOfWeek && product.daysOfWeek.length > 0) {
            dosesPerMonth += product.daysOfWeek.length * 2;
          } else {
            dosesPerMonth += 2;
          }
          break;
        case 'Monthly':
          dosesPerMonth += 1;
          break;
        default:
          break;
      }
    });

    const totalDoseMg = product.doseMg * dosesPerMonth;
    return totalDoseMg > 0 ? inv.quantity / totalDoseMg : 0;
  };

  const handleEditInventory = (productId: string) => {
    router.push({
      pathname: '/(tabs)/edit-inventory',
      params: { productId },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Inventory',
          headerShown: true,
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView style={commonStyles.content} contentContainerStyle={commonStyles.scrollContent}>
          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="cube.box" size={64} color={colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No Inventory</Text>
              <Text style={styles.emptyStateText}>
                Add products first to track your inventory.
              </Text>
            </View>
          ) : (
            <View style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>Stock Levels</Text>
              {products.map(product => {
                const inv = inventory.find(i => i.productId === product.id);
                const monthsSupply = getMonthsSupply(product.id);
                const isLowStock = monthsSupply < 3 && monthsSupply > 0;
                const isOutOfStock = !inv || inv.quantity <= 0;

                return (
                  <Pressable
                    key={product.id}
                    style={[
                      commonStyles.card,
                      isLowStock && styles.lowStockCard,
                      isOutOfStock && styles.outOfStockCard,
                    ]}
                    onPress={() => handleEditInventory(product.id)}
                  >
                    <View style={commonStyles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={commonStyles.cardTitle}>{product.name}</Text>
                        <Text style={commonStyles.cardSubtitle}>
                          {product.doseMg}mg per dose • {product.frequencies?.join(', ') || product.frequency}
                        </Text>
                      </View>
                      <IconSymbol 
                        name="chevron.right" 
                        size={20} 
                        color={colors.textSecondary} 
                      />
                    </View>

                    <View style={styles.inventoryDetails}>
                      <View style={styles.inventoryRow}>
                        <Text style={styles.inventoryLabel}>Current Stock:</Text>
                        <Text style={[
                          styles.inventoryValue,
                          isOutOfStock && { color: colors.alert },
                          isLowStock && { color: colors.highlight },
                        ]}>
                          {inv ? `${inv.quantity} ${inv.unit}` : 'Not set'}
                        </Text>
                      </View>

                      {inv && monthsSupply > 0 && (
                        <View style={styles.inventoryRow}>
                          <Text style={styles.inventoryLabel}>Supply Remaining:</Text>
                          <View style={styles.supplyBadge}>
                            <View style={[
                              styles.supplyIndicator,
                              monthsSupply >= 3 ? { backgroundColor: colors.success } :
                              monthsSupply >= 1 ? { backgroundColor: colors.highlight } :
                              { backgroundColor: colors.alert }
                            ]} />
                            <Text style={[
                              styles.inventoryValue,
                              monthsSupply < 3 && { color: colors.alert },
                            ]}>
                              {monthsSupply.toFixed(1)} months
                            </Text>
                          </View>
                        </View>
                      )}

                      {inv?.lotNumber && (
                        <View style={styles.inventoryRow}>
                          <Text style={styles.inventoryLabel}>Lot #:</Text>
                          <Text style={styles.inventoryValue}>{inv.lotNumber}</Text>
                        </View>
                      )}

                      {inv?.storage && (
                        <View style={styles.inventoryRow}>
                          <Text style={styles.inventoryLabel}>Storage:</Text>
                          <Text style={styles.inventoryValue}>{inv.storage}</Text>
                        </View>
                      )}
                    </View>

                    {isLowStock && (
                      <View style={styles.warningBanner}>
                        <IconSymbol name="exclamationmark.triangle.fill" size={16} color={colors.highlight} />
                        <Text style={styles.warningText}>Low stock - less than 3 months remaining</Text>
                      </View>
                    )}

                    {isOutOfStock && (
                      <View style={[styles.warningBanner, { backgroundColor: colors.alert + '20' }]}>
                        <IconSymbol name="xmark.circle.fill" size={16} color={colors.alert} />
                        <Text style={[styles.warningText, { color: colors.alert }]}>Out of stock</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  lowStockCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.highlight,
  },
  outOfStockCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.alert,
  },
  inventoryDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inventoryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  inventoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  supplyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supplyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight + '20',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.highlight,
    flex: 1,
  },
});
