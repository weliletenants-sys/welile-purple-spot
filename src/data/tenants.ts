export interface DailyPayment {
  date: string;
  amount: number;
  paid: boolean;
  paidAmount?: number;
  recordedBy?: string;
  recordedAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
}

export interface Guarantor {
  name: string;
  contact: string;
}

export interface Location {
  country: string;
  county: string;
  district: string;
  subcountyOrWard: string;
  cellOrVillage: string;
}

export interface Tenant {
  id: string;
  name: string;
  contact: string;
  address: string;
  status: 'active' | 'pending' | 'review' | 'cleared' | 'overdue';
  paymentStatus: 'paid' | 'pending' | 'overdue' | 'cleared';
  performance: number;
  landlord: string;
  landlordContact: string;
  rentAmount: number;
  registrationFee: number;
  accessFee: number;
  repaymentDays: 30 | 60 | 90;
  dailyPayments: DailyPayment[];
  guarantor1?: Guarantor;
  guarantor2?: Guarantor;
  location?: Location;
  agentName?: string;
  agentPhone?: string;
}

const generateDailyPayments = (days: number): DailyPayment[] => {
  const payments: DailyPayment[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    payments.push({
      date: date.toISOString().split('T')[0],
      amount: 0,
      paid: false,
    });
  }
  return payments;
};

// Helper function to assign random repayment days
const getRandomDays = (): 30 | 60 | 90 => {
  const options = [30, 60, 90];
  return options[Math.floor(Math.random() * options.length)] as 30 | 60 | 90;
};

// Mock tenants array removed - data is now fetched from Supabase database
export const tenants: Tenant[] = [];

export const TOTAL_TENANT_COUNT = 40000000;

export const generatePerformanceScore = (status: string, paymentStatus: string): number => {
  if (status === 'cleared' && paymentStatus === 'cleared') return Math.floor(Math.random() * 10) + 90;
  if (status === 'active' && paymentStatus === 'paid') return Math.floor(Math.random() * 15) + 80;
  if (status === 'overdue' || paymentStatus === 'overdue') return Math.floor(Math.random() * 15) + 65;
  return Math.floor(Math.random() * 20) + 70;
};

// Calculate total repayment amount including fees and access charges
export const calculateRepaymentDetails = (rentAmount: number, repaymentDays: number) => {
  const registrationFee = rentAmount <= 200000 ? 10000 : 20000;
  const months = repaymentDays / 30;
  const accessFeeRate = 0.33;
  const accessFees = rentAmount * (Math.pow(1 + accessFeeRate, months) - 1);
  const totalAmount = rentAmount + registrationFee + accessFees;
  const dailyInstallment = totalAmount / repaymentDays;

  return {
    rentAmount,
    registrationFee,
    accessFees: Math.round(accessFees),
    totalAmount: Math.round(totalAmount),
    dailyInstallment: Math.round(dailyInstallment),
    repaymentDays,
  };
};
