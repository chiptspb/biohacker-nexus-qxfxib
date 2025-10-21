
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Switch } from 'react-native';
import { Stack, router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import { Gender, Units } from '@/types';

const GENDERS: Gender[] = ['M', 'F', 'Other'];
const UNITS: Units[] = ['mg', 'mcg', 'ml', 'IU'];

export default function SettingsScreen() {
  const { user, setUser, isPremium, logout } = useApp();
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [gender, setGender] = useState<Gender>(user?.gender || 'M');
  const [goals, setGoals] = useState(user?.goals || '');
  const [units, setUnits] = useState<Units>(user?.units || 'mg');
  const [darkMode, setDarkMode] = useState(true);

  const handleSaveProfile = () => {
    if (user) {
      const ageNum = age ? parseInt(age) : undefined;
      setUser({
        ...user,
        age: ageNum,
        gender,
        goals: goals.trim() || undefined,
        units,
      });
      Alert.alert('Success', 'Profile updated successfully!');
    }
  };

  const handleUpgradePremium = () => {
    Alert.alert(
      'Premium Upgrade',
      'In-app purchases will be available in the production version. For now, enjoy exploring the app!',
      [{ text: 'OK' }]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Data export (PDF/CSV) will be available in the premium version.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            logout();
            Alert.alert('Account Deleted', 'Your account has been deleted.');
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerShown: true,
        }}
      />
      <View style={commonStyles.container}>
        <ScrollView style={commonStyles.content} contentContainerStyle={commonStyles.scrollContent}>
          {/* Premium Status */}
          <View style={[commonStyles.card, isPremium && styles.premiumCard]}>
            <View style={styles.premiumHeader}>
              <IconSymbol 
                name={isPremium ? 'star.fill' : 'star'} 
                size={32} 
                color={isPremium ? colors.highlight : colors.textSecondary} 
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={commonStyles.cardTitle}>
                  {isPremium ? 'Premium Member' : 'Free Plan'}
                </Text>
                <Text style={commonStyles.cardSubtitle}>
                  {isPremium 
                    ? 'Unlimited products & features' 
                    : 'Limited to 2 products'}
                </Text>
              </View>
            </View>
            {!isPremium && (
              <Pressable style={[buttonStyles.highlight, { marginTop: 12 }]} onPress={handleUpgradePremium}>
                <Text style={buttonStyles.buttonText}>Upgrade to Premium</Text>
              </Pressable>
            )}
          </View>

          {/* Profile Settings */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Profile</Text>

            <View style={styles.inputGroup}>
              <Text style={commonStyles.label}>Email</Text>
              <View style={styles.disabledInput}>
                <Text style={styles.disabledInputText}>{user?.email || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={commonStyles.label}>Age (optional)</Text>
              <TextInput
                style={commonStyles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={commonStyles.label}>Gender</Text>
              <View style={styles.optionsRow}>
                {GENDERS.map(g => (
                  <Pressable
                    key={g}
                    style={[
                      styles.option,
                      gender === g && styles.optionSelected,
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        gender === g && styles.optionTextSelected,
                      ]}
                    >
                      {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Other'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={commonStyles.label}>Preferred Units</Text>
              <View style={styles.optionsRow}>
                {UNITS.map(u => (
                  <Pressable
                    key={u}
                    style={[
                      styles.option,
                      units === u && styles.optionSelected,
                    ]}
                    onPress={() => setUnits(u)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        units === u && styles.optionTextSelected,
                      ]}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={commonStyles.label}>Goals (optional)</Text>
              <TextInput
                style={commonStyles.inputMultiline}
                value={goals}
                onChangeText={setGoals}
                placeholder="What are your biohacking goals?"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>

            <Pressable style={buttonStyles.primary} onPress={handleSaveProfile}>
              <Text style={buttonStyles.buttonText}>Save Profile</Text>
            </Pressable>
          </View>

          {/* App Settings */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>App Settings</Text>

            <View style={styles.settingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingSubtext}>Currently enabled</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.text}
              />
            </View>
          </View>

          {/* Data Management */}
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>Data Management</Text>

            <Pressable style={styles.actionButton} onPress={handleExportData}>
              <IconSymbol name="square.and.arrow.up" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Export Data (PDF/CSV)</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
            </Pressable>

            <Pressable style={styles.actionButton} onPress={() => router.push('/disclaimer-view')}>
              <IconSymbol name="doc.text" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>View Disclaimer</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Danger Zone */}
          <View style={commonStyles.section}>
            <Text style={[commonStyles.sectionTitle, { color: colors.alert }]}>Danger Zone</Text>

            <Pressable style={[styles.actionButton, styles.dangerButton]} onPress={handleDeleteAccount}>
              <IconSymbol name="trash" size={20} color={colors.alert} />
              <Text style={[styles.actionButtonText, { color: colors.alert }]}>Delete Account</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.alert} />
            </Pressable>
          </View>

          {/* App Info */}
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>BioHacker Nexus v1.0.0</Text>
            <Text style={styles.appInfoText}>Made with ❤️ for biohackers</Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  premiumCard: {
    borderWidth: 2,
    borderColor: colors.highlight,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  disabledInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  disabledInputText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  settingSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: colors.alert,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  appInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
