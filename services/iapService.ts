// services/iapService.ts
import * as RNIap from 'react-native-iap';
import { MONTHLY_PRODUCT_ID, ANNUAL_PRODUCT_ID } from '@/constants/pricing';

const productIds = [MONTHLY_PRODUCT_ID, ANNUAL_PRODUCT_ID];

let initialized = false;

export async function initIap() {
  if (initialized) return;
  try {
    await RNIap.initConnection();
    initialized = true;
  } catch {}
}

export async function getPriceInfo(): Promise<{ monthly?: string; annual?: string }> {
  try {
    await initIap();
    const subs = await RNIap.getSubscriptions({ skus: productIds });
    const map: Record<string, string> = {};
    subs.forEach(s => {
      if (s.productId && s.localizedPrice) map[s.productId] = s.localizedPrice;
    });
    return {
      monthly: map[MONTHLY_PRODUCT_ID],
      annual: map[ANNUAL_PRODUCT_ID],
    };
  } catch {
    return {};
  }
}

export async function buyMonthly() {
  await initIap();
  return RNIap.requestSubscription({ sku: MONTHLY_PRODUCT_ID });
}

export async function buyAnnual() {
  await initIap();
  return RNIap.requestSubscription({ sku: ANNUAL_PRODUCT_ID });
}

export async function restore() {
  await initIap();
  return RNIap.getAvailablePurchases();
}

export async function hasActiveSub(): Promise<boolean> {
  try {
    await initIap();
    const entitlements = await RNIap.getAvailablePurchases();
    return entitlements?.some(e =>
      e.productId === MONTHLY_PRODUCT_ID || e.productId === ANNUAL_PRODUCT_ID
    ) || false;
  } catch {
    return false;
  }
}
