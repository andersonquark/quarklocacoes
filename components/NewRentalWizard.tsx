
import React, { useState, useEffect } from 'react';
import { Customer, Equipment, RentalOrder, RentalStatus, PeriodType, PaymentMethod, PaymentTiming, DeliveryMethod, SignatureMetadata, AppSettings } from '../types';
import { Plus, Trash2, ChevronRight, ChevronLeft, CheckCircle, Truck, Save, ArrowRight, DollarSign, MapPin, CreditCard, Minus, Calendar, User, Package, Clock, FileText, Shield, Download, Share2, PackageOpen } from 'lucide-react';
import SignaturePad from './SignaturePad';
import { DEFAULT_SETTINGS } from '../constants';

interface NewRentalWizardProps {
  customers: Customer[];
  equipment: Equipment[];
  currentUserRole: 'admin' | 'client';
  preSelectedCustomerId?: string; 
  existingOrder?: RentalOrder | null; // Prop for Edit Mode
  settings?: AppSettings;
  onCreateOrder: (order: RentalOrder) => void;
  onCancel: () => void;
}

const NewRentalWizard: React.FC<NewRentalWizardProps> = ({ customers, equipment, currentUserRole, preSelectedCustomerId, existingOrder, settings = DEFAULT_SETTINGS, onCreateOrder, onCancel }) => {
  const [step, setStep] = useState(1);
  
  // Determine initial customer
  const initialCustomerId = currentUserRole === 'client' 
    ? (preSelectedCustomerId || '') 
    : (existingOrder?.customerId || '');
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId);
  const [selectedItems, setSelectedItems] = useState<{ equipmentId: string; quantity: number }[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [freight, setFreight] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(DeliveryMethod.DELIVERY);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.UNDEFINED);

  // Client specific flow states
  const [viewMode, setViewMode] = useState<'proposal' | 'contract'>('proposal'); // New state to toggle between Proposal and Contract
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType | null>(null);
  const [signature, setSignature] = useState('');
  const [isLoadingSign, setIsLoadingSign] = useState(false);
  const [isDownloadingProposal, setIsDownloadingProposal] = useState(false);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Initialize if Editing
  useEffect(() => {
      if (existingOrder) {
          setSelectedCustomerId(existingOrder.customerId);
          setStartDate(existingOrder.startDate);
          setSelectedItems(existingOrder.items.map(i => ({ equipmentId: i.equipmentId, quantity: i.quantity })));
          setDeliveryAddress(existingOrder.deliveryAddress);
          setDeliveryMethod(existingOrder.deliveryMethod);
          setFreight(existingOrder.freightCost);
          setDiscount(existingOrder.discount);
          if (existingOrder.periodType) {
              setSelectedPeriod(existingOrder.periodType);
              setViewMode('contract'); // If editing existing, go straight to contract view
          }
      }
  }, [existingOrder]);

  // Auto-set address if client matches and not editing
  useEffect(() => {
      if(selectedCustomer && !existingOrder) {
          setDeliveryAddress(selectedCustomer.address);
      }
  }, [selectedCustomer, existingOrder]);

  // Handlers
  const handleAddItem = (eqId: string) => {
    const existing = selectedItems.find(i => i.equipmentId === eqId);
    if (existing) {
      setSelectedItems(selectedItems.map(i => i.equipmentId === eqId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setSelectedItems([...selectedItems, { equipmentId: eqId, quantity: 1 }]);
    }
  };

  const handleUpdateQuantity = (eqId: string, newQty: number) => {
      if (newQty < 1) return;
      setSelectedItems(selectedItems.map(i => i.equipmentId === eqId ? { ...i, quantity: newQty } : i));
  };

  const handleRemoveItem = (eqId: string) => {
    setSelectedItems(selectedItems.filter(i => i.equipmentId !== eqId));
  };

  const calculateComparativeTotals = () => {
      const totals = { daily: 0, weekly: 0, biweekly: 0, monthly: 0 };
      selectedItems.forEach(item => {
          const eq = equipment.find(e => e.id === item.equipmentId);
          if (eq) {
              totals.daily += eq.priceDaily * item.quantity;
              totals.weekly += eq.priceWeekly * item.quantity;
              totals.biweekly += eq.priceBiweekly * item.quantity;
              totals.monthly += eq.priceMonthly * item.quantity;
          }
      });
      return totals;
  };

  const totals = calculateComparativeTotals();

  const calculateFinalTotal = () => {
      if (!selectedPeriod) return 0;
      let subTotal = 0;
      if (selectedPeriod === PeriodType.DAILY) subTotal = totals.daily;
      if (selectedPeriod === PeriodType.WEEKLY) subTotal = totals.weekly;
      if (selectedPeriod === PeriodType.BIWEEKLY) subTotal = totals.biweekly;
      if (selectedPeriod === PeriodType.MONTHLY) subTotal = totals.monthly;
      return subTotal + freight - discount;
  };

  const handleCreateOrder = async () => {
      if (!selectedCustomer) return;

      const contractNumber = existingOrder ? existingOrder.contractNumber : Math.random().toString(36).substring(2, 8).toUpperCase();
      let signatureMetadata: SignatureMetadata | undefined = existingOrder?.signatureMetadata;
      let finalSignature = existingOrder?.signature || signature;

      if (currentUserRole === 'client' && !existingOrder?.signature) {
          setIsLoadingSign(true);
          // Simulate Geo capture
          await new Promise(resolve => setTimeout(resolve, 800));
          signatureMetadata = {
              ip: "189.32.11.55", 
              userAgent: navigator.userAgent,
              timestamp: new Date().toLocaleString('pt-BR'),
              latitude: -23.5505,
              longitude: -46.6333,
              locationString: "Localização Confirmada (Via App)"
          };
          finalSignature = signature;
      }

      const newOrder: RentalOrder = {
          id: existingOrder ? existingOrder.id : `r-${Date.now()}`,
          contractNumber,
          customerId: selectedCustomer.id,
          status: currentUserRole === 'admin' ? RentalStatus.WAITING_CLIENT_SELECTION : RentalStatus.PENDING_APPROVAL,
          items: selectedItems.map(i => ({
              equipmentId: i.equipmentId,
              quantity: i.quantity,
              priceAtTime: 0,
              totalItemPrice: 0
          })),
          startDate,
          endDate: startDate, 
          freightCost: freight,
          discount: discount,
          subTotal: 0,
          periodType: selectedPeriod || undefined,
          totalValue: currentUserRole === 'client' ? calculateFinalTotal() : 0,
          paymentMethod: paymentMethod,
          paymentTiming: PaymentTiming.ON_DELIVERY,
          deliveryMethod: deliveryMethod,
          deliveryAddress: deliveryMethod === DeliveryMethod.DELIVERY ? (deliveryAddress || selectedCustomer.address) : 'Retirada na Loja',
          signature: finalSignature || undefined,
          signatureMetadata: signatureMetadata,
          createdAt: existingOrder ? existingOrder.createdAt : new Date().toISOString()
      };

      setIsLoadingSign(false);
      
      try {
          // Call the parent handler which updates state and navigates
          onCreateOrder(newOrder);
      } catch (e) {
          console.error(e);
          alert("Erro ao salvar pedido.");
      }
  };

  const prices = {
      [PeriodType.DAILY]: totals.daily + freight - discount,
      [PeriodType.WEEKLY]: totals.weekly + freight - discount,
      [PeriodType.BIWEEKLY]: totals.biweekly + freight - discount,
      [PeriodType.MONTHLY]: totals.monthly + freight - discount,
  };

  const downloadProposalPDF = () => {
      setIsDownloadingProposal(true);
      const element = document.getElementById('proposal-document-wizard'); // USE HIDDEN ELEMENT
      if (!element) {
          alert('Elemento de proposta não encontrado.');
          setIsDownloadingProposal(false);
          return;
      }
      
      // Make visible fixed for capture - identical logic to QuoteList to prevent cuts
      element.style.display = 'flex';
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.zIndex = '99999';
      element.style.backgroundColor = '#ffffff';
      
      // Force scroll to top
      window.scrollTo(0,0);

      const opt = {
          margin: 0,
          filename: `Orcamento-${selectedCustomer?.name.split(' ')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
              scale: 2, 
              useCORS: true, 
              scrollY: 0, 
              backgroundColor: '#ffffff', 
              windowWidth: 794, 
              height: 1123,
              x: 0,
              y: 0
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      if (window.html2pdf) {
           // @ts-ignore
           window.html2pdf().set(opt).from(element).save().then(() => {
               element.style.display = 'none';
               element.style.zIndex = '-9999';
               setIsDownloadingProposal(false);
           });
      } else {
          alert('Gerador de PDF indisponível');
          setIsDownloadingProposal(false);
      }
  };

  // The Hidden Content for PDF Generation (Strict A4 - Centered Layout)
  const WizardProposalPrint = () => {
      // STRICT A4 STYLE
      const A4_STYLE: React.CSSProperties = {
          width: '794px',
          height: '1115px', // Slightly less than 1123px to prevent overflow page
          padding: '40px',
          backgroundColor: 'white',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'none', // Hidden by default, toggled by JS
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: 'Inter, sans-serif',
          color: '#111827',
          overflow: 'hidden'
      };

      return (
      <div id="proposal-document-wizard" style={A4_STYLE}>
          
          {/* TOP SECTION */}
          <div>
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-gray-900 pb-4 mb-6">
                <div className="flex items-center">
                    {settings.logoUrl && <img src={settings.logoUrl} className="h-14 mr-4 object-contain grayscale" alt="Logo" />}
                    <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900">Orçamento</h2>
                        <p className="text-sm text-gray-500 font-medium">Novo Pedido</p>
                    </div>
                </div>
                <div className="text-right text-[10px] leading-relaxed text-gray-600">
                    <p className="font-bold text-gray-900 text-xs">{settings.companyName}</p>
                    <p>{settings.companyPhone}</p>
                    <p>{settings.companyAddress}</p>
                    <p>Data: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
            
            {/* Client Info */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-6">
                 <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-wider">Dados do Cliente</h3>
                 <div className="flex justify-between items-start">
                     <div>
                         <p className="text-lg font-bold text-gray-900">{selectedCustomer?.name}</p>
                         <p className="text-sm text-gray-600 mt-1">{selectedCustomer?.phone}</p>
                     </div>
                     <div className="text-right">
                         <p className="text-sm text-gray-600">{selectedCustomer?.document}</p>
                     </div>
                 </div>
            </div>

            {/* Matrix Table */}
            <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wider border-b border-gray-200 pb-1">Tabela de Preços e Itens</h3>
                <table className="w-full text-left border-collapse table-fixed">
                    <thead className="bg-gray-100 text-[9px] uppercase font-bold text-gray-700">
                        <tr>
                            <th className="p-2 border-b border-gray-300 w-[35%]">Equipamento</th>
                            <th className="p-2 border-b border-gray-300 text-center w-[5%]">Qtd</th>
                            <th className="p-2 border-b border-gray-300 text-right">Diária</th>
                            <th className="p-2 border-b border-gray-300 text-right">Semanal</th>
                            <th className="p-2 border-b border-gray-300 text-right">Quinzenal</th>
                            <th className="p-2 border-b border-gray-300 text-right bg-gray-200">Mensal</th>
                        </tr>
                    </thead>
                    <tbody className="text-[10px]">
                        {selectedItems.map((item, idx) => {
                            const eq = equipment.find(e => e.id === item.equipmentId);
                            if (!eq) return null;
                            return (
                                <tr key={item.equipmentId} className="border-b border-gray-100">
                                    <td className="p-2 font-bold truncate">{eq.name}</td>
                                    <td className="p-2 text-center">{item.quantity}</td>
                                    <td className="p-2 text-right">R$ {(eq.priceDaily * item.quantity).toFixed(2)}</td>
                                    <td className="p-2 text-right">R$ {(eq.priceWeekly * item.quantity).toFixed(2)}</td>
                                    <td className="p-2 text-right">R$ {(eq.priceBiweekly * item.quantity).toFixed(2)}</td>
                                    <td className="p-2 text-right font-bold bg-gray-50">R$ {(eq.priceMonthly * item.quantity).toFixed(2)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <div>
             <table className="w-full text-[10px]">
                <tfoot className="font-bold text-xs bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                        <td className="p-2 text-right uppercase text-gray-500 w-[40%]">Subtotal Itens</td>
                        <td className="p-2 text-right">R$ {totals.daily.toFixed(2)}</td>
                        <td className="p-2 text-right">R$ {totals.weekly.toFixed(2)}</td>
                        <td className="p-2 text-right">R$ {totals.biweekly.toFixed(2)}</td>
                        <td className="p-2 text-right border-l border-gray-200">R$ {totals.monthly.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td className="p-2 text-right uppercase text-gray-500">Frete / Entrega</td>
                        <td className="p-2 text-right text-gray-500">R$ {freight.toFixed(2)}</td>
                        <td className="p-2 text-right text-gray-500">R$ {freight.toFixed(2)}</td>
                        <td className="p-2 text-right text-gray-500">R$ {freight.toFixed(2)}</td>
                        <td className="p-2 text-right text-gray-500 border-l border-gray-200">R$ {freight.toFixed(2)}</td>
                    </tr>
                    {discount > 0 && (
                         <tr>
                             <td className="p-2 text-right uppercase text-green-600">Desconto</td>
                             <td className="p-2 text-right text-green-600">- R$ {discount.toFixed(2)}</td>
                             <td className="p-2 text-right text-green-600">- R$ {discount.toFixed(2)}</td>
                             <td className="p-2 text-right text-green-600">- R$ {discount.toFixed(2)}</td>
                             <td className="p-2 text-right text-green-600 border-l border-gray-200">- R$ {discount.toFixed(2)}</td>
                         </tr>
                     )}
                    <tr className="text-xs bg-gray-100 border-t-2 border-gray-300">
                        <td className="p-3 text-right uppercase font-extrabold text-gray-900">TOTAL ESTIMADO</td>
                        <td className="p-3 text-right">R$ {(totals.daily + freight - discount).toFixed(2)}</td>
                        <td className="p-3 text-right">R$ {(totals.weekly + freight - discount).toFixed(2)}</td>
                        <td className="p-3 text-right">R$ {(totals.biweekly + freight - discount).toFixed(2)}</td>
                        <td className="p-3 text-right text-sm bg-black text-white">R$ {(totals.monthly + freight - discount).toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
            
             <div className="border-t border-gray-200 pt-4 mt-6 flex justify-between items-end text-[9px] text-gray-500">
                <div className="max-w-xs">
                    <p className="font-bold uppercase text-gray-700 mb-1">Observações</p>
                    <p>Proposta válida por 5 dias. Sujeito a disponibilidade de estoque. Pagamento a combinar.</p>
                </div>
                <div className="text-right">
                    <p className="font-bold text-gray-900">{settings.companyName}</p>
                </div>
            </div>
          </div>
      </div>
      );
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-fade-in pb-32 min-h-screen bg-[#F2F2F7] md:bg-transparent">
      
      <WizardProposalPrint />

      {/* Progress Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 sticky top-0 bg-[#F2F2F7] z-20 py-4 md:static md:bg-transparent progress-header">
         <div className="text-center md:text-left mb-4 md:mb-0">
             <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                 {existingOrder ? `Editando Pedido #${existingOrder.contractNumber}` : (currentUserRole === 'client' ? 'Solicitar Locação' : 'Novo Contrato')}
             </h2>
             <p className="text-sm text-gray-500">Passo {step} de {currentUserRole === 'client' ? '4' : '3'}</p>
         </div>
         
         <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map(s => {
                if (currentUserRole === 'admin' && s === 4) return null;
                return <div key={s} className={`h-2.5 w-12 rounded-full transition-all ${step >= s ? 'bg-quark-dark' : 'bg-gray-200'}`}></div>
            })}
         </div>
      </div>

      {/* Step 1: Client/Date */}
      {step === 1 && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-scale-in max-w-2xl mx-auto">
               <h3 className="text-xl font-bold mb-6 flex items-center"><Calendar className="mr-2" /> Dados Iniciais</h3>
               <div className="space-y-6">
                   {currentUserRole === 'admin' ? (
                        <div>
                            <label className="label-title">Cliente</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                                <select 
                                    className="input-field h-14 pl-12"
                                    value={selectedCustomerId}
                                    onChange={e => setSelectedCustomerId(e.target.value)}
                                    disabled={!!existingOrder}
                                >
                                    <option value="">Selecione o Cliente...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                   ) : (
                       <div className="p-4 bg-gray-50 rounded-xl flex items-center border border-gray-100">
                           <div className="w-10 h-10 bg-quark-dark text-white rounded-full flex items-center justify-center font-bold mr-3">
                               {selectedCustomer?.name.charAt(0)}
                           </div>
                           <div>
                               <p className="text-xs font-bold text-gray-400 uppercase">Solicitante</p>
                               <p className="font-bold text-gray-900">{selectedCustomer?.name}</p>
                           </div>
                       </div>
                   )}

                   <div>
                       <label className="label-title">Data de Início (Previsão)</label>
                       <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                            <input type="date" className="input-field pl-12" value={startDate} onChange={e => setStartDate(e.target.value)} />
                       </div>
                   </div>
               </div>
          </div>
      )}

      {/* Step 2: Equipment Selection */}
      {step === 2 && (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[500px]">
              {/* List */}
              <div className="flex-1 bg-white rounded-3xl border border-gray-100 flex flex-col shadow-sm overflow-hidden">
                   <div className="p-4 border-b border-gray-100 bg-gray-50">
                       <input placeholder="Buscar equipamentos..." className="w-full p-3 bg-white rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-quark-primary" />
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                       {equipment.map(item => (
                           <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all group">
                               <div className="flex items-center">
                                   <div className="w-14 h-14 rounded-xl bg-gray-100 mr-4 overflow-hidden border border-gray-200">
                                       <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                                   </div>
                                   <div>
                                       <p className="font-bold text-gray-900 group-hover:text-quark-dark transition-colors">{item.name}</p>
                                       <p className="text-xs text-gray-500">Estoque: {item.stockTotal - item.stockRented}</p>
                                   </div>
                               </div>
                               <button onClick={() => handleAddItem(item.id)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-quark-dark hover:text-white transition-all shadow-sm">
                                   <Plus size={20} />
                               </button>
                           </div>
                       ))}
                   </div>
              </div>

              {/* Cart */}
              <div className="w-full lg:w-96 bg-quark-dark text-white rounded-3xl p-6 flex flex-col shadow-2xl relative overflow-hidden shrink-0">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-quark-primary blur-[60px] opacity-20 rounded-full"></div>
                   <h3 className="font-bold mb-4 text-lg flex items-center justify-between relative z-10">
                       <span>Selecionados</span>
                       <span className="text-xs bg-white/20 px-2 py-1 rounded font-mono">{selectedItems.length}</span>
                   </h3>
                   <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-4 relative z-10">
                       {selectedItems.length === 0 && (
                           <div className="text-center mt-10 opacity-40">
                               <Package size={40} className="mx-auto mb-2"/>
                               <p className="text-sm">Selecione itens da lista</p>
                           </div>
                       )}
                       {selectedItems.map(item => {
                           const eq = equipment.find(e => e.id === item.equipmentId);
                           return (
                               <div key={item.equipmentId} className="bg-white/10 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                                   <div className="flex flex-col min-w-0 mr-2">
                                        <span className="font-bold text-sm truncate">{eq?.name}</span>
                                        <span className="text-[10px] text-gray-400">Qtd</span>
                                   </div>
                                   
                                   <div className="flex items-center bg-black/30 rounded-lg p-1">
                                        <button onClick={() => handleUpdateQuantity(item.equipmentId, item.quantity - 1)} className="p-1 hover:text-quark-primary transition-colors"><Minus size={14}/></button>
                                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                        <button onClick={() => handleUpdateQuantity(item.equipmentId, item.quantity + 1)} className="p-1 hover:text-quark-primary transition-colors"><Plus size={14}/></button>
                                   </div>
                                   <button onClick={() => handleRemoveItem(item.equipmentId)} className="ml-2 text-gray-500 hover:text-red-400"><Trash2 size={16}/></button>
                               </div>
                           )
                       })}
                   </div>
              </div>
          </div>
      )}

      {/* Step 3: Options (Admin) OR Pre-Selection (Client) */}
      {step === 3 && (
          <div className="animate-in slide-in-from-right-4 max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100 mb-8">
                  <h3 className="text-xl font-bold mb-6 text-center text-gray-900">Definições de Entrega</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-100 pb-8 mb-8">
                      <div className="space-y-5">
                          <h4 className="font-bold text-gray-900 flex items-center"><Truck size={18} className="mr-2"/> Preferências</h4>
                          
                          <div className="flex gap-3">
                              <button 
                                onClick={() => setDeliveryMethod(DeliveryMethod.DELIVERY)}
                                className={`flex-1 p-4 rounded-xl border text-sm font-bold transition-all ${deliveryMethod === DeliveryMethod.DELIVERY ? 'bg-quark-dark text-white border-quark-dark shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                              >
                                  Entrega na Obra
                              </button>
                              <button 
                                onClick={() => setDeliveryMethod(DeliveryMethod.PICKUP)}
                                className={`flex-1 p-4 rounded-xl border text-sm font-bold transition-all ${deliveryMethod === DeliveryMethod.PICKUP ? 'bg-quark-dark text-white border-quark-dark shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                              >
                                  Retirar na Loja
                              </button>
                          </div>

                          {deliveryMethod === DeliveryMethod.DELIVERY && (
                              <input 
                                type="text" 
                                className="input-field" 
                                value={deliveryAddress} 
                                onChange={e => setDeliveryAddress(e.target.value)} 
                                placeholder="Endereço de Entrega..." 
                              />
                          )}
                      </div>

                      {currentUserRole === 'admin' && (
                          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                               <h4 className="font-bold text-gray-900 mb-4 flex items-center"><CreditCard className="mr-2" size={18}/> Ajustes Admin</h4>
                               <div className="space-y-4">
                                   <div>
                                       <label className="label-title">Frete (R$)</label>
                                       <input type="number" className="input-field" value={freight} onChange={e => setFreight(Number(e.target.value))} />
                                   </div>
                                   <div>
                                       <label className="label-title">Desconto (R$)</label>
                                       <input type="number" className="input-field" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                                   </div>
                               </div>
                          </div>
                      )}
                  </div>

                  {/* Comparative Pricing Display */}
                  <h3 className="text-lg font-bold mb-4 text-center text-gray-900">Estimativa de Valores (Com Frete)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                          { label: 'Diária', value: totals.daily + freight - discount },
                          { label: 'Semanal', value: totals.weekly + freight - discount },
                          { label: 'Quinzenal', value: totals.biweekly + freight - discount },
                          { label: 'Mensal', value: totals.monthly + freight - discount, highlight: true }
                      ].map((plan) => (
                          <div key={plan.label} className={`p-5 rounded-2xl border flex flex-col items-center justify-center text-center ${plan.highlight ? 'bg-green-50 border-quark-secondary' : 'bg-gray-50 border-gray-200'}`}>
                              <span className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">{plan.label}</span>
                              <span className={`text-lg md:text-xl font-bold ${plan.highlight ? 'text-quark-secondary' : 'text-gray-900'}`}>R$ {plan.value.toFixed(2)}</span>
                          </div>
                      ))}
                  </div>
              </div>

              {currentUserRole === 'admin' && (
                  <button 
                    onClick={handleCreateOrder}
                    className="w-full bg-quark-dark text-white py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-black transition-all flex items-center justify-center"
                  >
                      <Save className="mr-2" /> {existingOrder ? 'Atualizar Orçamento' : 'Salvar Orçamento'}
                  </button>
              )}
          </div>
      )}

      {/* Step 4: CLIENT EXCLUSIVE - Proposal View OR Sign View */}
      {step === 4 && currentUserRole === 'client' && (
          <div className="animate-in slide-in-from-right-4 max-w-5xl mx-auto pb-20">
               
               {viewMode === 'proposal' && (
                   <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200 mb-8">
                       {/* PROPOSAL DOCUMENT CONTAINER */}
                       <div className="bg-white p-8 md:p-12 text-gray-900 font-sans">
                           
                           {/* Header */}
                           <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
                               <div className="flex items-center">
                                   <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain mr-4" />
                                   <div>
                                       <h1 className="text-3xl font-extrabold text-gray-900 uppercase tracking-tight">Proposta Comercial</h1>
                                       <p className="text-sm text-gray-500 font-medium">Emitida em: {new Date().toLocaleDateString()}</p>
                                   </div>
                               </div>
                               <div className="text-right mt-4 md:mt-0 text-sm">
                                   <p className="font-bold text-lg">{settings.companyName}</p>
                                   <p>{settings.companyPhone}</p>
                                   <p>{settings.companyAddress}</p>
                               </div>
                           </div>

                           {/* Client Info */}
                           <div className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-100">
                               <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Dados do Cliente</h3>
                               <p className="text-xl font-bold text-gray-900">{selectedCustomer?.name}</p>
                               <p className="text-gray-600">{selectedCustomer?.document} • {selectedCustomer?.phone}</p>
                               <p className="text-gray-600 flex items-center mt-1"><MapPin size={14} className="mr-1"/> {deliveryAddress || selectedCustomer?.address}</p>
                           </div>

                           {/* COMPARATIVE MATRIX TABLE */}
                           <div className="mb-8">
                               <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><FileText className="mr-2"/> Comparativo de Modalidades</h3>
                               <div className="overflow-hidden rounded-xl border border-gray-200">
                                   <table className="w-full text-sm text-left">
                                       <thead className="bg-gray-900 text-white uppercase text-xs">
                                           <tr>
                                               <th className="p-4">Item / Equipamento</th>
                                               <th className="p-4 text-center">Qtd</th>
                                               <th className="p-4 text-right bg-gray-800">Diária</th>
                                               <th className="p-4 text-right bg-gray-800">Semanal</th>
                                               <th className="p-4 text-right bg-gray-800">Quinzenal</th>
                                               <th className="p-4 text-right bg-quark-primary text-quark-dark font-extrabold">Mensal</th>
                                           </tr>
                                       </thead>
                                       <tbody className="divide-y divide-gray-100">
                                           {selectedItems.map((item, idx) => {
                                               const eq = equipment.find(e => e.id === item.equipmentId);
                                               if(!eq) return null;
                                               return (
                                                   <tr key={item.equipmentId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                       <td className="p-4 font-bold">{eq.name}</td>
                                                       <td className="p-4 text-center">{item.quantity}</td>
                                                       <td className="p-4 text-right">R$ {(eq.priceDaily * item.quantity).toFixed(2)}</td>
                                                       <td className="p-4 text-right">R$ {(eq.priceWeekly * item.quantity).toFixed(2)}</td>
                                                       <td className="p-4 text-right">R$ {(eq.priceBiweekly * item.quantity).toFixed(2)}</td>
                                                       <td className="p-4 text-right font-bold bg-green-50 text-green-800">R$ {(eq.priceMonthly * item.quantity).toFixed(2)}</td>
                                                   </tr>
                                               )
                                           })}
                                       </tbody>
                                       <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300 text-gray-900">
                                            <tr>
                                                <td colSpan={2} className="p-4 text-right uppercase text-gray-500">Subtotal Itens</td>
                                                <td className="p-4 text-right">R$ {totals.daily.toFixed(2)}</td>
                                                <td className="p-4 text-right">R$ {totals.weekly.toFixed(2)}</td>
                                                <td className="p-4 text-right">R$ {totals.biweekly.toFixed(2)}</td>
                                                <td className="p-4 text-right bg-green-100 border-t-2 border-quark-secondary">R$ {totals.monthly.toFixed(2)}</td>
                                           </tr>
                                           <tr>
                                                <td colSpan={2} className="p-4 text-right uppercase text-gray-500">Frete / Entrega</td>
                                                <td className="p-4 text-right text-gray-600">R$ {freight.toFixed(2)}</td>
                                                <td className="p-4 text-right text-gray-600">R$ {freight.toFixed(2)}</td>
                                                <td className="p-4 text-right text-gray-600">R$ {freight.toFixed(2)}</td>
                                                <td className="p-4 text-right bg-green-100">R$ {freight.toFixed(2)}</td>
                                           </tr>
                                           <tr className="text-lg">
                                               <td colSpan={2} className="p-4 text-right uppercase font-extrabold">Total Estimado</td>
                                               <td className="p-4 text-right text-gray-700">R$ {(totals.daily + freight - discount).toFixed(2)}</td>
                                               <td className="p-4 text-right text-gray-700">R$ {(totals.weekly + freight - discount).toFixed(2)}</td>
                                               <td className="p-4 text-right text-gray-700">R$ {(totals.biweekly + freight - discount).toFixed(2)}</td>
                                               <td className="p-4 text-right text-xl text-quark-secondary bg-quark-dark border-t-4 border-quark-secondary">R$ {(totals.monthly + freight - discount).toFixed(2)}</td>
                                           </tr>
                                       </tfoot>
                                   </table>
                               </div>
                           </div>

                           {/* Footer Notes */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-500 mt-8 border-t border-gray-200 pt-6">
                               <div>
                                   <strong className="block text-gray-900 mb-1">Condições de Pagamento</strong>
                                   <p>A combinar. Aceitamos Pix, Boleto e Cartão.</p>
                                   <p className="mt-2">Validade desta proposta: 5 dias.</p>
                               </div>
                               <div className="text-right">
                                   <p>Frete incluso nos totais acima.</p>
                                   <p className="italic mt-1">Quark Locações - Soluções Inteligentes</p>
                               </div>
                           </div>
                       </div>
                       
                       {/* ACTION BAR */}
                       <div className="bg-gray-50 p-6 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                           <div className="flex items-center text-sm text-gray-600">
                               <Shield className="mr-2 text-green-500" size={16}/> Proposta segura gerada pelo sistema.
                           </div>
                           <div className="flex gap-4 w-full md:w-auto">
                               <button 
                                    onClick={downloadProposalPDF}
                                    disabled={isDownloadingProposal}
                                    className="flex-1 md:flex-none bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center shadow-sm"
                                >
                                   {isDownloadingProposal ? 'Baixando...' : <><Download className="mr-2" size={18}/> Baixar Proposta (PDF)</>}
                               </button>
                               <button 
                                    onClick={() => setViewMode('contract')}
                                    className="flex-1 md:flex-none bg-quark-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-black flex items-center justify-center shadow-lg group"
                               >
                                   Avançar para Contrato <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18}/>
                               </button>
                           </div>
                       </div>
                   </div>
               )}
               
               {/* ... existing contract view logic ... */}
               {viewMode === 'contract' && (
                   <div className="animate-slide-up">
                       <button onClick={() => setViewMode('proposal')} className="mb-4 text-gray-500 hover:text-gray-900 font-bold flex items-center text-sm">
                           <ChevronLeft size={16} className="mr-1"/> Voltar para Proposta
                       </button>
                       
                       {/* Period Selection */}
                       <div className="mb-8">
                           <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Confirmar Período e Assinar</h3>
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {Object.values(PeriodType).map((p) => (
                                    <div 
                                        key={p}
                                        onClick={() => setSelectedPeriod(p)}
                                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col items-center justify-center group text-center ${selectedPeriod === p ? 'border-quark-secondary bg-green-50 shadow-lg scale-[1.02]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${selectedPeriod === p ? 'bg-quark-secondary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <Clock size={16} />
                                        </div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{p}</p>
                                        <p className="text-lg font-bold text-gray-900">R$ {prices[p].toFixed(2)}</p>
                                        {selectedPeriod === p && <CheckCircle className="absolute top-2 right-2 text-quark-secondary" size={16}/>}
                                    </div>
                                ))}
                            </div>
                       </div>

                       {/* Contract Preview & Sign */}
                       {selectedPeriod && (
                           <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-slide-up">
                               <div id="printable-area" className="p-8 font-serif bg-white">
                                   {/* HEADER */}
                                   <div className="text-center border-b-2 border-gray-900 pb-6 mb-6">
                                       <img src={settings.logoUrl} alt="Logo" className="h-12 mx-auto mb-2 object-contain grayscale" />
                                       <h2 className="text-xl font-bold uppercase tracking-widest text-black">Contrato de Locação</h2>
                                       <p className="text-xs text-gray-500 font-mono">EMISSÃO: {new Date().toLocaleDateString()}</p>
                                   </div>

                                   {/* PARTIES */}
                                   <div className="grid grid-cols-2 gap-8 text-xs mb-6">
                                       <div>
                                           <strong className="block uppercase text-gray-500 mb-1">Contratada</strong>
                                           <p className="font-bold text-black">{settings.companyName}</p>
                                           <p>{settings.companyDocument}</p>
                                           <p>{settings.companyAddress}</p>
                                       </div>
                                       <div>
                                           <strong className="block uppercase text-gray-500 mb-1">Contratante</strong>
                                           <p className="font-bold text-black">{selectedCustomer?.name}</p>
                                           <p>{selectedCustomer?.document}</p>
                                           <p>{deliveryAddress}</p>
                                       </div>
                                   </div>

                                   {/* ITEMS TABLE */}
                                   <div className="mb-6">
                                       <h4 className="font-bold text-black border-b border-gray-300 mb-2 uppercase text-xs">Itens Locados</h4>
                                       <table className="w-full text-xs text-left">
                                           <thead className="bg-gray-100 uppercase font-bold">
                                               <tr>
                                                   <th className="p-2">Item</th>
                                                   <th className="p-2 text-center">Qtd</th>
                                                   <th className="p-2 text-right">Total ({selectedPeriod})</th>
                                               </tr>
                                           </thead>
                                           <tbody>
                                               {selectedItems.map(item => {
                                                   const eq = equipment.find(e => e.id === item.equipmentId);
                                                   let unitPrice = 0;
                                                   if (eq) {
                                                        if(selectedPeriod === PeriodType.DAILY) unitPrice = eq.priceDaily;
                                                        else if(selectedPeriod === PeriodType.WEEKLY) unitPrice = eq.priceWeekly;
                                                        else if(selectedPeriod === PeriodType.BIWEEKLY) unitPrice = eq.priceBiweekly;
                                                        else unitPrice = eq.priceMonthly;
                                                   }
                                                   return (
                                                       <tr key={item.equipmentId} className="border-b border-gray-100">
                                                           <td className="p-2 font-bold">{eq?.name}</td>
                                                           <td className="p-2 text-center">{item.quantity}</td>
                                                           <td className="p-2 text-right">R$ {(unitPrice * item.quantity).toFixed(2)}</td>
                                                       </tr>
                                                   )
                                               })}
                                           </tbody>
                                       </table>
                                   </div>

                                   {/* TOTAL */}
                                   <div className="flex justify-between items-center border-t-2 border-black pt-4 mb-6">
                                        <div className="text-xs">
                                            <p><strong>Entrega:</strong> {deliveryMethod}</p>
                                            <p><strong>Pagamento:</strong> A combinar na entrega</p>
                                            <p><strong>Frete:</strong> R$ {freight.toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs uppercase font-bold text-gray-500">Total Final</p>
                                            <p className="text-2xl font-bold text-black">R$ {calculateFinalTotal().toFixed(2)}</p>
                                        </div>
                                   </div>

                                   {/* CLAUSES SHORT */}
                                   <div className="text-[10px] text-justify text-gray-600 mb-8 leading-tight space-y-2 bg-gray-50 p-4 rounded">
                                       <p><strong>1. RESPONSABILIDADE:</strong> O LOCATÁRIO declara receber os bens em perfeito estado de funcionamento e conservação, responsabilizando-se por qualquer dano, perda ou extravio, inclusive perante terceiros.</p>
                                       <p><strong>2. DEVOLUÇÃO:</strong> Os equipamentos devem ser devolvidos limpos e no prazo estipulado. O atraso acarretará cobrança de diárias adicionais.</p>
                                       <p>Ao assinar, declaro estar ciente e de acordo com todos os termos.</p>
                                   </div>
                                   
                                   {/* SIGNATURE AREA INSIDE CONTRACT */}
                                   <div className="no-print bg-gray-100 p-4 rounded-xl border border-gray-200">
                                       <p className="text-sm font-bold mb-2 flex items-center"><Shield size={14} className="mr-2 text-quark-dark"/> Assinatura Digital</p>
                                       <div className="bg-white rounded-lg border border-gray-300 overflow-hidden h-40">
                                           <SignaturePad onSave={setSignature} />
                                       </div>
                                   </div>
                                   
                                   {/* SIGNATURE DISPLAY FOR PRINT */}
                                   {signature && (
                                       <div className="mt-4 border-t border-black pt-2 hidden print-block">
                                           <p className="text-xs font-bold uppercase">Assinatura do Locatário</p>
                                           <img src={signature} className="h-16 object-contain" />
                                       </div>
                                   )}
                               </div>

                               <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                                   <button 
                                    onClick={handleCreateOrder}
                                    disabled={!signature || isLoadingSign}
                                    className={`px-8 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center ${!signature ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-quark-primary text-quark-dark hover:bg-white'}`}
                                   >
                                       {isLoadingSign ? 'Processando...' : <>{existingOrder ? 'Atualizar e Re-Assinar' : 'Finalizar e Assinar'} <CheckCircle className="ml-2"/></>}
                                   </button>
                               </div>
                           </div>
                       )}
                   </div>
               )}
          </div>
      )}
      {/* ... existing navigation footer code ... */}
      <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg border-t border-gray-200 p-4 z-50 flex justify-between items-center md:static md:bg-transparent md:border-0 md:p-0 md:mt-8 no-print">
          <button onClick={onCancel} className="px-6 py-3 text-gray-500 font-bold hover:text-red-500 transition-colors">Cancelar</button>
          <div className="flex space-x-3">
              {step > 1 && (
                  <button onClick={() => {
                      if (step === 4 && viewMode === 'contract') {
                          setViewMode('proposal');
                      } else {
                          setStep(step - 1);
                      }
                  }} className="px-6 py-3 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200 transition-colors">
                      <ChevronLeft size={20}/>
                  </button>
              )}
              
              {/* Next Button Logic */}
              {((currentUserRole === 'admin' && step < 3) || (currentUserRole === 'client' && step < 4)) && (
                  <button 
                    onClick={() => {
                        if(step === 1 && !selectedCustomerId) return alert('Erro: Cliente não identificado');
                        if(step === 2 && selectedItems.length === 0) return alert('Selecione pelo menos um item');
                        setStep(step + 1);
                    }} 
                    className="px-8 py-3 bg-quark-dark text-white rounded-xl font-bold hover:bg-black shadow-lg flex items-center"
                  >
                      Próximo <ChevronRight size={20} className="ml-2" />
                  </button>
              )}
          </div>
      </div>
      <style>{`
        .label-title { display: block; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #6B7280; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
        .input-field { width: 100%; padding: 1rem; border-radius: 0.75rem; background-color: #fff; border: 1px solid #E5E7EB; outline: none; transition: all 0.2s; font-weight: 500; }
        .input-field:focus { box-shadow: 0 0 0 2px #1F1D2B; border-color: #1F1D2B; }
        @media print {
            .print-block { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default NewRentalWizard;
