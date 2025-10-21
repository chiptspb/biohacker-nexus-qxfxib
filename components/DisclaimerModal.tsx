
import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface DisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
}

export default function DisclaimerModal({ visible, onAccept }: DisclaimerModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.highlight} />
          <Text style={styles.title}>Important Medical Disclaimer</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Not Medical Advice</Text>
            <Text style={styles.text}>
              BioHacker Nexus is a tracking tool only. This app does NOT provide medical advice, 
              diagnosis, or treatment recommendations.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👨‍⚕️ Consult Your Doctor</Text>
            <Text style={styles.text}>
              Always consult with a qualified healthcare provider before starting, stopping, or 
              modifying any medication, supplement, or treatment protocol. Your doctor should 
              supervise all aspects of your health regimen.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔬 For Tracking Only</Text>
            <Text style={styles.text}>
              This app is designed to help you track and organize your biohacking protocols. 
              It does not validate safety, efficacy, or appropriateness of any substance or protocol.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚖️ Your Responsibility</Text>
            <Text style={styles.text}>
              You are solely responsible for your health decisions. The developers of this app 
              assume no liability for any health outcomes resulting from use of this application.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔒 Privacy & Security</Text>
            <Text style={styles.text}>
              Your health data is stored locally on your device. We prioritize your privacy, 
              but you should still take appropriate precautions to secure your device.
            </Text>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              By continuing, you acknowledge that you have read and understood this disclaimer, 
              and you agree to use this app at your own risk.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={buttonStyles.primary} onPress={onAccept}>
            <Text style={buttonStyles.buttonText}>I Understand & Accept</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  warningBox: {
    backgroundColor: colors.card,
    borderLeftWidth: 4,
    borderLeftColor: colors.alert,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
