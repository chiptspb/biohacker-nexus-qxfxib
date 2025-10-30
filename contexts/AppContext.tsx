
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Product, Inventory, DoseLog, ScheduledDose } from '@/types';
import iapService from '@/services/iapService';

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  inventory: Inventory[];
  setInventory: (inventory: Inventory[]) => void;
  doseLogs: DoseLog[];
  setDoseLogs: (logs: DoseLog[]) => void;
  scheduledDoses: ScheduledDose[];
  setScheduledDoses: (doses: ScheduledDose[]) => void;
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
  addScheduledDoses: (doses: ScheduledDose[]) => void;
  replaceScheduledDosesForProduct: (productId: string, doses: ScheduledDose[]) => void;
  markDoseAsCompleted: (doseId: string) => void;
  canAddProduct: () => boolean;
  checkPremiumStatus: () => Promise<void>;
  updatePremiumStatus: (isPremium: boolean) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: '@biohacker_user',
  PRODUCTS: '@biohacker_products',
  INVENTORY: '@biohacker_inventory',
  DOSE_LOGS: '@biohacker_dose_logs',
  SCHEDULED_DOSES: '@biohacker_scheduled_doses',
  DISCLAIMER: '@biohacker_disclaimer',
  ONBOARDING: '@biohacker_onboarding',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [scheduledDoses, setScheduledDoses] = useState<ScheduledDose[]>([]);
  const [hasSeenDisclaimer, setHasSeenDisclaimer] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isPremium = user?.isPremium || false;

  // Initialize IAP service on mount
  useEffect(() => {
    const initIAP = async () => {
      try {
        await iapService.initialize();
        console.log('IAP service initialized in AppContext');
      } catch (error) {
        console.error('Failed to initialize IAP service:', error);
      }
    };

    initIAP();

    // Cleanup on unmount
    return () => {
      iapService.endConnection();
    };
  }, []);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        userData,
        productsData,
        inventoryData,
        doseLogsData,
        scheduledDosesData,
        disclaimerData,
        onboardingData,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER),
        AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
        AsyncStorage.getItem(STORAGE_KEYS.INVENTORY),
        AsyncStorage.getItem(STORAGE_KEYS.DOSE_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_DOSES),
        AsyncStorage.getItem(STORAGE_KEYS.DISCLAIMER),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING),
      ]);

      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Check subscription status on app launch
        if (parsedUser) {
          checkPremiumStatusInternal(parsedUser);
        }
      }
      if (productsData) setProducts(JSON.parse(productsData));
      if (inventoryData) setInventory(JSON.parse(inventoryData));
      if (doseLogsData) setDoseLogs(JSON.parse(doseLogsData));
      if (scheduledDosesData) {
        const doses = JSON.parse(scheduledDosesData);
        console.log('Loaded scheduled doses from storage:', doses.length);
        setScheduledDoses(doses);
      }
      if (disclaimerData) setHasSeenDisclaimer(JSON.parse(disclaimerData));
      if (onboardingData) setHasCompletedOnboarding(JSON.parse(onboardingData));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPremiumStatusInternal = async (currentUser: UserProfile) => {
    try {
      const hasSubscription = await iapService.checkSubscriptionStatus(true);
      console.log('Subscription status check:', hasSubscription);
      
      if (hasSubscription !== currentUser.isPremium) {
        console.log('Updating premium status to:', hasSubscription);
        const updatedUser = { ...currentUser, isPremium: hasSubscription };
        setUser(updatedUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const checkPremiumStatus = async () => {
    if (user) {
      await checkPremiumStatusInternal(user);
    }
  };

  const updatePremiumStatus = async (newIsPremium: boolean) => {
    if (user) {
      console.log('Updating premium status to:', newIsPremium);
      const updatedUser = { ...user, isPremium: newIsPremium };
      setUser(updatedUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  };

  const saveData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)),
        AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)),
        AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory)),
        AsyncStorage.setItem(STORAGE_KEYS.DOSE_LOGS, JSON.stringify(doseLogs)),
        AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_DOSES, JSON.stringify(scheduledDoses)),
        AsyncStorage.setItem(STORAGE_KEYS.DISCLAIMER, JSON.stringify(hasSeenDisclaimer)),
        AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(hasCompletedOnboarding)),
      ]);
      console.log('Saved scheduled doses to storage:', scheduledDoses.length);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [user, products, inventory, doseLogs, scheduledDoses, hasSeenDisclaimer, hasCompletedOnboarding]);

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    if (!isLoading && user) {
      saveData();
    }
  }, [isLoading, user, saveData]);

  const addProduct = (product: Product) => {
    console.log('Adding product:', product.name);
    setProducts([...products, product]);
  };

  const updateProduct = (product: Product) => {
    console.log('Updating product:', product.name);
    setProducts(products.map(p => p.id === product.id ? product : p));
  };

  const deleteProduct = (productId: string) => {
    console.log('Deleting product:', productId);
    setProducts(products.filter(p => p.id !== productId));
    setInventory(inventory.filter(i => i.productId !== productId));
    setDoseLogs(doseLogs.filter(l => l.productId !== productId));
    setScheduledDoses(scheduledDoses.filter(d => d.productId !== productId));
  };

  const addDoseLog = (log: DoseLog) => {
    console.log('Adding dose log for product:', log.productId);
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

  const addScheduledDoses = (doses: ScheduledDose[]) => {
    console.log('Adding scheduled doses:', doses.length);
    setScheduledDoses(prevDoses => {
      const newDoses = [...prevDoses, ...doses];
      console.log('Total scheduled doses after adding:', newDoses.length);
      return newDoses;
    });
  };

  const replaceScheduledDosesForProduct = (productId: string, doses: ScheduledDose[]) => {
    console.log('Replacing scheduled doses for product:', productId, 'with', doses.length, 'new doses');
    setScheduledDoses(prevDoses => {
      // Keep doses from other products
      const otherProductDoses = prevDoses.filter(d => d.productId !== productId);
      const newDoses = [...otherProductDoses, ...doses];
      console.log('Total scheduled doses after replacement:', newDoses.length);
      return newDoses;
    });
  };

  const markDoseAsCompleted = (doseId: string) => {
    console.log('Marking dose as completed:', doseId);
    setScheduledDoses(prevDoses => {
      const updatedDoses = prevDoses.map(dose => 
        dose.id === doseId ? { ...dose, completed: true } : dose
      );
      const completedDose = updatedDoses.find(d => d.id === doseId);
      if (completedDose) {
        console.log('Dose marked as completed:', completedDose.productName, completedDose.scheduledDate);
      }
      return updatedDoses;
    });
  };

  const canAddProduct = () => {
    if (isPremium) return true;
    return products.length < 1;
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.PRODUCTS,
        STORAGE_KEYS.INVENTORY,
        STORAGE_KEYS.DOSE_LOGS,
        STORAGE_KEYS.SCHEDULED_DOSES,
        STORAGE_KEYS.DISCLAIMER,
        STORAGE_KEYS.ONBOARDING,
      ]);
      setUser(null);
      setProducts([]);
      setInventory([]);
      setDoseLogs([]);
      setScheduledDoses([]);
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
        scheduledDoses,
        setScheduledDoses,
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
        addScheduledDoses,
        replaceScheduledDosesForProduct,
        markDoseAsCompleted,
        canAddProduct,
        checkPremiumStatus,
        updatePremiumStatus,
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
