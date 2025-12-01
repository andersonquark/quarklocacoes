
import { Equipment, Customer, RentalOrder, RentalStatus, PeriodType, PaymentMethod, PaymentTiming, DeliveryMethod, AppSettings } from './types';

export const LOGO_ICON = "https://i.imgur.com/7Xj7x7M.png";
export const LOGO_FULL = "https://i.imgur.com/u6k6k6k.png"; 

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Quark Locações Ltda',
  companyDocument: '55.113.825/0001-51',
  companyAddress: 'Av. Paulista, 1000 - São Paulo/SP',
  companyPhone: '(11) 99999-9999',
  logoUrl: LOGO_ICON,
  adminPassword: 'admin',
  firebaseConfig: {
      apiKey: "AIzaSyCTw5T2U2ZYtFyYVPtYq2a53jZKb0xq0jQ",
      authDomain: "quarkloc.firebaseapp.com",
      databaseURL: "https://quarkloc-default-rtdb.firebaseio.com",
      projectId: "quarkloc",
      storageBucket: "quarkloc.firebasestorage.app",
      messagingSenderId: "789653547058",
      appId: "1:789653547058:web:3b7771f4a30af15e98742b"
  }
};

export const MOCK_EQUIPMENT: Equipment[] = [
  {
    id: 'eq-1',
    name: 'Painel Metálico 1.00x1.00',
    category: 'Estrutura',
    stockTotal: 500,
    stockRented: 120,
    priceDaily: 5.00,
    priceWeekly: 15.00,
    priceBiweekly: 25.00,
    priceMonthly: 40.00,
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-cd56b5095b68?auto=format&fit=crop&q=80&w=200',
    icon: 'scaffold'
  },
  {
    id: 'eq-2',
    name: 'Betoneira 400L Profissional',
    category: 'Maquinário',
    stockTotal: 10,
    stockRented: 2,
    priceDaily: 50.00,
    priceWeekly: 150.00,
    priceBiweekly: 280.00,
    priceMonthly: 400.00,
    imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=200',
    icon: 'mixer'
  },
  {
    id: 'eq-3',
    name: 'Piso Metálico Antiderrapante',
    category: 'Acessórios',
    stockTotal: 600,
    stockRented: 200,
    priceDaily: 3.00,
    priceWeekly: 8.00,
    priceBiweekly: 14.00,
    priceMonthly: 20.00,
    imageUrl: 'https://images.unsplash.com/photo-1535732759880-bbd5c7265e3f?auto=format&fit=crop&q=80&w=200',
    icon: 'box'
  },
  {
    id: 'eq-4',
    name: 'Escada Extensiva 7m',
    category: 'Acesso',
    stockTotal: 20,
    stockRented: 5,
    priceDaily: 25.00,
    priceWeekly: 70.00,
    priceBiweekly: 120.00,
    priceMonthly: 180.00,
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=200',
    icon: 'ladder'
  },
  {
    id: 'eq-5',
    name: 'Martelete Rompedor 10kg',
    category: 'Ferramentas',
    stockTotal: 15,
    stockRented: 3,
    priceDaily: 40.00,
    priceWeekly: 120.00,
    priceBiweekly: 200.00,
    priceMonthly: 350.00,
    imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&q=80&w=200',
    icon: 'drill'
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c-1',
    name: 'Construtora Horizonte Ltda',
    document: '12.345.678/0001-90',
    phone: '(11) 99999-8888',
    address: 'Av. Paulista, 1000, São Paulo - SP',
    email: 'contato@horizonte.com.br',
    password: '123'
  },
  {
    id: 'c-2',
    name: 'João Silva Reformas',
    document: '123.456.789-00',
    phone: '(11) 98888-7777',
    address: 'Rua das Flores, 123, Campinas - SP',
    email: 'joao.reformas@gmail.com'
  }
];

export const MOCK_RENTALS: RentalOrder[] = [
  {
    id: 'r-101',
    contractNumber: 'CTR-231001',
    customerId: 'c-1',
    status: RentalStatus.ACTIVE,
    items: [
      { equipmentId: 'eq-1', quantity: 20, priceAtTime: 40.00, totalItemPrice: 800.00 },
      { equipmentId: 'eq-3', quantity: 10, priceAtTime: 20.00, totalItemPrice: 200.00 }
    ],
    startDate: '2023-10-01',
    endDate: '2023-10-31',
    periodType: PeriodType.MONTHLY,
    freightCost: 0,
    discount: 0,
    subTotal: 1000.00,
    totalValue: 1000.00,
    paymentMethod: PaymentMethod.BOLETO,
    paymentTiming: PaymentTiming.MONTHLY_INVOICE,
    deliveryMethod: DeliveryMethod.DELIVERY,
    deliveryAddress: 'Av. Paulista, 1000 - Obra Torre B',
    createdAt: '2023-09-28'
  },
  {
    id: 'r-102',
    contractNumber: 'CTR-231009',
    customerId: 'c-2',
    status: RentalStatus.LATE,
    items: [
      { equipmentId: 'eq-2', quantity: 1, priceAtTime: 150.00, totalItemPrice: 150.00 }
    ],
    startDate: '2023-10-10',
    endDate: '2023-10-17',
    periodType: PeriodType.WEEKLY,
    freightCost: 50,
    discount: 0,
    subTotal: 150.00,
    totalValue: 200.00,
    paymentMethod: PaymentMethod.PIX,
    paymentTiming: PaymentTiming.ON_DELIVERY,
    deliveryMethod: DeliveryMethod.DELIVERY,
    deliveryAddress: 'Rua das Flores, 123',
    createdAt: '2023-10-09'
  }
];
