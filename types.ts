
export enum PeriodType {
  DAILY = 'Diária',
  WEEKLY = 'Semanal',
  BIWEEKLY = 'Quinzenal',
  MONTHLY = 'Mensal'
}

export enum PaymentMethod {
  PIX = 'Pix',
  CREDIT_CARD = 'Cartão de Crédito',
  DEBIT_CARD = 'Cartão de Débito',
  CASH = 'Dinheiro',
  BOLETO = 'Boleto',
  UNDEFINED = 'A definir'
}

export enum PaymentTiming {
  ON_DELIVERY = 'Na Entrega',
  ON_RETURN = 'Na Devolução',
  HALF_HALF = '50% Entrada / 50% Final',
  MONTHLY_INVOICE = 'Faturamento Mensal'
}

export enum DeliveryMethod {
  DELIVERY = 'Entrega no Local',
  PICKUP = 'Retirada na Loja'
}

export type EquipmentIcon = 'scaffold' | 'ladder' | 'mixer' | 'drill' | 'box' | 'cone' | 'helmet' | 'truck';

export interface Equipment {
  id: string;
  name: string;
  category: string;
  stockTotal: number;
  stockRented: number;
  priceDaily: number;
  priceWeekly: number;
  priceBiweekly: number;
  priceMonthly: number;
  imageUrl?: string;
  icon: EquipmentIcon;
}

export interface Customer {
  id: string;
  name: string;
  document: string; // CPF or CNPJ
  phone: string;
  address: string;
  email: string;
  password?: string; // For login access
  birthDate?: string; // New field for CRM
  notes?: string;
}

export interface CustomerRanking extends Customer {
    totalRevenue: number;
    rentalCount: number;
}

export enum RentalStatus {
  DRAFT = 'Rascunho',
  WAITING_CLIENT_SELECTION = 'Aguardando Cliente', 
  PENDING_APPROVAL = 'Em Análise', 
  PENDING_DELIVERY = 'A Entregar', 
  ACTIVE = 'Em Locação',
  RETURNED = 'Devolvido',
  LATE = 'Atrasado',
  CANCELLED = 'Cancelado'
}

export interface RentalItem {
  equipmentId: string;
  quantity: number;
  priceAtTime: number; 
  totalItemPrice: number;
}

export interface SignatureMetadata {
  ip: string;
  userAgent: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  locationString?: string;
}

export interface RentalOrder {
  id: string;
  contractNumber: string;
  customerId: string;
  status: RentalStatus;
  items: RentalItem[];
  startDate: string;
  endDate: string; 
  periodType?: PeriodType; 
  freightCost: number;
  discount: number;
  subTotal: number;
  totalValue: number;
  paymentMethod: PaymentMethod;
  paymentTiming: PaymentTiming;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
  notes?: string;
  signature?: string; 
  signatureMetadata?: SignatureMetadata; 
  createdAt: string;
}

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
}

export interface AppSettings {
  companyName: string;
  companyDocument: string; 
  companyAddress: string;
  companyPhone: string;
  logoUrl: string;
  adminPassword: string; 
  firebaseConfig?: FirebaseConfig; 
}

export type Role = 'admin' | 'client';

export interface User {
    id: string;
    name: string;
    role: Role;
    customerId?: string; 
}

export interface SystemData {
  rentals: RentalOrder[];
  equipment: Equipment[];
  customers: Customer[];
  settings: AppSettings;
  backupDate: string;
}

export interface PortalPayload {
    rental: RentalOrder;
    customer: Customer;
    equipmentList: Equipment[]; 
    settings: AppSettings;
}

export type ViewState = 'landing' | 'login' | 'dashboard' | 'inventory' | 'customers' | 'rentals' | 'quotes' | 'new-rental' | 'customer_portal' | 'client_dashboard' | 'settings';
