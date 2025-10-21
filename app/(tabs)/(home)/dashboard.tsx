
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import { DoseDue, LowStockAlert } from '@/types';
import PremiumModal from '@/components/PremiumModal';
import { parseISO, isAfter, isBefore, addHours } from 'date-fns';

export default function DashboardScreen() {
  const { user, products, inventory, doseLogs, scheduledDoses, isPremium, canAddProduct } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app, sync with backend
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate doses due in next 24 hours
  const dosesDue = useMemo((): DoseDue[] => {
    const now = new Date();
    const next24Hours = addHours(now, 24);
    
    console.log('Filtering doses due:', {
      now: now.toISOString(),
      next24Hours: next24Hours.toISOString(),
      totalScheduledDoses: scheduledDoses.length,
    });
    
    return scheduledDoses
      .filter(dose => {
        if (dose.completed) return false;
        
        // Parse the scheduled date and time
        const doseDateTime = parseISO(`${dose.scheduledDate}T${dose.scheduledTime}:00`);
        
        // Check if dose is within the next 24 hours
        const isInNext24Hours = isBefore(doseDateTime, next24Hours) || doseDateTime.getTime() === next24Hours.getTime();
        
        return isInNext24Hours;
      })
      .map(dose => {
        const doseDateTime = parseISO(`${dose.scheduledDate}T${dose.scheduledTime}:00`);
        const isOverdue = isBefore(doseDateTime, now);
        
        return {
          productId: dose.productId,
          productName: dose.productName,
          doseMg: dose.doseMg,
          route: dose.route,
          scheduledTime: dose.scheduledTime,
          scheduledDate: doseDateTime,
          isOverdue,
        };
      })
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }, [scheduledDoses]);

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
          // If specific days are selected, count them
          if (product.daysOfWeek && product.daysOfWeek.length > 0) {
            dosesPerMonth = product.daysOfWeek.length * 4; // Approximate 4 weeks per month
          } else {
            dosesPerMonth = 4;
          }
          break;
        case 'Bi-Weekly':
          if (product.daysOfWeek && product.daysOfWeek.length > 0) {
            dosesPerMonth = product.daysOfWeek.length * 2; // Approximate 2 doses per month
          } else {
            dosesPerMonth = 2;
          }
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
            <Pressable 
              style={[styles.summaryCard, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/medications')}
            >
              <Text style={styles.summaryNumber}>{products.length}</Text>
              <Text style={styles.summaryLabel}>Products</Text>
              {!isPremium && (
                <Text style={styles.summarySubtext}>2 max (free)</Text>
              )}
            </Pressable>

            <Pressable 
              style={[styles.summaryCard, { backgroundColor: colors.success }]}
              onPress={() => router.push('/(tabs)/(home)/calendar')}
            >
              <Text style={styles.summaryNumber}>{dosesDue.length}</Text>
              <Text style={styles.summaryLabel}>Doses Due</Text>
              <Text style={styles.summarySubtext}>Next 24h</Text>
            </Pressable>

            <Pressable 
              style={[styles.summaryCard, { backgroundColor: colors.alert }]}
              onPress={() => router.push('/(tabs)/inventory')}
            >
              <Text style={styles.summaryNumber}>{lowStockAlerts.length}</Text>
              <Text style={styles.summaryLabel}>Low Stock</Text>
              <Text style={styles.summarySubtext}>Alerts</Text>
            </Pressable>
          </View>

          {/* Doses Due in Next 24 Hours */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>📅 Doses Due (Next 24h)</Text>
            {dosesDue.length === 0 ? (
              <View style={styles.emptyCard}>
                <IconSymbol name="checkmark.circle" size={32} color={colors.success} />
                <Text style={styles.emptyText}>All caught up! No doses due in the next 24 hours.</Text>
              </View>
            ) : (
              <Pressable onPress={() => router.push('/(tabs)/(home)/calendar')}>
                {dosesDue.map((dose, index) => (
                  <View key={`${dose.productId}-${dose.scheduledDate.toISOString()}-${index}`} style={commonStyles.card}>
                    <View style={commonStyles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={commonStyles.cardTitle}>{dose.productName}</Text>
                        <Text style={commonStyles.cardSubtitle}>
                          {dose.doseMg}mg • {dose.route} • {dose.scheduledTime}
                        </Text>
                        <Text style={[commonStyles.cardSubtitle, { fontSize: 12 }]}>
                          {dose.scheduledDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: dose.isOverdue ? colors.alert : colors.success }
                      ]}>
                        <Text style={styles.statusText}>
                          {dose.isOverdue ? 'Overdue' : 'Due'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </Pressable>
            )}
          </View>

          {/* Low Stock Alerts */}
          {lowStockAlerts.length > 0 && (
            <View style={commonStyles.section}>
              <Text style={commonStyles.sectionTitle}>⚠️ Low Stock Alerts</Text>
              <Pressable onPress={() => router.push('/(tabs)/inventory')}>
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
              </Pressable>
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
