
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';

export default function ProductDetailsScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const { products, doseLogs, inventory } = useApp();

  const product = products.find(p => p.id === productId);
  const logs = doseLogs.filter(log => log.productId === productId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const inv = inventory.find(i => i.productId === productId);

  if (!product) {
    return (
      <View style={commonStyles.centerContent}>
        <Text style={commonStyles.text}>Product not found</Text>
      </View>
    );
  }

  const handleEditProduct = () => {
    router.push({
      pathname: '/(tabs)/edit-product',
      params: { productId },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: product.name,
          headerShown: true,
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView style={commonStyles.content} contentContainerStyle={commonStyles.scrollContent}>
          {/* Product Info Card */}
          <View style={commonStyles.card}>
            <Text style={commonStyles.cardTitle}>{product.name}</Text>
            {product.category && (
              <View style={[styles.badge, { backgroundColor: colors.primary + '30' }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {product.category}
                </Text>
              </View>
            )}

            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Dose</Text>
                <Text style={styles.detailValue}>{product.doseMg}mg</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Route</Text>
                <Text style={styles.detailValue}>{product.route}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Frequency</Text>
                <Text style={styles.detailValue}>{product.frequency}</Text>
              </View>
            </View>

            {product.schedule && (
              <View style={styles.scheduleBox}>
                <IconSymbol name="clock" size={16} color={colors.textSecondary} />
                <Text style={styles.scheduleText}>{product.schedule}</Text>
              </View>
            )}

            {product.notes && (
              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>{product.notes}</Text>
              </View>
            )}

            <Pressable style={[buttonStyles.outline, { marginTop: 16 }]} onPress={handleEditProduct}>
              <Text style={buttonStyles.buttonTextOutline}>Edit Product</Text>
            </Pressable>
          </View>

          {/* Inventory Status */}
          {inv && (
            <View style={commonStyles.card}>
              <Text style={commonStyles.cardTitle}>Current Inventory</Text>
              <View style={styles.inventoryGrid}>
                <View style={styles.inventoryItem}>
                  <Text style={styles.inventoryLabel}>Stock</Text>
                  <Text style={styles.inventoryValue}>{inv.quantity} {inv.unit}</Text>
                </View>
                {inv.lotNumber && (
                  <View style={styles.inventoryItem}>
                    <Text style={styles.inventoryLabel}>Lot #</Text>
                    <Text style={styles.inventoryValue}>{inv.lotNumber}</Text>
                  </View>
                )}
              </View>
              {inv.storage && (
                <View style={styles.storageBox}>
                  <IconSymbol name="snowflake" size={16} color={colors.textSecondary} />
                  <Text style={styles.storageText}>{inv.storage}</Text>
                </View>
              )}
            </View>
          )}

          {/* Dose History */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>
              Dose History ({logs.length} total)
            </Text>
            {logs.length === 0 ? (
              <View style={styles.emptyState}>
                <IconSymbol name="chart.bar" size={32} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No doses logged yet</Text>
              </View>
            ) : (
              logs.slice(0, 10).map(log => (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <Text style={styles.logDate}>
                      {new Date(log.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.logTime}>{log.time}</Text>
                  </View>
                  <View style={styles.logDetails}>
                    <Text style={styles.logAmount}>{log.amount}mg • {log.route}</Text>
                    {log.site && (
                      <Text style={styles.logSite}>Site: {log.site}</Text>
                    )}
                    {log.sideEffects && (
                      <Text style={styles.logSideEffects}>
                        Side effects: {log.sideEffects}
                      </Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  scheduleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    gap: 8,
  },
  scheduleText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  notesBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  inventoryGrid: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  inventoryItem: {
    flex: 1,
  },
  inventoryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  inventoryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  storageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
    gap: 8,
  },
  storageText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  logCard: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  logTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logDetails: {
    gap: 4,
  },
  logAmount: {
    fontSize: 14,
    color: colors.text,
  },
  logSite: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  logSideEffects: {
    fontSize: 13,
    color: colors.highlight,
    fontStyle: 'italic',
  },
});
