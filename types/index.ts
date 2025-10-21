
export type Gender = 'M' | 'F' | 'Other';
export type Units = 'mg' | 'mcg' | 'ml' | 'IU';
export type Route = 'SubQ' | 'IM' | 'Oral' | 'Nasal' | 'Topical' | 'Vaginal';
export type Frequency = 'Daily' | 'Every Other Day' | 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'As Needed';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

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
  doseMg: number;
  frequency: Frequency;
  route: Route;
  schedule?: string;
  daysOfWeek?: DayOfWeek[];
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
  isOverdue: boolean;
}
