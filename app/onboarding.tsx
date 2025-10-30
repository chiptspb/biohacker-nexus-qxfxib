
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useApp } from '@/contexts/AppContext';
import DisclaimerModal from '@/components/DisclaimerModal';
import { Gender, Units, UserProfile } from '@/types';

const GENDERS: Gender[] = ['M', 'F', 'Other'];
const UNITS: Units[] = ['mg', 'mcg', 'ml', 'IU'];

export default function OnboardingScreen() {
  const { setUser, setHasSeenDisclaimer, setHasCompletedOnboarding } = useApp();
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [step, setStep] = useState(1);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('M');
  const [goals, setGoals] = useState('');
  const [units, setUnits] = useState<Units>('mg');

  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);
    setHasSeenDisclaimer(true);
  };

  const handleContinue = () => {
    if (step === 1) {
      if (!email.trim()) {
        Alert.alert('Missing Information', 'Please enter your email address.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Create user profile
      const ageNum = age ? parseInt(age) : undefined;
      const user: UserProfile = {
        id: Date.now().toString(),
        email: email.trim(),
        age: ageNum,
        gender,
        goals: goals.trim() || undefined,
        units,
        isPremium: false,
        createdAt: new Date(),
      };
      
      setUser(user);
      setHasCompletedOnboarding(true);
      router.replace('/(tabs)/(home)/dashboard');
    }
  };

  if (showDisclaimer) {
    return <DisclaimerModal visible={showDisclaimer} onAccept={handleAcceptDisclaimer} />;
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView style={commonStyles.content} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <IconSymbol name="heart.text.square.fill" size={64} color={colors.primary} />
          <Text style={styles.title}>Welcome to BioHacker Nexus</Text>
          <Text style={styles.subtitle}>
            {step === 1 
              ? 'Let&apos;s get started with your account' 
              : 'Tell us a bit about yourself'}
          </Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
        </View>

        {/* Step 1: Email */}
        {step === 1 && (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={commonStyles.label}>Email Address *</Text>
              <TextInput
                style={commonStyles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.helperText}>
                We&apos;ll use this to identify your account. No spam, we promise!
              </Text>
            </View>

            <View style={styles.infoBox}>
              <IconSymbol name="lock.shield.fill" size={20} color={colors.success} />
              <Text style={styles.infoText}>
                Your data is stored locally on your device and encrypted for your privacy.
              </Text>
            </View>
          </View>
        )}

        {/* Step 2: Profile */}
        {step === 2 && (
          <View style={styles.formContainer}>
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
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable style={buttonStyles.primary} onPress={handleContinue}>
            <Text style={buttonStyles.buttonText}>
              {step === 1 ? 'Continue' : 'Get Started'}
            </Text>
          </Pressable>

          {step === 2 && (
            <Pressable style={styles.backButton} onPress={() => setStep(1)}>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: colors.primary,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  helperText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
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
  buttonContainer: {
    gap: 12,
  },
  backButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
