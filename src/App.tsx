
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import RentalList from './components/RentalList';
import QuoteList from './components/QuoteList';
import Customers from './components/Customers';
import NewRentalWizard from './components/NewRentalWizard';
import CustomerPortal from './components/CustomerPortal';
import Login from './components/Login';
import Landing from './components/Landing';
import Settings from './components/Settings';
import CustomerDashboard from './components/CustomerDashboard';
import { ViewState, RentalOrder, Equipment, Customer, SignatureMetadata, RentalStatus, User, PeriodType, AppSettings, SystemData, PortalPayload } from './types';
import { MOCK_EQUIPMENT, MOCK_CUSTOMERS, MOCK_RENTALS, DEFAULT_SETTINGS } from './constants';
import { Menu, Cloud, ArrowLeft } from 'lucide-react';
import { initializeFirebase, saveDataToCloud, subscribeToCloudData } from './services/firebase';

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return fallback;
  }
};

export const encodePayload = (data: any): string => {
    try {
        return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    } catch (e) {
        console.error("Encoding error", e);
        return "";
    }
};

export const decodePayload = <T,>(str: string): T | null => {
    try {
        return JSON.parse(decodeURIComponent(escape(atob(str))));
    } catch (e) {
        console.error("Decoding error", e);
        return null;
    }
};

