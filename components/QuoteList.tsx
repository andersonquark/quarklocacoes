
import React, { useState } from 'react';
import { RentalOrder, Customer, RentalStatus, Equipment, PeriodType, PortalPayload, AppSettings } from '../types';
import { Eye, Edit, Share2, X, CheckCircle, Key, Plus, Trash2, FileText, Calendar, Download } from 'lucide-react';
import { encodePayload } from '../App';

interface QuoteListProps {
  rentals: RentalOrder[];
  customers: Customer[];
  equipment: Equipment[];
  settings?: AppSettings;
  onUpdateRental: (rental: RentalOrder) => void;
  onDeleteRental: (id: string) => void;
  onCreateNew: () => void;
  onEditRental: (rental: RentalOrder) => void;
  onImportSignature?: (token: string) => void;
}

const QuoteList: React.FC<QuoteListProps> = ({ rentals, customers, equipment, settings, onUpdateRental, onDeleteRental, onCreateNew, onEditRental, onImportSignature }) => {
  const [viewRental, setViewRental] = useState<RentalOrder | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importToken, setImportToken] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Filter specifically for non-active, non-finalized rentals (The Sales Pipeline)
  const quoteStatuses = [RentalStatus.DRAFT, RentalStatus.WAITING_CLIENT_SELECTION, RentalStatus.PENDING_APPROVAL];
  const quotes = rentals.filter(r => quoteStatuses.includes(r.status));

  const getStatusColor = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.PENDING_APPROVAL: return 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse';
      case RentalStatus.WAITING_CLIENT_SELECTION: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const handleApprove = (e: React.MouseEvent, rental: RentalOrder) => {
      e.preventDefault();
      e.stopPropagation();
      
      setIsProcessing(true);
      
      // Use setTimeout to allow UI to update button state first
      setTimeout(() => {
          const updatedRental: RentalOrder = {
              ...rental,
              status: RentalStatus.ACTIVE,
              startDate: new Date().toISOString().split('T')[0] // Starts today
          };
          
          // 1. Update Global State
          onUpdateRental(updatedRental);
          
          // 2. Close Modal
          setViewRental(null);
          
          // 3. Reset Loading
          setIsProcessing(false);

          // 4. User Feedback
          alert("✅ Orçamento APROVADO! O contrato foi movido para a aba 'Aluguéis'.");
      }, 100);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm("Tem certeza que deseja EXCLUIR este orçamento?")) {
          onDeleteRental(id);
      }
  };

  const handleEditClick = (e: React.MouseEvent, quote: RentalOrder) => {
      e.stopPropagation();
      onEditRental(quote);
  };

  const copyShareLink = (e: React.MouseEvent, rentalId: string) => {
      e.stopPropagation();
      const rental = rentals.find(r => r.id === rentalId);
      const customer = customers.find(c => c.id === rental?.customerId);
      
      if (!rental || !customer || !settings) return;

      const relevantEquipmentIds = rental.items.map(i => i.equipmentId);
      
      // Strip heavy data for URL
      const minimalEquipment = equipment
          .filter(e => relevantEquipmentIds.includes(e.id))
          .map(e => ({
              ...e, stockTotal: 0, stockRented: 0, imageUrl: '' 
          }));

      const payload: PortalPayload = {
          rental,
          customer,
          equipmentList: minimalEquipment, 
          settings
      };

      const encoded = encodePayload(payload);
      const baseUrl = window.location.origin + window.location.pathname;
      const link = `${baseUrl}?data=${encoded}`;
      
      const text = `Olá ${customer?.name.split(' ')[0]}! Segue sua proposta comercial para análise: ${link}`;
      
      navigator.clipboard.writeText(text).then(() => {
          alert("LINK COPIADO! Envie para o cliente no WhatsApp.");
      }).catch(() => {
          prompt("Copie o link abaixo:", link);
      });
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    
    const element = document.getElementById('hidden-proposal-print');
    
    if (!element) {
        alert('Erro: Elemento de impressão não encontrado.');
        setIsGeneratingPdf(false);
        return;
    }

    // FORCE VISIBILITY AND WHITE BG FOR CAPTURE
    // Z-Index very high to be on top of modal
    element.style.display = 'flex'; // Use flex to respect layout
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.left = '0';
    element.style.zIndex = '999999';
    element.style.backgroundColor = '#ffffff';
    
    // Scroll to top to ensure capture works
    window.scrollTo(0,0);

    const opt = {
        margin: 0,
        filename: `Proposta-${viewRental?.contractNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            scrollY: 0, 
            backgroundColor: '#ffffff', 
            windowWidth: 794, // EXACT A4 WIDTH
            height: 1123, // EXACT A4 HEIGHT
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
             setIsGeneratingPdf(false);
         }).catch((err: any) => {
             console.error(err);
             element.style.display = 'none';
             setIsGeneratingPdf(false);
         });
    } else {
        alert('Erro: Biblioteca PDF não carregada.');
        setIsGeneratingPdf(false);
    }
  };

  // Calculate totals for hidden print
  const calculatePrintTotals = (rental: RentalOrder) => {
      let tDaily = 0, tWeekly = 0, tBiweekly = 0, tMonthly = 0;
      rental.items.forEach(item => {
          const eq = equipment.find(e => e.id === item.equipmentId);
          if (eq) {
              tDaily += eq.priceDaily * item.quantity;
              tWeekly += eq.priceWeekly * item.quantity;
              tBiweekly += eq.priceBiweekly * item.quantity;
              tMonthly += eq.priceMonthly * item.quantity;
          }
      });
      return { tDaily, tWeekly, tBiweekly, tMonthly };
  };

  // Hidden A4 Content - STRICT DIMENSIONS & FLEX LAYOUT
  const ProposalPrintContent = ({ rental }: { rental: RentalOrder }) => {
      const customer = customers.find(c => c.id === rental.customerId);
      const { tDaily, tWeekly, tBiweekly, tMonthly } = calculatePrintTotals(rental);
      const freight = rental.freightCost || 0;
      const discount = rental.discount || 0;

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
          overflow: 'hidden' // Force crop if overflow
      };

      return (
          <div id="hidden-proposal-print" style={A4_STYLE}>
             
             {/* TOP SECTION: Header, Client, Items */}
             <div>
                 {/* Header */}
                 <div className="flex justify-between items-center border-b-2 border-gray-900 pb-4 mb-6">
                     <div className="flex items-center">
                         {settings?.logoUrl && <img src={settings.logoUrl} className="h-14 mr-4 object-contain grayscale" alt="Logo" />}
                         <div>
                             <h2 className="text-xl font-bold uppercase tracking-tight text-gray-900">Proposta Comercial</h2>
                             <p className="text-xs text-gray-500 font-medium">Nº {rental.contractNumber}</p>
                         </div>
                     </div>
                     <div className="text-right text-[10px] leading-relaxed text-gray-600">
                         <p className="font-bold text-gray-900 text-xs">{settings?.companyName}</p>
                         <p>{settings?.companyDocument}</p>
                         <p>{settings?.companyAddress}</p>
                         <p>{settings?.companyPhone}</p>
                         <p>Data: {new Date(rental.createdAt).toLocaleDateString()}</p>
                     </div>
                 </div>

                 {/* Client Info */}
                 <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl mb-6">
                     <h3 className="text-[10px] font-bold uppercase text-gray-400 mb-2 tracking-wider">Dados do Cliente</h3>
                     <div className="flex justify-between items-start">
                         <div>
                             <p className="text-lg font-bold text-gray-900">{customer?.name}</p>
                             <p className="text-xs text-gray-600 mt-1">{customer?.document}</p>
                         </div>
                         <div className="text-right">
                             <p className="text-xs font-medium text-gray-900">{customer?.phone}</p>
                             <p className="text-xs text-gray-600">{customer?.email}</p>
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
                             {rental.items.map((item, idx) => {
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

             {/* BOTTOM SECTION: Totals, Footer */}
             <div>
                 {/* Totals Table */}
                 <div className="mb-6">
                     <table className="w-full text-[10px]">
                         <tfoot className="font-bold bg-gray-50 border-t-2 border-gray-200">
                             <tr>
                                 <td className="p-2 text-right uppercase text-gray-500 w-[40%]">Subtotal</td>
                                 <td className="p-2 text-right">R$ {tDaily.toFixed(2)}</td>
                                 <td className="p-2 text-right">R$ {tWeekly.toFixed(2)}</td>
                                 <td className="p-2 text-right">R$ {tBiweekly.toFixed(2)}</td>
                                 <td className="p-2 text-right border-l border-gray-200">R$ {tMonthly.toFixed(2)}</td>
                             </tr>
                             <tr>
                                 <td className="p-2 text-right uppercase text-gray-500">Frete</td>
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
                                 <td className="p-3 text-right uppercase font-extrabold text-gray-900">TOTAL</td>
                                 <td className="p-3 text-right">R$ {(tDaily + freight - discount).toFixed(2)}</td>
                                 <td className="p-3 text-right">R$ {(tWeekly + freight - discount).toFixed(2)}</td>
                                 <td className="p-3 text-right">R$ {(tBiweekly + freight - discount).toFixed(2)}</td>
                                 <td className="p-3 text-right text-sm bg-black text-white">R$ {(tMonthly + freight - discount).toFixed(2)}</td>
                             </tr>
                         </tfoot>
                     </table>
                 </div>

                 {/* Footer Info */}
                 <div className="border-t border-gray-200 pt-4 flex justify-between items-end text-[9px] text-gray-500">
                     <div className="max-w-xs">
                         <p className="font-bold uppercase text-gray-700 mb-1">Termos e Condições</p>
                         <p>Proposta válida por 5 dias corridos. Sujeito a disponibilidade de estoque. Pagamento a combinar.</p>
                     </div>
                     <div className="text-right">
                         <p>Documento gerado eletronicamente.</p>
                         <p className="font-bold text-gray-900 mt-1">{settings?.companyName}</p>
                     </div>
                 </div>
             </div>
          </div>
      )
  };

  // Detail Screen within Modal
  const QuoteDetailScreen = ({ rental }: { rental: RentalOrder }) => {
      const customer = customers.find(c => c.id === rental.customerId);
      const { tDaily, tWeekly, tBiweekly, tMonthly } = calculatePrintTotals(rental);
      const freight = rental.freightCost || 0;
      const discount = rental.discount || 0;

      return (
        <div className="bg-white p-8 text-gray-900 font-sans text-sm">
             <div className="flex justify-between items-start border-b border-gray-900 pb-6 mb-6">
                 <div>
                     <h2 className="text-xl font-bold uppercase text-gray-900">Proposta Comercial</h2>
                     <p className="text-xs text-gray-500">#{rental.contractNumber}</p>
                 </div>
                 <div className="text-right text-xs">
                     <p className="font-bold">{customer?.name}</p>
                     <p>{customer?.phone}</p>
                 </div>
             </div>
             
             <div className="mb-8 border border-gray-200 rounded-xl overflow-hidden">
                 <table className="w-full text-left text-xs">
                     <thead className="bg-gray-100 uppercase font-bold text-gray-600">
                         <tr>
                             <th className="p-3">Item</th>
                             <th className="p-3 text-center">Qtd</th>
                             <th className="p-3 text-right">Diária</th>
                             <th className="p-3 text-right">Semanal</th>
                             <th className="p-3 text-right">Quinzenal</th>
                             <th className="p-3 text-right bg-green-50 text-green-800">Mensal</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {rental.items.map(item => {
                             const eq = equipment.find(e => e.id === item.equipmentId);
                             if (!eq) return null;
                             return (
                                 <tr key={item.equipmentId}>
                                     <td className="p-3 font-bold text-gray-800">{eq.name}</td>
                                     <td className="p-3 text-center">{item.quantity}</td>
                                     <td className="p-3 text-right">R$ {(eq.priceDaily * item.quantity).toFixed(2)}</td>
                                     <td className="p-3 text-right">R$ {(eq.priceWeekly * item.quantity).toFixed(2)}</td>
                                     <td className="p-3 text-right">R$ {(eq.priceBiweekly * item.quantity).toFixed(2)}</td>
                                     <td className="p-3 text-right font-bold bg-green-50/50 text-green-800">R$ {(eq.priceMonthly * item.quantity).toFixed(2)}</td>
                                 </tr>
                             )
                         })}
                     </tbody>
                     <tfoot className="bg-gray-50 font-bold text-gray-900">
                         <tr>
                            <td colSpan={2} className="p-3 text-right uppercase text-gray-500">Frete / Entrega</td>
                            <td className="p-3 text-right">R$ {freight.toFixed(2)}</td>
                            <td className="p-3 text-right">R$ {freight.toFixed(2)}</td>
                            <td className="p-3 text-right">R$ {freight.toFixed(2)}</td>
                            <td className="p-3 text-right bg-green-50/50">R$ {freight.toFixed(2)}</td>
                         </tr>
                         <tr className="border-t-2 border-gray-200 text-sm">
                             <td colSpan={2} className="p-3 text-right uppercase font-extrabold">TOTAL FINAL</td>
                             <td className="p-3 text-right">R$ {(tDaily + freight - discount).toFixed(2)}</td>
                             <td className="p-3 text-right">R$ {(tWeekly + freight - discount).toFixed(2)}</td>
                             <td className="p-3 text-right">R$ {(tBiweekly + freight - discount).toFixed(2)}</td>
                             <td className="p-3 text-right bg-black text-white">R$ {(tMonthly + freight - discount).toFixed(2)}</td>
                         </tr>
                     </tfoot>
                 </table>
             </div>
             
             {rental.signature ? (
                 <div className="mt-8 bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between">
                     <div>
                         <p className="font-bold text-green-800 flex items-center"><CheckCircle className="mr-2" size={16}/> Proposta Assinada</p>
                         <p className="text-xs text-green-600 mt-1">Modalidade escolhida: {rental.periodType}</p>
                     </div>
                     <img src={rental.signature} className="h-12 object-contain mix-blend-multiply" alt="Assinatura" />
                 </div>
             ) : (
                 <div className="mt-8 bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-center">
                     <p className="text-yellow-800 font-bold text-sm">Aguardando Assinatura do Cliente</p>
                 </div>
             )}
        </div>
      );
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in pb-20">
      {viewRental && (
          <ProposalPrintContent rental={viewRental} />
      )}

      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Orçamentos</h2>
            <p className="text-gray-500 mt-1">Gerencie propostas e negociações.</p>
        </div>
        
        <div className="flex gap-2">
             <button 
                onClick={() => setIsImportModalOpen(true)}
                className="bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl flex items-center hover:bg-gray-50 shadow-sm font-bold text-sm"
             >
                 <Key size={16} className="mr-2" /> Validar Assinatura
             </button>
             <button 
                onClick={onCreateNew}
                className="bg-quark-dark text-white px-5 py-3 rounded-xl flex items-center hover:bg-black transition-all shadow-lg font-medium"
             >
                <Plus size={20} className="mr-2" /> Novo Orçamento
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
          {quotes.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                  <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-lg font-bold text-gray-500">Nenhum orçamento em aberto</h3>
                  <p className="text-sm text-gray-400">Crie uma nova proposta para começar.</p>
              </div>
          )}

          {quotes.map((quote) => {
            const customer = customers.find(c => c.id === quote.customerId);
            return (
                <div key={quote.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border ${quote.status === RentalStatus.PENDING_APPROVAL ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            #{quote.contractNumber.substring(0,3)}
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-lg">{customer?.name}</h4>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                                <Calendar size={12} className="mr-1"/> {new Date(quote.createdAt).toLocaleDateString()} 
                                <span className="mx-2">•</span>
                                {quote.items.length} itens
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${getStatusColor(quote.status)}`}>
                            {quote.status === RentalStatus.PENDING_APPROVAL ? 'Assinado / Em Análise' : 'Em Aberto'}
                        </span>

                        <div className="flex items-center gap-2">
                            <button onClick={(e) => copyShareLink(e, quote.id)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100" title="Compartilhar Link">
                                <Share2 size={18} />
                            </button>
                            <button onClick={(e) => handleEditClick(e, quote)} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200" title="Editar">
                                <Edit size={18} />
                            </button>
                            <button onClick={() => setViewRental(quote)} className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200" title="Visualizar">
                                <Eye size={18} />
                            </button>
                            <button onClick={(e) => handleDeleteClick(e, quote.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100" title="Excluir">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )
          })}
      </div>

      {/* VIEW / APPROVE MODAL */}
      {viewRental && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 modal-wrapper">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="text-xl font-bold text-gray-900">Detalhes do Orçamento</h3>
                 <button onClick={() => setViewRental(null)} className="p-2 hover:bg-gray-200 rounded-full"><X className="text-gray-500" /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-gray-100">
                 <QuoteDetailScreen rental={viewRental} />
             </div>

             <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center">
                 <button 
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPdf}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 flex items-center"
                 >
                    {isGeneratingPdf ? 'Gerando PDF...' : <><Download size={20} className="mr-2"/> Baixar Proposta (A4)</>}
                 </button>

                 {viewRental.status === RentalStatus.PENDING_APPROVAL ? (
                     <button 
                        onClick={(e) => handleApprove(e, viewRental)}
                        disabled={isProcessing}
                        className="bg-quark-primary text-quark-dark px-6 py-3 rounded-xl font-bold hover:bg-black hover:text-white transition-colors flex items-center justify-center shadow-lg"
                     >
                         {isProcessing ? 'Processando...' : <><CheckCircle className="mr-2" size={20} /> APROVAR ORÇAMENTO</>}
                     </button>
                 ) : (
                     <span className="text-sm text-gray-500 italic">Aguardando assinatura do cliente.</span>
                 )}
             </div>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {isImportModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-xl p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center"><Key className="mr-2 text-quark-dark"/> Validar Assinatura</h3>
                  <textarea 
                    className="w-full h-32 p-3 bg-gray-50 rounded-xl border border-gray-200 font-mono text-xs mb-4"
                    placeholder="Cole o token recebido no WhatsApp..."
                    value={importToken}
                    onChange={(e) => setImportToken(e.target.value)}
                  />
                  <div className="flex gap-4">
                      <button onClick={() => setIsImportModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">Cancelar</button>
                      <button 
                        onClick={() => {
                            if(onImportSignature && importToken) {
                                onImportSignature(importToken);
                                setIsImportModalOpen(false);
                            }
                        }}
                        className="flex-1 py-3 bg-quark-dark text-white rounded-xl font-bold"
                      >
                          Validar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default QuoteList;
