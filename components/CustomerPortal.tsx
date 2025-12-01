
import React, { useState } from 'react';
import { RentalOrder, Customer, Equipment, SignatureMetadata, PeriodType, DeliveryMethod, AppSettings, PortalPayload, RentalStatus } from '../types';
import SignaturePad from './SignaturePad';
import { CheckCircle, ArrowRight, Box, FileText, Shield, Clock, Send, Download, Home, MapPin } from 'lucide-react';
import { encodePayload } from '../App';

interface CustomerPortalProps {
  rental: RentalOrder;
  customer: Customer;
  equipment: Equipment[];
  settings: AppSettings;
  isStandalone?: boolean; 
  onSign: (signature: string, metadata: SignatureMetadata, selectedPeriod: PeriodType, finalTotal: number) => void;
  onBackToHome?: () => void; 
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ rental, customer, equipment, settings, isStandalone, onSign, onBackToHome }) => {
  const [step, setStep] = useState<'intro' | 'selection' | 'sign' | 'success'>('intro');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType | null>(null);
  const [signature, setSignature] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [signedToken, setSignedToken] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const calculatePriceForPeriod = (period: PeriodType) => {
      let subTotal = 0;
      rental.items.forEach(item => {
          const eq = equipment.find(e => e.id === item.equipmentId);
          if (eq) {
              let unitPrice = 0;
              switch(period) {
                  case PeriodType.DAILY: unitPrice = eq.priceDaily; break;
                  case PeriodType.WEEKLY: unitPrice = eq.priceWeekly; break;
                  case PeriodType.BIWEEKLY: unitPrice = eq.priceBiweekly; break;
                  case PeriodType.MONTHLY: unitPrice = eq.priceMonthly; break;
              }
              subTotal += unitPrice * item.quantity;
          }
      });
      const freight = rental.freightCost || 0;
      const discount = rental.discount || 0;
      return subTotal + freight - discount;
  };

  const prices = {
      [PeriodType.DAILY]: calculatePriceForPeriod(PeriodType.DAILY),
      [PeriodType.WEEKLY]: calculatePriceForPeriod(PeriodType.WEEKLY),
      [PeriodType.BIWEEKLY]: calculatePriceForPeriod(PeriodType.BIWEEKLY),
      [PeriodType.MONTHLY]: calculatePriceForPeriod(PeriodType.MONTHLY),
  };

  const finalTotal = selectedPeriod ? prices[selectedPeriod] : 0;

  const handleConfirmSign = async () => {
      if (!selectedPeriod) return;
      setIsLoadingLocation(true);
      try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const metadata: SignatureMetadata = {
              ip: "189.32.11.55", 
              userAgent: navigator.userAgent,
              timestamp: new Date().toLocaleString('pt-BR'),
              latitude: -23.5505,
              longitude: -46.6333,
              locationString: "São Paulo, SP (Geolocalização Confirmada)"
          };

          onSign(signature, metadata, selectedPeriod, finalTotal);

          if (isStandalone) {
               const signedRental: RentalOrder = {
                   ...rental,
                   status: RentalStatus.PENDING_APPROVAL,
                   periodType: selectedPeriod,
                   totalValue: finalTotal,
                   signature: signature,
                   signatureMetadata: metadata
               };

               const payload: PortalPayload = {
                   rental: signedRental,
                   customer,
                   equipmentList: equipment,
                   settings
               };

               const token = encodePayload(payload);
               setSignedToken(token);
          }
          setStep('success');
      } catch (error) {
          alert("Ocorreu um erro ao processar a assinatura. Tente novamente.");
      } finally {
          setIsLoadingLocation(false);
      }
  };

  const handleDownloadPDF = () => {
      setIsGeneratingPdf(true);
      
      // Use the HIDDEN fixed-width element for PDF generation to avoid layout shift
      const element = document.getElementById('hidden-print-contract');
      
      if (!element) {
          alert('Erro: Elemento do contrato não encontrado.');
          setIsGeneratingPdf(false);
          return;
      }

      // Reveal explicitly for capture (it's usually hidden via CSS)
      element.style.display = 'block';
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.zIndex = '99999';
      element.style.backgroundColor = '#ffffff';

      // Scroll to top
      window.scrollTo(0,0);

      const opt = {
          margin: 0,
          filename: `Contrato-${rental.contractNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
              scale: 2, 
              useCORS: true, 
              scrollY: 0, 
              backgroundColor: '#ffffff',
              windowWidth: 794, // A4 Width
              height: 1123
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // @ts-ignore
      if (window.html2pdf) {
           // @ts-ignore
           window.html2pdf().set(opt).from(element).save().then(() => {
               element.style.display = 'none'; 
               element.style.zIndex = '-9999';
               setIsGeneratingPdf(false);
           }).catch((err: any) => {
               element.style.display = 'none';
               console.error(err);
               setIsGeneratingPdf(false);
           });
      } else {
          alert('Biblioteca PDF carregando...');
          setIsGeneratingPdf(false);
      }
  };

  const sendToWhatsApp = () => {
      const text = `Olá, acabei de assinar o contrato #${rental.contractNumber}. Segue o código de validação:\n\n${signedToken}`;
      const url = `https://wa.me/${settings.companyPhone.replace(/\D/g,'')}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  // --- RENDER HELPERS ---
  const ContractContent = () => (
      <div className="bg-white p-10 text-gray-900 font-sans text-sm leading-relaxed box-border relative" style={{ width: '794px', height: '1123px' }}>
         {/* Header */}
         <div className="text-center border-b-2 border-gray-900 pb-6 mb-8">
             <img src={settings.logoUrl} alt="Logo" className="h-16 mx-auto mb-4 object-contain grayscale" />
             <h2 className="text-3xl font-bold uppercase tracking-widest mb-2">Contrato de Locação</h2>
             <p className="font-mono text-sm text-gray-600">REGISTRO: {rental.contractNumber}</p>
         </div>

         {/* Parties */}
         <div className="grid grid-cols-2 gap-8 mb-8 border border-gray-300 p-6 rounded-lg bg-gray-50">
             <div>
                 <strong className="block text-xs font-bold uppercase mb-2 text-gray-500">Contratada</strong>
                 <p className="font-bold text-lg">{settings.companyName}</p>
                 <p>CNPJ: {settings.companyDocument}</p>
                 <p>{settings.companyAddress}</p>
             </div>
             <div>
                 <strong className="block text-xs font-bold uppercase mb-2 text-gray-500">Contratante</strong>
                 <p className="font-bold text-lg">{customer.name}</p>
                 <p>Doc: {customer.document}</p>
                 <p>{customer.address}</p>
             </div>
         </div>

         {/* Items */}
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
                          if (eq && selectedPeriod) {
                              switch(selectedPeriod) {
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
                         <td colSpan={3} className="p-3 border border-gray-300 text-right uppercase">Valor Total do Contrato</td>
                         <td className="p-3 border border-gray-300 text-right text-lg">R$ {finalTotal.toFixed(2)}</td>
                     </tr>
                 </tfoot>
             </table>
         </div>

         {/* Terms */}
         <div className="mb-8">
             <h3 className="font-bold uppercase border-b border-gray-300 mb-4 pb-2">2. Cláusulas e Condições</h3>
             <div className="text-justify text-xs space-y-3 text-gray-800">
                 <p><strong>2.1. DA CONSERVAÇÃO:</strong> O LOCATÁRIO declara receber os bens em perfeito estado, responsabilizando-se por danos.</p>
                 <p><strong>2.2. DA DEVOLUÇÃO:</strong> Os equipamentos devem ser devolvidos limpos e no prazo. Atrasos geram cobrança adicional.</p>
                 <p><strong>2.3. DA INADIMPLÊNCIA:</strong> O atraso no pagamento gerará multa moratória de 2% e juros de 1% ao mês.</p>
                 <p><strong>2.4. DO FORO:</strong> Fica eleito o foro da comarca da sede da CONTRATADA.</p>
             </div>
         </div>

         {/* Signatures */}
         {signature && (
             <div className="mt-12 pt-6 border-t-2 border-gray-800 flex justify-between items-end">
                 <div>
                     <p className="font-bold uppercase mb-2">Assinado Digitalmente por</p>
                     <p className="text-lg">{customer.name}</p>
                     <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
                 </div>
                 <div>
                     <img src={signature} className="h-20 object-contain" alt="Assinatura" />
                 </div>
             </div>
         )}
      </div>
  );

  if (step === 'success') {
      return (
          <div className="min-h-screen bg-quark-dark flex flex-col items-center justify-center p-8 text-center text-white relative">
              <div className="absolute top-0 left-0 w-full h-full bg-quark-gradient opacity-10"></div>
              <div className="w-32 h-32 bg-quark-primary rounded-full flex items-center justify-center text-quark-dark mb-8 shadow-lg z-10 animate-scale-in">
                  <CheckCircle size={64} />
              </div>
              <h1 className="text-3xl font-bold mb-3 z-10">Pedido Concluído!</h1>
              <p className="text-gray-300 max-w-md mx-auto mb-12 text-lg z-10 font-medium">
                  Seu pedido foi recebido e já está em processo de separação. Entraremos em contato em breve para confirmar a entrega.
              </p>
              
              <div className="flex flex-col space-y-4 z-10 w-full max-w-xs">
                  {isStandalone && (
                      <button onClick={sendToWhatsApp} className="bg-[#25D366] text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                          <Send size={24} className="mr-2"/> Enviar no WhatsApp
                      </button>
                  )}
                  <button 
                    onClick={onBackToHome} 
                    className="bg-white text-quark-dark py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                      <Home size={24} className="mr-2"/> Voltar ao Início
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center md:p-8 font-sans text-gray-900">
        {/* HIDDEN CONTRACT FOR PRINTING - FIXED WIDTH A4 */}
        <div id="hidden-print-contract" style={{ display: 'none', width: '794px', position: 'absolute', top: '-9999px', left: '-9999px' }}>
            <ContractContent />
        </div>

        <div className="bg-white w-full max-w-4xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col min-h-screen md:min-h-[800px] relative border-8 border-gray-900/5">
            <div className="bg-quark-dark text-white p-8 pb-12 md:rounded-b-[3rem] shadow-xl relative z-10 no-print">
                <div className="flex justify-between items-center mb-6">
                    <img src={settings.logoUrl} className="w-8 h-8 object-contain bg-white/10 rounded-lg p-1" alt="Logo" />
                    <div className="text-xs font-bold uppercase opacity-70 bg-white/10 px-3 py-1 rounded-full">#{rental.contractNumber}</div>
                </div>
                <h1 className="text-3xl font-light">Olá, <strong className="text-quark-primary">{customer.name.split(' ')[0]}</strong></h1>
            </div>

            <div className="flex-1 overflow-y-auto -mt-8 pt-4 px-4 md:px-8 pb-8 relative z-0 custom-scrollbar">
                {step === 'intro' && (
                    <div className="space-y-6 pt-4 max-w-md mx-auto animate-slide-up">
                         <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-6">
                             <h3 className="font-bold text-gray-900 mb-4 flex items-center"><Box size={20} className="mr-2 text-quark-secondary"/> Itens Selecionados</h3>
                             {rental.items.map(item => {
                                 const eq = equipment.find(e => e.id === item.equipmentId);
                                 return <div key={item.equipmentId} className="text-sm border-b border-gray-100 pb-2 mb-2 font-bold">{item.quantity}x {eq?.name}</div>
                             })}
                         </div>
                         <button onClick={() => setStep('selection')} className="w-full bg-quark-dark text-white py-5 rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center">
                             Ver Valores e Assinar <ArrowRight className="ml-2" size={20} />
                         </button>
                    </div>
                )}

                {step === 'selection' && (
                    <div className="space-y-6 pt-4 max-w-lg mx-auto animate-slide-up">
                        <h2 className="font-bold text-2xl text-gray-900 text-center">Escolha o Período</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {Object.values(PeriodType).map((p) => (
                                <div 
                                    key={p}
                                    onClick={() => setSelectedPeriod(p)}
                                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedPeriod === p ? 'border-quark-secondary bg-green-50 shadow-lg' : 'border-gray-200 bg-white'}`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${selectedPeriod === p ? 'bg-quark-secondary text-white' : 'bg-gray-100 text-gray-400'}`}><Clock size={20} /></div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{p}</p>
                                            <p className="text-xl font-bold text-gray-900">R$ {prices[p].toFixed(2)}</p>
                                        </div>
                                    </div>
                                    {selectedPeriod === p && <CheckCircle size={28} className="text-quark-secondary"/>}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setStep('sign')} disabled={!selectedPeriod} className="w-full py-5 rounded-2xl font-bold text-lg shadow-xl bg-quark-dark text-white disabled:opacity-50">
                            Revisar e Assinar
                        </button>
                    </div>
                )}

                {step === 'sign' && selectedPeriod && (
                    <div className="space-y-8 pt-4 animate-slide-up">
                         {/* Visible Contract for Review (Responsive) */}
                         <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                             <div className="bg-gray-50 p-4 text-center border-b border-gray-200">
                                 <h3 className="font-bold text-gray-700">Prévia do Contrato</h3>
                             </div>
                             <div className="p-4 overflow-x-auto">
                                 <ContractContent />
                             </div>
                         </div>

                         <div className="flex justify-end">
                             <button onClick={handleDownloadPDF} disabled={isGeneratingPdf} className="flex items-center text-gray-600 font-bold bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200">
                                 {isGeneratingPdf ? 'Gerando...' : <><Download size={16} className="mr-2"/> Baixar PDF Oficial</>}
                             </button>
                         </div>

                         <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl">
                             <h3 className="text-lg font-bold mb-2 flex items-center"><Shield className="mr-2 text-quark-primary"/> Assinatura</h3>
                             <div className="bg-white rounded-2xl overflow-hidden h-56 relative mb-4">
                                 <SignaturePad onSave={setSignature} />
                             </div>
                             <div className="flex items-center justify-between">
                                 <p className="text-xs text-gray-500 flex items-center"><MapPin size={12} className="mr-1"/> Localização será registrada</p>
                                 <button 
                                    onClick={handleConfirmSign}
                                    disabled={!signature || isLoadingLocation}
                                    className="px-8 py-3 rounded-xl font-bold text-quark-dark bg-quark-primary hover:bg-white shadow-lg disabled:opacity-50"
                                 >
                                     {isLoadingLocation ? 'Processando...' : 'Confirmar'}
                                 </button>
                             </div>
                         </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default CustomerPortal;
