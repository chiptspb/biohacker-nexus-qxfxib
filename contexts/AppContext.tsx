
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Product, Inventory, DoseLog } from '@/types';

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  inventory: Inventory[];
  setInventory: (inventory: Inventory[]) => void;
  doseLogs: DoseLog[];
  setDoseLogs: (logs: DoseLog[]) => void;
  isPremium: boolean;
  isLoading: boolean;
  hasSeenDisclaimer: boolean;
  setHasSeenDisclaimer: (seen: boolean) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addDoseLog: (log: DoseLog) => void;
  updateInventory: (inv: Inventory) => void;
  canAddProduct: () => boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: '@biohacker_user',
  PRODUCTS: '@biohacker_products',
  INVENTORY: '@biohacker_inventory',
  DOSE_LOGS: '@biohacker_dose_logs',
  DISCLAIMER: '@biohacker_disclaimer',
  ONBOARDING: '@biohacker_onboarding',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [hasSeenDisclaimer, setHasSeenDisclaimer] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isPremium = user?.isPremium || false;

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    if (!isLoading && user) {
      saveData();
    }
  }, [user, products, inventory, doseLogs, hasSeenDisclaimer, hasCompletedOnboarding]);

  const loadData = async () => {
    try {
      const [
        userData,
        productsData,
        inventoryData,
        doseLogsData,
        disclaimerData,
        onboardingData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
        AsyncStorage.getItem(STORAGE_KEYS.INVENTORY),
        AsyncStorage.getItem(STORAGE_KEYS.DOSE_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.DISCLAIMER),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING),
      ]);

      if (userData) setUser(JSON.parse(userData));
      if (productsData) setProducts(JSON.parse(productsData));
      if (inventoryData) setInventory(JSON.parse(inventoryData));
      if (doseLogsData) setDoseLogs(JSON.parse(doseLogsData));
      if (disclaimerData) setHasSeenDisclaimer(JSON.parse(disclaimerData));
      if (onboardingData) setHasCompletedOnboarding(JSON.parse(onboardingData));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
        AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)),
        AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory)),
        AsyncStorage.setItem(STORAGE_KEYS.DOSE_LOGS, JSON.stringify(doseLogs)),
        AsyncStorage.setItem(STORAGE_KEYS.DISCLAIMER, JSON.stringify(hasSeenDisclaimer)),
        AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(hasCompletedOnboarding)),
      ]);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const addProduct = (product: Product) => {
    setProducts([...products, product]);
  };

  const updateProduct = (product: Product) => {
    setProducts(products.map(p => p.id === product.id ? product : p));
  };

  const deleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
    setInventory(inventory.filter(i => i.productId !== productId));
    setDoseLogs(doseLogs.filter(l => l.productId !== productId));
  };

  const addDoseLog = (log: DoseLog) => {
    setDoseLogs([...doseLogs, log]);
  };

  const updateInventory = (inv: Inventory) => {
    const existingIndex = inventory.findIndex(i => i.productId === inv.productId);
    if (existingIndex >= 0) {
      const newInventory = [...inventory];
      newInventory[existingIndex] = inv;
      setInventory(newInventory);
    } else {
      setInventory([...inventory, inv]);
    }
  };

  const canAddProduct = () => {
    if (isPremium) return true;
    return products.length < 2;
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.PRODUCTS,
        STORAGE_KEYS.INVENTORY,
        STORAGE_KEYS.DOSE_LOGS,
        STORAGE_KEYS.DISCLAIMER,
        STORAGE_KEYS.ONBOARDING,
      ]);
      setUser(null);
      setProducts([]);
      setInventory([]);
      setDoseLogs([]);
      setHasSeenDisclaimer(false);
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        products,
        setProducts,
        inventory,
        setInventory,
        doseLogs,
        setDoseLogs,
        isPremium,
        isLoading,
        hasSeenDisclaimer,
        setHasSeenDisclaimer,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        addProduct,
        updateProduct,
        deleteProduct,
        addDoseLog,
        updateInventory,
        canAddProduct,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