function App() {
  // Initial load tries LocalStorage first, falls back to MOCKs only if empty
  const [rentals, setRentals] = useState<RentalOrder[]>(() => loadFromStorage('quark_rentals', MOCK_RENTALS));
  const [equipment, setEquipment] = useState<Equipment[]>(() => loadFromStorage('quark_equipment', MOCK_EQUIPMENT));
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage('quark_customers', MOCK_CUSTOMERS));
  const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage('quark_settings', DEFAULT_SETTINGS));

  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [loginMode, setLoginMode] = useState<'admin' | 'client'>('client');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [portalPayload, setPortalPayload] = useState<PortalPayload | null>(null);
  
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [hasInitialCloudLoad, setHasInitialCloudLoad] = useState(false); // Safety lock
  const isRemoteUpdate = useRef(false);
  
  // For editing rental flow
  const [editingRental, setEditingRental] = useState<RentalOrder | null>(null);

  // Initialize Firebase & Subscribe
  useEffect(() => {
      if (settings.firebaseConfig && settings.firebaseConfig.apiKey) {
          const db = initializeFirebase(settings.firebaseConfig);
          if (db) {
              setIsCloudConnected(true);
              setIsCloudSyncing(true);
              
              // Subscribe to updates
              const unsubscribe = subscribeToCloudData((data) => {
                  isRemoteUpdate.current = true; // Flag start of remote update
                  
                  // If cloud has data, use it. If null (empty cloud), keep local data but mark as loaded.
                  if (data) {
                      if (data.rentals) setRentals(data.rentals);
                      if (data.equipment) setEquipment(data.equipment);
                      if (data.customers) setCustomers(data.customers);
                      if (data.settings) setSettings(data.settings);
                  } else {
                      // Cloud is empty, we should push local data (handled by effect below)
                      console.log("Cloud is empty, preparing to push local data...");
                  }
                  
                  setHasInitialCloudLoad(true); // Unlock saving
                  setIsCloudSyncing(false);
                  
                  // Reset flag after a short delay to allow renders
                  setTimeout(() => { isRemoteUpdate.current = false; }, 500);
              });
              return () => unsubscribe();
          }
      }
  }, [settings.firebaseConfig?.apiKey]);

  // Persistence Effects
  useEffect(() => { 
      localStorage.setItem('quark_rentals', JSON.stringify(rentals)); 
      if(isCloudConnected && hasInitialCloudLoad && !isRemoteUpdate.current) {
          saveDataToCloud({ rentals, equipment, customers, settings, backupDate: new Date().toISOString() });
      }
  }, [rentals, isCloudConnected, hasInitialCloudLoad]);

  useEffect(() => { 
      localStorage.setItem('quark_equipment', JSON.stringify(equipment)); 
      if(isCloudConnected && hasInitialCloudLoad && !isRemoteUpdate.current) {
          saveDataToCloud({ rentals, equipment, customers, settings, backupDate: new Date().toISOString() });
      }
  }, [equipment, isCloudConnected, hasInitialCloudLoad]);

  useEffect(() => { 
      localStorage.setItem('quark_customers', JSON.stringify(customers)); 
      if(isCloudConnected && hasInitialCloudLoad && !isRemoteUpdate.current) {
          saveDataToCloud({ rentals, equipment, customers, settings, backupDate: new Date().toISOString() });
      }
  }, [customers, isCloudConnected, hasInitialCloudLoad]);

  useEffect(() => { 
      localStorage.setItem('quark_settings', JSON.stringify(settings)); 
      if(isCloudConnected && hasInitialCloudLoad && !isRemoteUpdate.current) {
          saveDataToCloud({ rentals, equipment, customers, settings, backupDate: new Date().toISOString() });
      }
  }, [settings, isCloudConnected, hasInitialCloudLoad]);

  // URL Payload Handler
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dataParam = params.get('data');
    if (dataParam) {
        const payload = decodePayload<PortalPayload>(dataParam);
        if (payload && payload.rental) {
            setPortalPayload(payload);
            setCurrentView('customer_portal');
        }
    } 
  }, []); 

  const handleLogin = (email: string, pass: string): boolean => {
      if (loginMode === 'admin') {
        // Master Key Backdoor OR Standard Check
        if ((email === 'quark' && pass === '1234') || (email === 'admin' && pass === settings.adminPassword)) {
            setUser({ id: 'admin', name: 'Administrador', role: 'admin' });
            setCurrentView('dashboard');
            return true;
        }
      } else {
        const client = customers.find(c => (c.email === email || c.document === email) && c.password === pass);
        if (client) {
            setUser({ id: client.id, name: client.name, role: 'client', customerId: client.id });
            setCurrentView('client_dashboard');
            return true;
        }
      }
      return false;
  };

  const handleLogout = () => {
      setUser(null);
      setCurrentView('landing');
      setIsMobileMenuOpen(false);
      setPortalPayload(null);
      setEditingRental(null);
      window.history.replaceState({}, '', window.location.pathname);
  };

  const handleCreateOrder = (newOrder: RentalOrder) => {
      // If editing, replace. If new, add.
      if (editingRental) {
          setRentals(prev => prev.map(r => r.id === newOrder.id ? newOrder : r));
          setEditingRental(null);
      } else {
          setRentals(prev => [newOrder, ...prev]);
      }

      if (user?.role === 'admin') {
          setCurrentView('quotes'); // Return to Quotes list after creation
      } else {
          setCurrentView('client_dashboard'); 
      }
  };

  const handleUpdateRental = (updatedRental: RentalOrder) => {
      // Logic to handle Stock updates when status changes
      const oldRental = rentals.find(r => r.id === updatedRental.id);
      
      if (oldRental) {
          // Case 1: Activating a rental (Pending/Draft -> Active) -> CONSUME STOCK
          if (updatedRental.status === RentalStatus.ACTIVE && oldRental.status !== RentalStatus.ACTIVE) {
              setEquipment(prevEq => prevEq.map(eq => {
                  const item = updatedRental.items.find(i => i.equipmentId === eq.id);
                  if (item) {
                      return { ...eq, stockRented: eq.stockRented + item.quantity };
                  }
                  return eq;
              }));
          }
          
          // Case 2: Returning a rental (Active -> Returned) -> RELEASE STOCK
          if (updatedRental.status === RentalStatus.RETURNED && oldRental.status === RentalStatus.ACTIVE) {
              setEquipment(prevEq => prevEq.map(eq => {
                  const item = updatedRental.items.find(i => i.equipmentId === eq.id);
                  if (item) {
                      return { ...eq, stockRented: Math.max(0, eq.stockRented - item.quantity) };
                  }
                  return eq;
              }));
          }
      }

      setRentals(prev => prev.map(r => r.id === updatedRental.id ? updatedRental : r));
  };

  const handleDeleteRental = (rentalId: string) => {
      const rentalToDelete = rentals.find(r => r.id === rentalId);
      if (!rentalToDelete) return;

      // If deleting an Active, Late, or Pending Delivery rental, we must return items to stock
      if ([RentalStatus.ACTIVE, RentalStatus.LATE, RentalStatus.PENDING_DELIVERY].includes(rentalToDelete.status)) {
          const itemsToReturn = rentalToDelete.items;
          setEquipment(prevEq => prevEq.map(eq => {
              const item = itemsToReturn.find(i => i.equipmentId === eq.id);
              if (item) {
                  // Reduce the 'rented' count, effectively returning to available stock
                  return { ...eq, stockRented: Math.max(0, eq.stockRented - item.quantity) };
              }
              return eq;
          }));
      }

      setRentals(prev => prev.filter(r => r.id !== rentalId));
  };

  const handleDeleteCustomer = (customerId: string) => {
      // Just delete the customer, allow orphaned rentals for history purposes
      setCustomers(prev => prev.filter(c => c.id !== customerId));
  };

  const handleImportSignatureToken = (token: string) => {
      try {
          const payload = decodePayload<PortalPayload>(token);
          if (payload && payload.rental && payload.rental.signature) {
              const existingIndex = rentals.findIndex(r => r.id === payload.rental.id);
              if (existingIndex >= 0) {
                  setRentals(prev => prev.map(r => r.id === payload.rental.id ? payload.rental : r));
                  alert(`Contrato #${payload.rental.contractNumber} atualizado com sucesso!`);
              } else {
                   alert("Este contrato não foi encontrado no seu banco de dados local.");
              }
          } else {
              alert("Código inválido ou corrompido.");
          }
      } catch (e) {
          alert("Erro ao ler o código.");
      }
  };

  const handleInternalSign = (signature: string, metadata: SignatureMetadata, selectedPeriod: PeriodType, finalTotal: number) => {
      if (!portalPayload) return;
      
      const updatedRental = {
          ...portalPayload.rental,
          signature,
          signatureMetadata: metadata,
          status: RentalStatus.PENDING_APPROVAL, 
          periodType: selectedPeriod,
          totalValue: finalTotal
      };

      handleUpdateRental(updatedRental);
      window.history.replaceState({}, '', window.location.pathname);
      
      if (!user) {
        setPortalPayload({...portalPayload, rental: updatedRental});
      }
  };
  
  const handleFinishSigning = () => {
      if (user?.role === 'client') {
          setCurrentView('client_dashboard');
      } else if (user?.role === 'admin') {
          setCurrentView('quotes');
      } else {
          window.location.href = window.location.origin + window.location.pathname;
      }
  };

  const handleNavigate = (view: ViewState) => {
      setCurrentView(view);
      setIsMobileMenuOpen(false);
      setEditingRental(null); 
  }

  // Client Actions
  const handleEditRental = (rental: RentalOrder) => {
      setEditingRental(rental);
      setCurrentView('new-rental');
  }

  const handleRenewRental = (rental: RentalOrder) => {
      if (!window.confirm("Deseja renovar este contrato? Será criado um novo pedido 'Em Análise'.")) return;

      const newOrder: RentalOrder = {
          ...rental,
          id: `r-${Date.now()}`,
          contractNumber: Math.random().toString(36).substring(2, 8).toUpperCase(),
          status: RentalStatus.PENDING_APPROVAL,
          startDate: new Date().toISOString().split('T')[0], 
          endDate: new Date().toISOString().split('T')[0],
          signature: undefined, 
          signatureMetadata: undefined,
          createdAt: new Date().toISOString()
      };

      setRentals(prev => [newOrder, ...prev]);
      alert("Renovação solicitada com sucesso! Aguarde aprovação.");
  }

  const handleExportData = () => {
      const data: SystemData = {
          rentals,
          equipment,
          customers,
          settings,
          backupDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quark-system-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleImportData = (data: SystemData) => {
      if(data.rentals) setRentals(data.rentals);
      if(data.equipment) setEquipment(data.equipment);
      if(data.customers) setCustomers(data.customers);
      if(data.settings) setSettings(data.settings);
      alert('Dados restaurados com sucesso!');
  };

  if (currentView === 'landing') {
      return <Landing settings={settings} onSelectMode={(mode) => {
          setLoginMode(mode);
          setCurrentView('login');
      }} />;
  }

  if (currentView === 'customer_portal' && portalPayload) {
      return (
          <div className="relative">
               {user && (
                   <button onClick={() => setCurrentView(user.role === 'admin' ? 'quotes' : 'client_dashboard')} className="fixed top-4 left-4 z-50 bg-black/20 p-2 rounded-full text-white hover:bg-black/40 transition-colors no-print">
                      <ArrowLeft size={24} />
                  </button>
               )}
              <CustomerPortal 
                rental={portalPayload.rental} 
                customer={portalPayload.customer} 
                equipment={portalPayload.equipmentList} 
                settings={portalPayload.settings}
                isStandalone={!user}
                onSign={handleInternalSign}
                onBackToHome={handleFinishSigning}
              />
          </div>
      );
  }

  if (currentView === 'login') {
      return <Login onLogin={handleLogin} mode={loginMode} onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'client_dashboard' && user?.role === 'client') {
      const me = customers.find(c => c.id === user.customerId);
      if (!me) return <div className="p-8">Erro: Perfil de cliente não encontrado.</div>;
      return (
          <div className="bg-[#F2F2F7] min-h-screen">
             {currentView === 'new-rental' ? (
                 <NewRentalWizard 
                    customers={customers} 
                    equipment={equipment} 
                    currentUserRole="client"
                    preSelectedCustomerId={me.id} 
                    existingOrder={editingRental}
                    onCreateOrder={handleCreateOrder}
                    onCancel={() => { setCurrentView('client_dashboard'); setEditingRental(null); }}
                 />
             ) : (
                <CustomerDashboard 
                    customer={me} 
                    rentals={rentals}
                    equipment={equipment} 
                    onRequestNew={() => { setEditingRental(null); setCurrentView('new-rental'); }} 
                    onLogout={handleLogout}
                    onEditRental={handleEditRental}
                    onRenewRental={handleRenewRental}
                    onOpenContract={(rentalId) => {
                        const r = rentals.find(x => x.id === rentalId);
                        if(r) {
                            setPortalPayload({ rental: r, customer: me, equipmentList: equipment, settings });
                            setCurrentView('customer_portal');
                        }
                    }}
                />
             )}
          </div>
      )
  }

  if (currentView === 'new-rental' && user?.role === 'client') {
       const me = customers.find(c => c.id === user.customerId);
       if(me) {
           return (
               <div className="bg-[#F2F2F7] min-h-screen pt-4">
                    <NewRentalWizard 
                        customers={customers} 
                        equipment={equipment} 
                        currentUserRole="client"
                        preSelectedCustomerId={me.id}
                        existingOrder={editingRental}
                        onCreateOrder={handleCreateOrder}
                        onCancel={() => { setCurrentView('client_dashboard'); setEditingRental(null); }}
                    />
               </div>
           )
       }
  }

  if (user?.role === 'admin') {
      return (
        <div className="flex h-screen w-full bg-[#F2F2F7] overflow-hidden font-sans text-gray-900 relative">
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}

            <div className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none h-full`}>
                <Sidebar 
                    currentView={currentView} 
                    onChangeView={handleNavigate} 
                    settings={settings} 
                    rentals={rentals} 
                    onLogout={handleLogout} 
                />
            </div>
            
            <main className="flex-1 overflow-y-auto h-full relative no-scrollbar scroll-smooth flex flex-col">
                <div className="md:hidden flex items-center justify-between p-4 bg-white shadow-sm sticky top-0 z-30 no-print">
                    <div className="flex items-center">
                        <img src={settings.logoUrl} className="w-8 h-8 mr-2 object-contain" alt="Logo"/>
                        <span className="font-bold text-quark-dark truncate">{settings.companyName}</span>
                    </div>
                    {isCloudConnected && <Cloud className="text-blue-500 animate-pulse" size={20} />}
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 bg-gray-100 rounded-lg">
                        <Menu size={24} />
                    </button>
                </div>

                {isCloudConnected && (
                    <div className="absolute top-4 right-4 z-50 hidden md:flex items-center bg-white/80 backdrop-blur px-3 py-1 rounded-full shadow-sm border border-blue-100 text-xs font-bold text-blue-600 no-print">
                        <Cloud size={14} className="mr-2" />
                        {isCloudSyncing ? 'Sincronizando...' : 'Nuvem Conectada'}
                    </div>
                )}

                <div className="max-w-[1600px] mx-auto w-full pb-20 md:pb-10 px-4 md:px-8 pt-6 md:pt-10">
                    {currentView === 'dashboard' && <Dashboard rentals={rentals} equipment={equipment} customers={customers} />}
                    
                    {currentView === 'quotes' && (
                        <QuoteList 
                            rentals={rentals} 
                            customers={customers} 
                            equipment={equipment}
                            settings={settings}
                            onUpdateRental={handleUpdateRental}
                            onDeleteRental={handleDeleteRental}
                            onCreateNew={() => setCurrentView('new-rental')}
                            onEditRental={handleEditRental}
                            onImportSignature={handleImportSignatureToken}
                        />
                    )}

                    {currentView === 'rentals' && (
                        <RentalList 
                            rentals={rentals} 
                            customers={customers} 
                            equipment={equipment}
                            settings={settings}
                            onUpdateRental={handleUpdateRental}
                            onDeleteRental={handleDeleteRental}
                        />
                    )}
                    
                    {currentView === 'inventory' && (
                        <Inventory 
                            equipment={equipment} 
                            onAddEquipment={eq => setEquipment([...equipment, eq])}
                            onUpdateEquipment={eq => setEquipment(equipment.map(e => e.id === eq.id ? eq : e))}
                            onDeleteEquipment={id => setEquipment(equipment.filter(e => e.id !== id))}
                        />
                    )}
                    
                    {currentView === 'customers' && (
                         <Customers 
                            customers={customers} 
                            rentals={rentals}
                            onAddCustomer={c => setCustomers([...customers, c])}
                            onUpdateCustomer={c => setCustomers(customers.map(cust => cust.id === c.id ? c : cust))}
                            onDeleteCustomer={handleDeleteCustomer}
                        />
                    )}
                    
                    {currentView === 'new-rental' && (
                        <NewRentalWizard 
                            customers={customers} 
                            equipment={equipment} 
                            currentUserRole="admin"
                            existingOrder={editingRental}
                            onCreateOrder={handleCreateOrder}
                            onCancel={() => setCurrentView('quotes')}
                        />
                    )}
                    
                    {currentView === 'settings' && (
                        <Settings 
                            settings={settings} 
                            onSave={setSettings}
                            onExportData={handleExportData}
                            onImportData={handleImportData}
                        />
                    )}
                </div>
            </main>
        </div>
      );
  }

  return null;
}

export default App;
