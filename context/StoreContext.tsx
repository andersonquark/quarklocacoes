import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Equipment, Client, Order, OrderStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_EQUIPMENT, MOCK_CLIENTS, MOCK_ORDERS } from '../data/mockData';

interface StoreContextType {
  equipment: Equipment[];
  clients: Client[];
  orders: Order[];
  refreshData: () => Promise<void>;
  addEquipment: (item: Equipment) => Promise<Equipment>;
  updateEquipment: (item: Equipment) => Promise<void>;
  addClient: (client: Client) => Promise<Client>;
  updateClient: (client: Client) => Promise<void>;
  addOrder: (order: Order) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, signatureUrl?: string, obs?: string) => Promise<void>;
  getEquipmentStock: (id: string) => { total: number; available: number; rented: number; reserved: number };
  resetLocalData: () => void;
  isDemoMode: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider = ({ children }: { children?: ReactNode }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // If Supabase is explicitly configured (even manually via UI), start in online mode
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);

  // Helper to get local data or fallback to mock
  const getLocalData = (key: string, mock: any) => {
      const stored = localStorage.getItem(`quark_${key}`);
      return stored ? JSON.parse(stored) : mock;
  };

  const saveLocalData = (key: string, data: any) => {
      localStorage.setItem(`quark_${key}`, JSON.stringify(data));
  };

  const resetLocalData = () => {
      localStorage.removeItem('quark_equipment');
      localStorage.removeItem('quark_clients');
      localStorage.removeItem('quark_orders');
      setEquipment(MOCK_EQUIPMENT);
      setClients(MOCK_CLIENTS);
      setOrders(MOCK_ORDERS);
      window.location.reload();
  };

  const fetchEquipment = async () => {
    // If we have a valid config, try to fetch online
    if (isSupabaseConfigured) {
        try {
            const { data, error } = await supabase.from('equipment').select('*');
            if (error) throw error;
            if (data) {
              const mapped = data.map((e: any) => ({
                id: e.id,
                code: e.code,
                name: e.name,
                category: e.category,
                description: e.description,
                imageUrl: e.image_url || 'https://via.placeholder.com/200',
                unit: e.unit,
                priceDaily: Number(e.price_daily),
                priceWeekly: Number(e.price_weekly),
                priceBiWeekly: Number(e.price_biweekly),
                priceMonthly: Number(e.price_monthly),
                stockTotal: e.stock_total,
                stockRented: 0,
                stockReserved: 0,
                active: e.active
              }));
              setEquipment(mapped);
              setIsDemoMode(false);
              return;
            }
        } catch (err) {
            console.error("Failed to fetch equipment online, falling back to local if needed", err);
            // Don't auto-fallback if we want to be online, but for UX safety we might
        }
    }
    
    // Fallback or Demo Mode
    setEquipment(prev => prev.length > 0 ? prev : getLocalData('equipment', MOCK_EQUIPMENT));
    if(!isSupabaseConfigured) setIsDemoMode(true);
  };

  const fetchClients = async () => {
    if (isSupabaseConfigured) {
        try {
            const { data, error } = await supabase.from('clients').select('*');
            if (error) throw error;
            if (data) {
              const mapped = data.map((c: any) => ({
                id: c.id,
                name: c.name,
                document: c.document,
                phone: c.phone,
                email: c.email,
                street: c.street,
                number: c.number,
                neighborhood: c.neighborhood,
                city: c.city,
                state: c.state,
                zipCode: c.zip_code,
                complement: c.complement,
                reference: c.reference
              }));
              setClients(mapped);
              return;
            }
        } catch (err) {
             console.error("Failed to fetch clients online", err);
        }
    }
    setClients(prev => prev.length > 0 ? prev : getLocalData('clients', MOCK_CLIENTS));
  };

  const fetchOrders = async () => {
    if (isSupabaseConfigured) {
        try {
            const { data: ordersData, error: ordersError } = await supabase
              .from('orders')
              .select(`*, order_items (equipment_id, quantity, price_snapshot)`)
              .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            if (ordersData) {
              const mapped = ordersData.map((o: any) => ({
                id: o.id,
                type: o.type,
                clientId: o.client_id,
                clientName: o.client_name,
                status: o.status,
                createdAt: o.created_at,
                deliveryDate: o.delivery_date,
                returnDate: o.return_date,
                street: o.street,
                number: o.number,
                neighborhood: o.neighborhood,
                city: o.city,
                state: o.state,
                zipCode: o.zip_code,
                complement: o.complement,
                reference: o.reference,
                shippingCost: Number(o.shipping_cost),
                totalAmount: Number(o.total_amount),
                billingPeriod: o.billing_period,
                observations: o.observations,
                signatureUrl: o.signature_url,
                items: o.order_items.map((i: any) => ({
                  equipmentId: i.equipment_id,
                  quantity: i.quantity,
                  priceSnapshot: Number(i.price_snapshot)
                }))
              }));
              setOrders(mapped);
              return;
            }
        } catch (err) {
            console.error("Failed to fetch orders online", err);
        }
    }
    setOrders(prev => prev.length > 0 ? prev : getLocalData('orders', MOCK_ORDERS));
  };

  const refreshData = async () => {
    await Promise.all([fetchEquipment(), fetchClients(), fetchOrders()]);
  };

  useEffect(() => {
    refreshData();
    
    if (isSupabaseConfigured) {
        try {
            const ordersSubscription = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders();
            })
            .subscribe();
            return () => { supabase.removeChannel(ordersSubscription); };
        } catch (e) {
            console.log("Realtime subscription error", e);
        }
    }
  }, [isSupabaseConfigured]);

  // --- Actions with Persistence ---

  const addEquipment = async (item: Equipment): Promise<Equipment> => {
    // Online Path
    if (isSupabaseConfigured) {
        try {
            const { id, ...rest } = item; 
            const dbItem = {
              code: item.code,
              name: item.name,
              category: item.category,
              description: item.description,
              image_url: item.imageUrl,
              unit: item.unit,
              price_daily: item.priceDaily,
              price_weekly: item.priceWeekly,
              price_biweekly: item.priceBiWeekly,
              price_monthly: item.priceMonthly,
              stock_total: item.stockTotal,
            };
            const { data, error } = await supabase.from('equipment').insert([dbItem]).select().single();
            if (error) throw error;
            await fetchEquipment();
            return { ...item, id: data.id };
        } catch (err) {
            console.error("Online add failed", err);
            // Only fallback if not forcing online strictness, but let's fallback to keep app usable
        }
    }

    // Offline/Demo Path
    const newItem = { ...item, id: `eq-${Date.now()}` };
    const updated = [...equipment, newItem];
    setEquipment(updated);
    saveLocalData('equipment', updated);
    return newItem;
  };

  const updateEquipment = async (item: Equipment) => {
     if (isSupabaseConfigured) {
         try {
             const dbItem = {
              code: item.code,
              name: item.name,
              category: item.category,
              description: item.description,
              image_url: item.imageUrl,
              unit: item.unit,
              price_daily: item.priceDaily,
              price_weekly: item.priceWeekly,
              price_biweekly: item.priceBiWeekly,
              price_monthly: item.priceMonthly,
              stock_total: item.stockTotal,
            };
            const { error } = await supabase.from('equipment').update(dbItem).eq('id', item.id);
            if (error) throw error;
            fetchEquipment();
            return;
         } catch (err) {
             console.error("Online update failed", err);
         }
     }
     
     const updated = equipment.map(e => e.id === item.id ? item : e);
     setEquipment(updated);
     saveLocalData('equipment', updated);
  };

  const addClient = async (client: Client): Promise<Client> => {
    if (isSupabaseConfigured) {
        try {
            const dbClient = {
              name: client.name,
              document: client.document,
              phone: client.phone,
              email: client.email,
              street: client.street,
              number: client.number,
              neighborhood: client.neighborhood,
              city: client.city,
              state: client.state,
              zip_code: client.zipCode,
              complement: client.complement,
              reference: client.reference
            };
            const { data, error } = await supabase.from('clients').insert([dbClient]).select().single();
            if(error) throw error;
            await fetchClients();
            return { ...client, id: data.id };
        } catch(err) {
            console.error(err);
        }
    }
    
    const newClient = { ...client, id: `cli-${Date.now()}` };
    const updated = [...clients, newClient];
    setClients(updated);
    saveLocalData('clients', updated);
    return newClient;
  };

  const updateClient = async (client: Client) => {
    if (isSupabaseConfigured) {
        try {
            const dbClient = {
              name: client.name,
              document: client.document,
              phone: client.phone,
              email: client.email,
              street: client.street,
              number: client.number,
              neighborhood: client.neighborhood,
              city: client.city,
              state: client.state,
              zip_code: client.zipCode,
              complement: client.complement,
              reference: client.reference
            };
            const { error } = await supabase.from('clients').update(dbClient).eq('id', client.id);
            if(error) throw error;
            fetchClients();
            return;
        } catch(err) {
            console.error(err);
        }
    }

    const updated = clients.map(c => c.id === client.id ? client : c);
    setClients(updated);
    saveLocalData('clients', updated);
  };

  const addOrder = async (order: Order): Promise<Order> => {
    if (isSupabaseConfigured) {
        try {
            const dbOrder = {
              type: order.type,
              client_id: order.clientId,
              client_name: order.clientName,
              status: order.status,
              created_at: order.createdAt,
              delivery_date: order.deliveryDate,
              return_date: order.returnDate,
              street: order.street,
              number: order.number,
              neighborhood: order.neighborhood,
              city: order.city,
              state: order.state,
              zip_code: order.zipCode,
              complement: order.complement,
              reference: order.reference,
              shipping_cost: order.shippingCost,
              total_amount: order.totalAmount,
              billing_period: order.billingPeriod,
              observations: order.observations
            };

            const { data: newOrderData, error } = await supabase.from('orders').insert([dbOrder]).select().single();
            if (error) throw error;

            const dbItems = order.items.map(item => ({
              order_id: newOrderData.id,
              equipment_id: item.equipmentId,
              quantity: item.quantity,
              price_snapshot: item.priceSnapshot
            }));
            await supabase.from('order_items').insert(dbItems);
            await fetchOrders();
            return { ...order, id: newOrderData.id };
        } catch(err) {
            console.error(err);
        }
    }

    const newOrder = { ...order, id: `ord-${Date.now()}` };
    const updated = [newOrder, ...orders];
    setOrders(updated);
    saveLocalData('orders', updated);
    return newOrder;
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, signatureUrl?: string, obs?: string) => {
    if (isSupabaseConfigured) {
        try {
            const updateData: any = { status };
            if (signatureUrl) updateData.signature_url = signatureUrl;
            if (obs !== undefined) updateData.observations = obs;
            const { error } = await supabase.from('orders').update(updateData).eq('id', orderId);
            if (error) throw error;
            fetchOrders();
            return;
        } catch(err) {
            console.error(err);
        }
    }

    const updated = orders.map(o => {
      if (o.id === orderId) {
         const up = { ...o, status };
         if (signatureUrl) up.signatureUrl = signatureUrl;
         if (obs !== undefined) up.observations = obs;
         return up;
      }
      return o;
    });
    setOrders(updated);
    saveLocalData('orders', updated);
  };

  const getEquipmentStock = (id: string) => {
    const item = equipment.find(e => e.id === id);
    if (!item) return { total: 0, available: 0, rented: 0, reserved: 0 };
    
    let rented = 0;
    let reserved = 0;

    orders.forEach(order => {
        if (order.status === OrderStatus.QUOTATION || order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) return;
        const orderItem = order.items.find(i => i.equipmentId === item.id);
        if (orderItem) {
           if (order.status === OrderStatus.DELIVERED) rented += orderItem.quantity;
           else reserved += orderItem.quantity;
        }
    });
    
    const available = Math.max(0, item.stockTotal - rented - reserved);
    return { total: item.stockTotal, available, rented, reserved };
  };

  return (
    <StoreContext.Provider value={{
      equipment, clients, orders, refreshData, addEquipment, updateEquipment, 
      addClient, updateClient, addOrder, updateOrderStatus, getEquipmentStock, resetLocalData, isDemoMode
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};