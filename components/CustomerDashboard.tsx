
import React, { useState } from 'react';
import { Customer, RentalOrder, RentalStatus, Equipment } from '../types';
import { FileText, Clock, Package, LogOut, Calendar, X, Download, RefreshCw, Edit } from 'lucide-react';

interface CustomerDashboardProps {
    customer: Customer;
    rentals: RentalOrder[];
    equipment?: Equipment[]; // Needed for receipt view details
    onRequestNew: () => void;
    onLogout: () => void;
    onOpenContract?: (rentalId: string) => void;
    onEditRental?: (rental: RentalOrder) => void; // New prop
    onRenewRental?: (rental: RentalOrder) => void; // New prop
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ customer, rentals, equipment = [], onRequestNew, onLogout, onOpenContract, onEditRental, onRenewRental }) => {
    const [selectedHistoryRental, setSelectedHistoryRental] = useState<RentalOrder | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const myRentals = rentals.filter(r => r.customerId === customer.id);
    const active = myRentals.filter(r => r.status === RentalStatus.ACTIVE);
    const pending = myRentals.filter(r => r.status === RentalStatus.PENDING_APPROVAL || r.status === RentalStatus.WAITING_CLIENT_SELECTION);

    const handleDownloadPDF = () => {
      if (!selectedHistoryRental) return;
      setIsGeneratingPdf(true);
      const element = document.getElementById('printable-area');
      
      if (!element) {
          alert('Elemento não encontrado.');
          setIsGeneratingPdf(false);
          return;
      }

      const opt = {
          margin: [5, 5, 5, 5],
          filename: `Contrato-${selectedHistoryRental.contractNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
              scale: 2, 
              useCORS: true, 
              scrollY: 0, // Fix for blank PDF
              backgroundColor: '#ffffff', // Fix for transparent background
              windowWidth: 800
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      if (window.html2pdf) {
           // @ts-ignore
           window.html2pdf().set(opt).from(element).save().then(() => {
               setIsGeneratingPdf(false);
           }).catch((err: any) => {
               console.error(err);
               alert('Erro ao gerar PDF.');
               setIsGeneratingPdf(false);
           });
      } else {
          alert('Biblioteca PDF ainda carregando...');
          setIsGeneratingPdf(false);
      }
    };

    return (
        <div className="min-h-screen bg-[#F2F2F7] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 no-print">
                <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                         <div className="w-10 h-10 bg-quark-dark text-quark-primary rounded-xl flex items-center justify-center font-bold text-lg mr-3">
                             {customer.name.charAt(0)}
                         </div>
                         <div>
                             <h1 className="text-lg font-bold text-gray-900 leading-tight">Olá, {customer.name.split(' ')[0]}</h1>
                             <p className="text-xs text-gray-500">Painel do Cliente</p>
                         </div>
                    </div>
                    <button onClick={onLogout} className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors flex items-center bg-gray-100 px-3 py-2 rounded-lg">
                        <LogOut size={16} className="mr-2"/> Sair
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8 animate-fade-in space-y-8 no-print">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Pedidos</p>
                        <p className="text-2xl font-bold text-gray-900">{myRentals.length}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Em Uso</p>
                        <p className="text-2xl font-bold text-blue-600">{active.length}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Em Análise</p>
                        <p className="text-2xl font-bold text-orange-500">{pending.length}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Devolvidos</p>
                        <p className="text-2xl font-bold text-green-600">{myRentals.filter(r => r.status === RentalStatus.RETURNED).length}</p>
                    </div>
                </div>

                {/* Recent Orders */}
                <div>
                    <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
                        <FileText className="mr-2" size={20}/> Histórico de Locações
                    </h3>
                    
                    <div className="space-y-3">
                        {myRentals.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <Package size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">Nenhum pedido ainda</h4>
                                <p className="text-gray-400 text-sm">Seus orçamentos e contratos aparecerão aqui.</p>
                            </div>
                        ) : (
                            myRentals.slice().reverse().map(rental => (
                                <div 
                                    key={rental.id} 
                                    className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between relative overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-quark-primary/30`}
                                    onClick={() => {
                                        // LOGIC FIX: If waiting or pending, go to portal/contract. If active/done, show history.
                                        if (rental.status === RentalStatus.WAITING_CLIENT_SELECTION || rental.status === RentalStatus.PENDING_APPROVAL) {
                                            if(onOpenContract) onOpenContract(rental.id); 
                                        } else {
                                            setSelectedHistoryRental(rental);
                                        }
                                    }}
                                >
                                    {rental.status === RentalStatus.WAITING_CLIENT_SELECTION && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-quark-primary"></div>
                                    )}

                                    <div className="flex items-center mb-4 sm:mb-0">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xs mr-4 shrink-0 border ${
                                            rental.status === RentalStatus.ACTIVE ? 'bg-green-50 text-green-700 border-green-100' : 
                                            rental.status === RentalStatus.WAITING_CLIENT_SELECTION ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
                                            'bg-gray-50 text-gray-500 border-gray-100'
                                        }`}>
                                            #{rental.contractNumber.substring(0,3)}
                                        </div>
                                        <div>
                                            <div className="flex items-center">
                                                <h4 className="font-bold text-gray-900 mr-2">
                                                    {rental.items.length} {rental.items.length === 1 ? 'Item' : 'Itens'}
                                                </h4>
                                                {rental.periodType && (
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-md">{rental.periodType}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 flex items-center mt-1">
                                                <Calendar size={12} className="mr-1"/> {new Date(rental.createdAt).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                         
                                         {/* STATUS BADGE */}
                                         <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center ${
                                             rental.status === RentalStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                                             rental.status === RentalStatus.PENDING_APPROVAL ? 'bg-orange-100 text-orange-700' :
                                             rental.status === RentalStatus.WAITING_CLIENT_SELECTION ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                                             'bg-gray-100 text-gray-500'
                                         }`}>
                                             {rental.status === RentalStatus.WAITING_CLIENT_SELECTION ? 'Continuar / Assinar' : rental.status}
                                         </div>

                                         {/* ACTIONS */}
                                         <div className="flex items-center space-x-2 z-20">
                                            {(rental.status === RentalStatus.PENDING_APPROVAL) && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); if(onEditRental) onEditRental(rental); }}
                                                    className="p-2 bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 rounded-lg text-gray-600 transition-colors text-xs font-bold flex items-center shadow-sm"
                                                    title="Editar Pedido"
                                                >
                                                    <Edit size={14} className="mr-1"/> Editar
                                                </button>
                                            )}
                                            {(rental.status === RentalStatus.ACTIVE || rental.status === RentalStatus.LATE || rental.status === RentalStatus.RETURNED) && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); if(onRenewRental) onRenewRental(rental); }}
                                                    className="p-2 bg-white border border-gray-200 hover:bg-quark-dark hover:text-white hover:border-quark-dark rounded-lg text-gray-600 transition-colors text-xs font-bold flex items-center shadow-sm"
                                                    title="Renovar Contrato"
                                                >
                                                    <RefreshCw size={14} className="mr-1"/> Renovar
                                                </button>
                                            )}
                                         </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Full Contract View Modal (for History) */}
            {selectedHistoryRental && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print modal-wrapper">
                    <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
                         <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                             <h3 className="font-bold text-gray-900">Detalhes do Contrato</h3>
                             <button onClick={() => setSelectedHistoryRental(null)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
                         </div>
                         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                             {/* This div matches the print styles */}
                             <div id="printable-area" className="bg-white p-8 border border-gray-200 text-sm font-serif shadow-sm">
                                 <div className="text-center border-b border-black pb-4 mb-4">
                                     <h2 className="text-xl font-bold uppercase text-black">Contrato de Locação</h2>
                                     <p className="font-mono text-xs text-black">#{selectedHistoryRental.contractNumber}</p>
                                 </div>
                                 
                                 <div className="mb-4">
                                     <h4 className="font-bold uppercase text-xs mb-2 bg-gray-100 p-1 text-black">Equipamentos</h4>
                                     <table className="w-full text-xs text-left text-black">
                                         <thead>
                                             <tr className="border-b">
                                                 <th className="py-1">Item</th>
                                                 <th className="py-1 text-center">Qtd</th>
                                                 <th className="py-1 text-right">Subtotal</th>
                                             </tr>
                                         </thead>
                                         <tbody>
                                             {selectedHistoryRental.items.map(i => {
                                                 const eq = equipment.find(e => e.id === i.equipmentId);
                                                 // Determine price based on contract period
                                                 let price = 0;
                                                 if(eq && selectedHistoryRental.periodType) {
                                                      if(selectedHistoryRental.periodType === 'Diária') price = eq.priceDaily;
                                                      else if(selectedHistoryRental.periodType === 'Semanal') price = eq.priceWeekly;
                                                      else if(selectedHistoryRental.periodType === 'Quinzenal') price = eq.priceBiweekly;
                                                      else price = eq.priceMonthly;
                                                 }
                                                 return (
                                                     <tr key={i.equipmentId} className="border-b border-gray-100">
                                                         <td className="py-1 font-medium">{eq?.name}</td>
                                                         <td className="py-1 text-center">{i.quantity}</td>
                                                         <td className="py-1 text-right">R$ {(price * i.quantity).toFixed(2)}</td>
                                                     </tr>
                                                 )
                                             })}
                                         </tbody>
                                     </table>
                                 </div>
                                 
                                 <div className="text-right border-t border-black pt-2 text-black">
                                     <p className="font-bold text-lg">Total: R$ {selectedHistoryRental.totalValue.toFixed(2)}</p>
                                 </div>

                                 {selectedHistoryRental.signature && (
                                     <div className="mt-6 border-t border-black pt-4">
                                         <p className="text-xs font-bold uppercase text-black">Assinado Digitalmente</p>
                                         <img src={selectedHistoryRental.signature} className="h-12 object-contain mt-1" alt="Signature" />
                                         <p className="text-[10px] text-gray-500 mt-1">{selectedHistoryRental.signatureMetadata?.timestamp}</p>
                                     </div>
                                 )}
                             </div>
                         </div>
                         <div className="p-4 bg-gray-50 flex justify-end border-t border-gray-100">
                             <button 
                                onClick={handleDownloadPDF} 
                                disabled={isGeneratingPdf}
                                className="flex items-center bg-quark-dark text-white px-4 py-2 rounded-xl font-bold shadow-lg hover:bg-black"
                             >
                                 {isGeneratingPdf ? 'Baixando...' : <><Download size={18} className="mr-2"/> Baixar PDF</>}
                             </button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;
