
export type Gender = 'M' | 'F' | 'Other';
export type Units = 'mg' | 'mcg' | 'ml' | 'IU';
export type Route = 'SubQ' | 'IM' | 'Oral' | 'Nasal' | 'Topical' | 'Vaginal';
export type Frequency = 'AM Daily' | 'PM Daily' | 'Daily' | 'Every Other Day' | 'Every 3 Days' | 'Every 4 Days' | 'Every 5 Days' | 'Every 6 Days' | 'Weekly' | 'Bi-Weekly' | 'Monthly';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type MedicationType = 'GLP-1' | 'Other Peptide' | 'Hormone';

export interface UserProfile {
  id: string;
  email: string;
  age?: number;
  gender?: Gender;
  goals?: string;
  units: Units;
  isPremium: boolean;
  createdAt: Date;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  category: string;
  medicationType?: MedicationType;
  doseMg: number;
  frequency: Frequency;
  frequencies?: Frequency[]; // Support multiple frequencies (e.g., both AM Daily and PM Daily)
  route: Route;
  schedule?: string;
  daysOfWeek?: DayOfWeek[];
  startingDate?: string; // ISO date string
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  unit: Units;
  expirationDate?: Date;
  lotNumber?: string;
  storage?: string;
  lastUpdated: Date;
}

export interface DoseLog {
  id: string;
  productId: string;
  userId: string;
  date: Date;
  time: string;
  amount: number;
  route: Route;
  site?: string;
  sideEffects?: string;
  notes?: string;
  createdAt: Date;
}

export interface Protocol {
  id: string;
  productId: string;
  userId: string;
  doseMg: number;
  frequency: Frequency;
  schedule: string;
  startDate: Date;
  endDate?: Date;
  active: boolean;
}

export interface LowStockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  daysRemaining: number;
  monthsSupply: number;
}

export interface DoseDue {
  productId: string;
  productName: string;
  doseMg: number;
  route: Route;
  scheduledTime: string;
  scheduledDate: Date;
  isOverdue: boolean;
  timeOfDay?: 'AM' | 'PM'; // For AM/PM daily doses
}

export interface ScheduledDose {
  id: string;
  productId: string;
  productName: string;
  doseMg: number;
  route: Route;
  scheduledDate: string; // ISO date string
  scheduledTime: string;
  completed: boolean;
  timeOfDay?: 'AM' | 'PM'; // For AM/PM daily doses
}
