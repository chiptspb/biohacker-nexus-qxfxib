
import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function PremiumModal({ visible, onClose, onUpgrade }: PremiumModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
          </Pressable>

          <View style={styles.header}>
            <IconSymbol name="star.fill" size={64} color={colors.highlight} />
            <Text style={styles.title}>Upgrade to Premium</Text>
            <Text style={styles.subtitle}>Unlock unlimited tracking</Text>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.limitBanner}>
              <IconSymbol name="exclamationmark.circle.fill" size={20} color={colors.highlight} />
              <Text style={styles.limitText}>
                Free tier limits 1 medication—upgrade for all.
              </Text>
            </View>

            <View style={styles.feature}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              <Text style={styles.featureText}>Unlimited products & protocols</Text>
            </View>

            <View style={styles.feature}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              <Text style={styles.featureText}>Advanced inventory tracking</Text>
            </View>

            <View style={styles.feature}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              <Text style={styles.featureText}>Barcode scanning (coming soon)</Text>
            </View>

            <View style={styles.feature}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              <Text style={styles.featureText}>Export reports (PDF/CSV)</Text>
            </View>

            <View style={styles.feature}>
              <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              <Text style={styles.featureText}>Priority support</Text>
            </View>

            <View style={styles.priceBox}>
              <Text style={styles.price}>$2.99</Text>
              <Text style={styles.priceSubtext}>per month</Text>
              <Text style={styles.priceDetail}>Upgrade to track unlimited medications</Text>
            </View>

            <Text style={styles.disclaimer}>
              Cancel anytime. No commitments. Your data stays private and secure.
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={buttonStyles.primary} onPress={onUpgrade}>
              <Text style={buttonStyles.buttonText}>Upgrade Now</Text>
            </Pressable>
            <Pressable style={styles.laterButton} onPress={onClose}>
              <Text style={styles.laterText}>Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.highlight,
  },
  limitText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  priceBox: {
    alignItems: 'center',
    marginVertical: 24,
    padding: 24,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  price: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
  },
  priceSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  priceDetail: {
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  laterText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
