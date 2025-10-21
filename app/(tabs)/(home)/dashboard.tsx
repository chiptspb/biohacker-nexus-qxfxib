
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import { DoseDue, LowStockAlert } from '@/types';
import PremiumModal from '@/components/PremiumModal';

export default function DashboardScreen() {
  const { user, products, inventory, doseLogs, isPremium, canAddProduct } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app, sync with backend
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate doses due today
  const dosesDue = useMemo((): DoseDue[] => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return products.map(product => {
      // Check if dose was already logged today
      const loggedToday = doseLogs.some(log => {
        const logDate = new Date(log.date).toISOString().split('T')[0];
        return log.productId === product.id && logDate === todayStr;
      });

      if (loggedToday) return null;

      // Determine if dose is due based on frequency
      let isDue = false;
      let scheduledTime = '09:00';

      switch (product.frequency) {
        case 'Daily':
          isDue = true;
          break;
        case 'Every Other Day':
          isDue = today.getDate() % 2 === 0;
          break;
        case 'Weekly':
          isDue = today.getDay() === 1; // Monday
          break;
        default:
          isDue = false;
      }

      if (!isDue) return null;

      return {
        productId: product.id,
        productName: product.name,
        doseMg: product.doseMg,
        route: product.route,
        scheduledTime,
        isOverdue: false,
      };
    }).filter(Boolean) as DoseDue[];
  }, [products, doseLogs]);

  // Calculate low stock alerts
  const lowStockAlerts = useMemo((): LowStockAlert[] => {
    return products.map(product => {
      const inv = inventory.find(i => i.productId === product.id);
      if (!inv) return null;

      // Calculate doses per month based on frequency
      let dosesPerMonth = 0;
      switch (product.frequency) {
        case 'Daily':
          dosesPerMonth = 30;
          break;
        case 'Every Other Day':
          dosesPerMonth = 15;
          break;
        case 'Weekly':
          dosesPerMonth = 4;
          break;
        case 'Bi-Weekly':
          dosesPerMonth = 2;
          break;
        case 'Monthly':
          dosesPerMonth = 1;
          break;
        default:
          dosesPerMonth = 0;
      }

      const totalDoseMg = product.doseMg * dosesPerMonth;
      const monthsSupply = totalDoseMg > 0 ? inv.quantity / totalDoseMg : 0;
      const daysRemaining = monthsSupply * 30;

      if (monthsSupply < 0.5) {
        return {
          productId: product.id,
          productName: product.name,
          currentStock: inv.quantity,
          daysRemaining: Math.floor(daysRemaining),
          monthsSupply,
        };
      }

      return null;
    }).filter(Boolean) as LowStockAlert[];
  }, [products, inventory]);

  const handleLogDose = () => {
    if (products.length === 0) {
      Alert.alert('No Products', 'Add a product first to log doses.');
      return;
    }
    router.push('/(tabs)/(home)/log-dose');
  };

  const handleUpdateInventory = () => {
    if (products.length === 0) {
      Alert.alert('No Products', 'Add a product first to manage inventory.');
      return;
    }
    router.push('/(tabs)/inventory');
  };

  const handleManageProtocols = () => {
    router.push('/(tabs)/medications');
  };

  const handleUpgradePremium = () => {
    Alert.alert(
      'Premium Upgrade',
      'In-app purchases will be available in the production version. For now, enjoy exploring the app!',
      [{ text: 'OK' }]
    );
    setShowPremiumModal(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Dashboard',
          headerShown: true,
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView
          style={commonStyles.content}
          contentContainerStyle={commonStyles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Disclaimer Banner */}
          <View style={styles.disclaimerBanner}>
            <IconSymbol name="exclamationmark.triangle" size={16} color={colors.highlight} />
            <Text style={styles.disclaimerText}>Not medical advice. Consult your doctor.</Text>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.summaryNumber}>{products.length}</Text>
              <Text style={styles.summaryLabel}>Products</Text>
              {!isPremium && (
                <Text style={styles.summarySubtext}>2 max (free)</Text>
              )}
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.success }]}>
              <Text style={styles.summaryNumber}>{dosesDue.length}</Text>
              <Text style={styles.summaryLabel}>Doses Due</Text>
              <Text style={styles.summarySubtext}>Today</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.alert }]}>
              <Text style={styles.summaryNumber}>{lowStockAlerts.length}</Text>
              <Text style={styles.summaryLabel}>Low Stock</Text>
              <Text style={styles.summarySubtext}>Alerts</Text>
            </View>
          </View>

          {/* Doses Due Today */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>📅 Doses Due Today</Text>
            {dosesDue.length === 0 ? (
              <View style={styles.emptyCard}>
                <IconSymbol name="checkmark.circle" size={32} color={colors.success} />
                <Text style={styles.emptyText}>All caught up! No doses due today.</Text>
              </View>
            ) : (
              dosesDue.map(dose => (
                <View key={dose.productId} style={commonStyles.card}>
                  <View style={commonStyles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={commonStyles.cardTitle}>{dose.productName}</Text>
                      <Text style={commonStyles.cardSubtitle}>
                        {dose.doseMg}mg • {dose.route} • {dose.scheduledTime}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                      <Text style={styles.statusText}>Due</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Low Stock Alerts */}
          {lowStockAlerts.length > 0 && (
            <View style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>⚠️ Low Stock Alerts</Text>
              {lowStockAlerts.map(alert => (
                <View key={alert.productId} style={[commonStyles.card, styles.alertCard]}>
                  <View style={commonStyles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={commonStyles.cardTitle}>{alert.productName}</Text>
                      <Text style={[commonStyles.cardSubtitle, { color: colors.alert }]}>
                        {alert.currentStock}mg remaining • ~{alert.daysRemaining} days left
                      </Text>
                    </View>
                    <IconSymbol name="exclamationmark.triangle.fill" size={24} color={colors.alert} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Quick Actions */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>⚡ Quick Actions</Text>
            
            <Pressable style={[buttonStyles.primary, { marginBottom: 12 }]} onPress={handleLogDose}>
              <View style={styles.buttonContent}>
                <IconSymbol name="plus.circle.fill" size={20} color={colors.text} />
                <Text style={[buttonStyles.buttonText, { marginLeft: 8 }]}>Log Dose</Text>
              </View>
            </Pressable>

            <Pressable style={[buttonStyles.highlight, { marginBottom: 12 }]} onPress={handleUpdateInventory}>
              <View style={styles.buttonContent}>
                <IconSymbol name="cube.box.fill" size={20} color={colors.text} />
                <Text style={[buttonStyles.buttonText, { marginLeft: 8 }]}>Update Inventory</Text>
              </View>
            </Pressable>

            <Pressable style={buttonStyles.success} onPress={handleManageProtocols}>
              <View style={styles.buttonContent}>
                <IconSymbol name="list.bullet.clipboard" size={20} color={colors.text} />
                <Text style={[buttonStyles.buttonText, { marginLeft: 8 }]}>Manage Protocols</Text>
              </View>
            </Pressable>
          </View>

          {/* Premium Upsell for Free Users */}
          {!isPremium && (
            <Pressable style={styles.premiumBanner} onPress={() => setShowPremiumModal(true)}>
              <IconSymbol name="star.fill" size={24} color={colors.highlight} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumSubtext}>
                  Unlock unlimited products, advanced features, and more!
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </ScrollView>

        <PremiumModal
          visible={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onUpgrade={handleUpgradePremium}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.highlight,
  },
  disclaimerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  alertCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.alert,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  premiumSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
