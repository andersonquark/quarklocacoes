
import React, { useState } from 'react';
import { RentalOrder, Customer, RentalStatus, Equipment, PeriodType, AppSettings } from '../types';
import { Eye, Edit, X, Download, Trash2, Share2 } from 'lucide-react';

interface RentalListProps {
  rentals: RentalOrder[];
  customers: Customer[];
  equipment: Equipment[];
  settings?: AppSettings;
  onUpdateRental: (rental: RentalOrder) => void;
  onDeleteRental: (id: string) => void;
}

const RentalList: React.FC<RentalListProps> = ({ rentals, customers, equipment, settings, onUpdateRental, onDeleteRental }) => {
  const [filter, setFilter] = useState<string>('ACTIVE');
  const [viewRental, setViewRental] = useState<RentalOrder | null>(null);
  const [editRental, setEditRental] = useState<RentalOrder | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // STRICTLY OPERATIONAL STATUSES
  const operationalRentals = rentals.filter(r => [RentalStatus.ACTIVE, RentalStatus.LATE, RentalStatus.RETURNED, RentalStatus.CANCELLED].includes(r.status));

  const getStatusColor = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.ACTIVE: return 'bg-green-50 text-green-700 border-green-200';
      case RentalStatus.LATE: return 'bg-red-50 text-red-700 border-red-200';
      case RentalStatus.RETURNED: return 'bg-gray-100 text-gray-600 border-gray-200';
      case RentalStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200 line-through';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const handleSaveEdit = () => {
      if(editRental) {
          let newTotal = editRental.totalValue;
          // Recalculate if period changed
          if (editRental.periodType) {
              let subTotal = 0;
              editRental.items.forEach(item => {
                  const eq = equipment.find(e => e.id === item.equipmentId);
                  if(eq) {
                      let price = 0;
                      if(editRental.periodType === PeriodType.DAILY) price = eq.priceDaily;
                      if(editRental.periodType === PeriodType.WEEKLY) price = eq.priceWeekly;
                      if(editRental.periodType === PeriodType.BIWEEKLY) price = eq.priceBiweekly;
                      if(editRental.periodType === PeriodType.MONTHLY) price = eq.priceMonthly;
                      subTotal += price * item.quantity;
                  }
              });
              newTotal = subTotal + editRental.freightCost - editRental.discount;
          }
          onUpdateRental({ ...editRental, totalValue: newTotal });
          setEditRental(null);
      }
  }

  const handleDelete = (id: string) => {
      if(window.confirm('ATENÇÃO: Tem certeza que deseja excluir este contrato? Se ele estiver ativo, os itens serão devolvidos ao estoque.')) {
          onDeleteRental(id);
      }
  }

  const handleDownloadPDF = () => {
      if (!viewRental) return;
      setIsGeneratingPdf(true);
      const element = document.getElementById('hidden-admin-print');
      
      if (!element) {
          alert('Elemento não encontrado.');
          setIsGeneratingPdf(false);
          return;
      }
      element.style.display = 'block';

      const opt = {
          margin: 0,
          filename: `Contrato-${viewRental.contractNumber}.pdf`,
          image: { type: 'jpeg', quality: 1 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0, backgroundColor: '#ffffff', windowWidth: 800 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      if (window.html2pdf) {
           // @ts-ignore
           window.html2pdf().set(opt).from(element).save().then(() => {
               element.style.display = 'none';
               setIsGeneratingPdf(false);
           }).catch((err: any) => {
               element.style.display = 'none';
               console.error(err);
               setIsGeneratingPdf(false);
           });
      } else {
          setIsGeneratingPdf(false);
      }
  };

  const filteredRentals = filter === 'ALL' ? operationalRentals : operationalRentals.filter(r => r.status === filter);

  const AdminContractContent = ({ rental }: { rental: RentalOrder }) => {
      const customer = customers.find(c => c.id === rental.customerId);
      const finalTotal = rental.totalValue;
      
      return (
        <div className="bg-white p-10 text-gray-900 font-serif text-sm leading-relaxed">
             <div className="text-center border-b-2 border-gray-900 pb-6 mb-8">
                 {settings?.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-16 mx-auto mb-4 object-contain grayscale" />}
                 <h2 className="text-3xl font-bold uppercase tracking-widest mb-2">Contrato de Locação</h2>
                 <p className="font-mono text-sm text-gray-600">REGISTRO: {rental.contractNumber}</p>
             </div>
             
             <div className="grid grid-cols-2 gap-8 mb-8 border border-gray-300 p-6 rounded-lg bg-gray-50">
                 <div>
                     <strong className="block text-xs font-bold uppercase mb-2 text-gray-500">Contratada</strong>
                     <p className="font-bold text-lg">{settings?.companyName}</p>
                     <p>CNPJ: {settings?.companyDocument}</p>
                 </div>
                 <div>
                     <strong className="block text-xs font-bold uppercase mb-2 text-gray-500">Contratante</strong>
                     <p className="font-bold text-lg">{customer?.name}</p>
                     <p>Doc: {customer?.document}</p>
                 </div>
             </div>
             
             <div className="mb-8">
                 <h3 className="font-bold uppercase border-b border-gray-300 mb-4 pb-2">1. Equipamentos Locados</h3>
                 <table className="w-full text-left border-collapse border border-gray-300">
                     <thead className="bg-gray-100 uppercase text-xs">
                         <tr>
                             <th className="p-3 border border-gray-300">Item</th>
                             <th className="p-3 border border-gray-300 text-center">Qtd</th>
                             <th className="p-3 border border-gray-300 text-right">Valor Unit.</th>
                             <th className="p-3 border border-gray-300 text-right">Total</th>
                         </tr>
                     </thead>
                     <tbody>
                         {rental.items.map(item => {
                              const eq = equipment.find(e => e.id === item.equipmentId);
                              let unitPrice = 0;
                              if (eq && rental.periodType) {
                                  switch(rental.periodType) {
                                      case PeriodType.DAILY: unitPrice = eq.priceDaily; break;
                                      case PeriodType.WEEKLY: unitPrice = eq.priceWeekly; break;
                                      case PeriodType.BIWEEKLY: unitPrice = eq.priceBiweekly; break;
                                      case PeriodType.MONTHLY: unitPrice = eq.priceMonthly; break;
                                  }
                              }
                              return (
                                  <tr key={item.equipmentId}>
                                      <td className="p-3 border border-gray-300 font-medium">{eq?.name}</td>
                                      <td className="p-3 border border-gray-300 text-center">{item.quantity}</td>
                                      <td className="p-3 border border-gray-300 text-right">R$ {unitPrice.toFixed(2)}</td>
                                      <td className="p-3 border border-gray-300 text-right font-bold">R$ {(unitPrice * item.quantity).toFixed(2)}</td>
                                  </tr>
                              )
                         })}
                     </tbody>
                     <tfoot className="bg-gray-50 font-bold">
                         <tr>
                             <td colSpan={3} className="p-3 border border-gray-300 text-right uppercase">Valor Total</td>
                             <td className="p-3 border border-gray-300 text-right text-lg">R$ {finalTotal.toFixed(2)}</td>
                         </tr>
                     </tfoot>
                 </table>
             </div>
             
             {rental.signature && (
                 <div className="mt-12 pt-6 border-t-2 border-gray-800 flex justify-between items-end">
                     <div>
                         <p className="font-bold uppercase mb-2">Assinado Digitalmente</p>
                         <p className="text-lg">{customer?.name}</p>
                         <p className="text-xs text-gray-500">{rental.signatureMetadata?.timestamp}</p>
                     </div>
                     <img src={rental.signature} className="h-20 object-contain" alt="Assinatura" />
                 </div>
             )}
        </div>
      );
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in pb-20">
      {/* Hidden Element for Admin Printing */}
      {viewRental && (
          <div id="hidden-admin-print" style={{ display: 'none', width: '800px', position: 'absolute', top: '-9999px', left: '-9999px' }}>
              <AdminContractContent rental={viewRental} />
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Aluguéis Ativos</h2>
            <p className="text-gray-500 mt-1">Logística e contratos em andamento.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm max-w-full no-scrollbar w-full md:w-auto mb-6">
          {[
              { label: 'Ativos', val: RentalStatus.ACTIVE },
              { label: 'Atrasados', val: RentalStatus.LATE },
              { label: 'Devolvidos', val: RentalStatus.RETURNED },
              { label: 'Todos', val: 'ALL' }
          ].map((opt) => (
             <button
                key={opt.val}
                onClick={() => setFilter(opt.val)}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-1 md:flex-none ${filter === opt.val ? 'bg-quark-dark text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
             >
                {opt.label}
             </button>
          ))}
        </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase">Contrato</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase">Cliente</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase">Período</th>
                <th className="px-6 py-5 text-right text-xs font-bold text-gray-400 uppercase">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredRentals.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400">Nenhum aluguel encontrado nesta categoria.</td></tr>
                )}
                {filteredRentals.map((rental) => {
                const customer = customers.find(c => c.id === rental.customerId);
                return (
                    <tr key={rental.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        #{rental.contractNumber}
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{customer?.name}</div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border uppercase ${getStatusColor(rental.status)}`}>
                        {rental.status}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                        {rental.periodType}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                        <button onClick={() => setViewRental(rental)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><Eye size={16} /></button>
                        <button onClick={() => setEditRental(rental)} className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"><Edit size={16} /></button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(rental.id); }} 
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                            <Trash2 size={16} />
                        </button>
                    </td>
                    </tr>
                );
                })}
            </tbody>
            </table>
        </div>
      </div>

      {/* VIEW MODAL */}
      {viewRental && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-wrapper">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="text-xl font-bold text-gray-900">Contrato #{viewRental.contractNumber}</h3>
                 <button onClick={() => setViewRental(null)} className="p-2 hover:bg-gray-200 rounded-full"><X className="text-gray-500" /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-gray-100">
                 <div className="bg-white p-8 shadow-sm border border-gray-300 text-sm font-serif">
                     <AdminContractContent rental={viewRental} />
                 </div>
             </div>

             <div className="p-6 border-t border-gray-100 bg-white flex justify-end space-x-3">
                 <button 
                    onClick={handleDownloadPDF} 
                    disabled={isGeneratingPdf}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 flex items-center"
                 >
                     {isGeneratingPdf ? 'Baixando...' : <><Download className="mr-2" size={20} /> Baixar PDF</>}
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editRental && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-8 animate-scale-in">
                <h3 className="text-2xl font-bold mb-6">Editar Locação</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                        <select 
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                            value={editRental.status}
                            onChange={(e) => setEditRental({...editRental, status: e.target.value as RentalStatus})}
                        >
                            {[RentalStatus.ACTIVE, RentalStatus.LATE, RentalStatus.RETURNED, RentalStatus.CANCELLED].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Período</label>
                        <select 
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                            value={editRental.periodType || ''}
                            onChange={(e) => setEditRental({...editRental, periodType: e.target.value as PeriodType})}
                        >
                            {Object.values(PeriodType).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex gap-4 mt-8">
                    <button onClick={() => setEditRental(null)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Cancelar</button>
                    <button onClick={handleSaveEdit} className="flex-1 py-3 bg-quark-dark text-white rounded-xl font-bold">Salvar Alterações</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default RentalList;
