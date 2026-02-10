
export type UserRole = 'ADMIN' | 'CLIENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Address {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string; // CEP
  complement?: string;
  reference?: string;
}

export interface CompanySettings {
  id?: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Client extends Address {
  id: string;
  name: string; // Razão social or Name
  document: string; // CPF or CNPJ
  phone: string;
  email: string;
}

export interface Equipment {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  unit: string;
  priceDaily: number;
  priceWeekly: number;
  priceBiWeekly: number;
  priceMonthly: number;
  stockTotal: number;
  stockRented: number;
  stockReserved: number;
  active: boolean;
}

export enum OrderStatus {
  QUOTATION = 'ORCAMENTO',
  PENDING = 'EM_SEPARACAO',
  IN_TRANSIT = 'EM_ROTA',
  DELIVERED = 'ENTREGUE',
  COMPLETED = 'FINALIZADO',
  CANCELLED = 'CANCELADO'
}

export type OrderType = 'PEDIDO' | 'ORCAMENTO';

export interface OrderItem {
  id?: string;
  equipmentId: string;
  equipmentName?: string; // Cache name for display
  quantity: number;
  priceSnapshot: number;
}

export interface Order extends Address {
  id: string;
  type: OrderType;
  clientId: string;
  clientName: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  deliveryDate: string;
  returnDate: string;
  shippingCost: number;
  totalAmount: number;
  billingPeriod: 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL';
  paymentMethod: 'PIX' | 'CARTAO' | 'DINHEIRO' | 'BOLETO' | 'FATURADO';
  observations?: string;
  signatureUrl?: string;
}

export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  monthlyRevenue: number;
  totalClients: number;
}
