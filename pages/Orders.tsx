
import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';
import { Package, Truck, CheckCircle, FileText, Plus, Search, Calendar, MapPin, PenTool, X, User, Edit2, Save, Trash2, Ban, Printer, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { printOrder } from '../lib/printHandler';

const Orders = () => {
  const { orders, updateOrderStatus, equipment } = useStore();
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [obsEdit, setObsEdit] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  
  // Drag and Drop State
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

  // Kanban Columns
  const columns = [
    { id: OrderStatus.PENDING, title: 'Em Separação', icon: Package, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { id: OrderStatus.IN_TRANSIT, title: 'Em Rota', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: OrderStatus.DELIVERED, title: 'Entregue / Em Uso', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { id: OrderStatus.COMPLETED, title: 'Finalizado', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  ];

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleDrop = (e: React.DragEvent, targetStatus: OrderStatus) => {
    e.preventDefault();
    if (!draggedOrderId) return;
    const order = orders.find(o => o.id === draggedOrderId);
    if (!order || order.status === targetStatus) return;

    if (targetStatus === OrderStatus.DELIVERED) {
      setSelectedOrder(order);
      setSignatureModalOpen(true);
    } else {
      updateOrderStatus(draggedOrderId, targetStatus);
    }
    setDraggedOrderId(null);
  };

  // --- Detail Modal Logic ---
  const openDetailModal = (order: Order) => {
      setSelectedOrder(order);
      setObsEdit(order.observations || '');
      setDetailModalOpen(true);
  };

  const saveObservations = () => {
      if(selectedOrder) {
          updateOrderStatus(selectedOrder.id, selectedOrder.status, undefined, obsEdit);
          setDetailModalOpen(false);
      }
  };
  
  const handleCancelOrder = () => {
      if (selectedOrder && window.confirm("Tem certeza que deseja cancelar este pedido? O estoque será liberado.")) {
          updateOrderStatus(selectedOrder.id, OrderStatus.CANCELLED);
          setDetailModalOpen(false);
      }
  };
  
  const handlePrint = () => {
      if (selectedOrder) {
          printOrder(selectedOrder, equipment);
      }
  };

  // --- Signature Canvas Logic (reused) ---
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
  };

  const draw = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawingRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => isDrawingRef.current = false;

  const saveSignature = () => {
    if (selectedOrder && canvasRef.current) {
        const dataUrl = canvasRef.current.toDataURL();
        updateOrderStatus(selectedOrder.id, OrderStatus.DELIVERED, dataUrl);
        setSignatureModalOpen(false);
        setSelectedOrder(null);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quadro de Pedidos</h2>
           <p className="text-gray-500 text-sm mt-1">Arraste para atualizar o status. Clique para ver detalhes.</p>
        </div>
        <Link to="/new-order" className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 flex items-center shadow-lg shadow-blue-500/30 transition-all active:scale-95">
          <Plus className="w-5 h-5 mr-2" /> Novo Pedido
        </Link>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
         <div className="flex h-full gap-6 min-w-[1000px]">
            {columns.map(col => (
               <div 
                  key={col.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex-1 flex flex-col min-w-[280px] bg-gray-100/50 rounded-3xl p-4 border border-transparent transition-colors ${draggedOrderId ? 'hover:bg-gray-200/50 hover:border-gray-300' : ''}`}
               >
                  <div className={`flex items-center justify-between p-3 mb-4 rounded-xl ${col.bg} border ${col.border}`}>
                     <div className="flex items-center gap-2">
                        <col.icon className={`w-5 h-5 ${col.color}`} />
                        <span className={`font-bold text-sm ${col.color}`}>{col.title}</span>
                     </div>
                     <span className="bg-white px-2 py-0.5 rounded-md text-xs font-bold text-gray-500 shadow-sm">
                        {orders.filter(o => o.status === col.id && o.type === 'PEDIDO').length}
                     </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                     {orders
                        .filter(order => order.status === col.id && order.type === 'PEDIDO')
                        .map(order => (
                           <div
                              key={order.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, order.id)}
                              onClick={() => openDetailModal(order)}
                              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group relative active:scale-95 active:shadow-none"
                           >
                              <div className="flex justify-between items-start mb-3">
                                 <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">#{order.id.slice(0, 8)}</span>
                                 <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{order.billingPeriod}</span>
                              </div>
                              <h4 className="font-bold text-gray-900 mb-1">{order.clientName}</h4>
                              <div className="space-y-2 mt-3">
                                 <div className="flex items-center text-xs text-gray-500">
                                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                    <span className="truncate">{order.street}, {order.number} - {order.neighborhood}</span>
                                 </div>
                              </div>
                           </div>
                        ))}
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Detail Modal */}
      {detailModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col animate-scale-up">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <div>
                          <h3 className="text-xl font-bold text-gray-900">Detalhes do Pedido</h3>
                          <div className="flex gap-2 mt-1">
                             <span className={`text-xs font-bold px-2 py-1 rounded-md inline-block ${selectedOrder.status === OrderStatus.CANCELLED ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                {selectedOrder.status.replace('_', ' ')}
                             </span>
                             <span className="text-xs font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-600">{selectedOrder.paymentMethod}</span>
                          </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handlePrint} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100" title="Imprimir / Baixar"><Printer className="w-5 h-5"/></button>
                        <button onClick={() => setDetailModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-600"/></button>
                      </div>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                          <div><p className="text-gray-500 font-bold uppercase text-xs">Cliente</p><p className="font-medium">{selectedOrder.clientName}</p></div>
                          <div><p className="text-gray-500 font-bold uppercase text-xs">Data Entrega</p><p className="font-medium">{new Date(selectedOrder.deliveryDate).toLocaleDateString()}</p></div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <p className="text-gray-500 font-bold uppercase text-xs mb-2 flex items-center"><MapPin className="w-3 h-3 mr-1"/> Endereço Completo</p>
                          <p className="text-sm text-gray-700">
                              {selectedOrder.street}, {selectedOrder.number} {selectedOrder.complement ? `- ${selectedOrder.complement}` : ''}<br/>
                              {selectedOrder.neighborhood}, {selectedOrder.city} - {selectedOrder.state}<br/>
                              CEP: {selectedOrder.zipCode}<br/>
                              Ref: {selectedOrder.reference}
                          </p>
                      </div>
                      
                      {/* Fixed Items List Table */}
                      <div>
                          <p className="text-gray-500 font-bold uppercase text-xs mb-2">Itens</p>
                          <div className="border border-gray-100 rounded-xl overflow-hidden">
                              <table className="w-full text-sm">
                                  <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                                      <tr>
                                          <th className="px-3 py-2 text-left">Qtd</th>
                                          <th className="px-3 py-2 text-left">Item</th>
                                          <th className="px-3 py-2 text-right">Unit.</th>
                                          <th className="px-3 py-2 text-right">Total</th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                     {selectedOrder.items.map((item, i) => {
                                         const itemName = equipment.find(e => e.id === item.equipmentId)?.name || item.equipmentName || 'Item';
                                         const total = item.quantity * item.priceSnapshot;
                                         return (
                                             <tr key={i}>
                                                 <td className="px-3 py-2 text-center">{item.quantity}</td>
                                                 <td className="px-3 py-2">{itemName}</td>
                                                 <td className="px-3 py-2 text-right">R$ {item.priceSnapshot.toFixed(2)}</td>
                                                 <td className="px-3 py-2 text-right font-medium">R$ {total.toFixed(2)}</td>
                                             </tr>
                                         );
                                     })}
                                  </tbody>
                              </table>
                          </div>
                          <div className="flex justify-between items-center mt-3 px-2">
                             <span className="text-sm font-bold text-gray-500">Total + Frete</span>
                             <span className="text-lg font-bold text-blue-600">R$ {selectedOrder.totalAmount.toFixed(2)}</span>
                          </div>
                      </div>
                      
                      <div>
                           <label className="text-gray-500 font-bold uppercase text-xs mb-2 block">Observações</label>
                           <textarea className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3} value={obsEdit} onChange={e => setObsEdit(e.target.value)} />
                      </div>
                      {selectedOrder.signatureUrl && (
                          <div className="mt-4">
                             <p className="text-gray-500 font-bold uppercase text-xs mb-2">Assinatura de Recebimento</p>
                             <img src={selectedOrder.signatureUrl} alt="Assinatura" className="border border-gray-200 rounded-lg max-h-24 bg-white" />
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between">
                      {selectedOrder.status !== OrderStatus.CANCELLED && selectedOrder.status !== OrderStatus.COMPLETED && (
                          <button onClick={handleCancelOrder} className="flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-all text-sm">
                              <Ban className="w-4 h-4 mr-2" /> Cancelar Pedido
                          </button>
                      )}
                      <div className="flex gap-2">
                          <button onClick={saveObservations} className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all"><Save className="w-4 h-4 mr-2" /> Salvar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Signature Modal */}
      {signatureModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl max-h-[95vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col animate-slide-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sm:rounded-t-3xl">
                <div><h3 className="text-xl font-bold text-gray-900">Termo de Entrega</h3><p className="text-sm text-gray-500">Pedido #{selectedOrder.id.slice(0,8)}</p></div>
                <button onClick={() => setSignatureModalOpen(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm">
                     <p className="font-bold mb-2 uppercase text-gray-600 text-xs">Termos do Contrato</p>
                     <div className="text-xs text-justify text-gray-500 h-32 overflow-y-auto border border-gray-200 p-2 bg-white rounded">
                        1. OBJETO: O presente contrato tem como objeto a locação dos bens móveis descritos neste pedido.<br/>
                        2. PRAZO: O prazo de locação é o estipulado neste pedido, podendo ser prorrogado mediante acordo entre as partes.<br/>
                        3. VALOR E PAGAMENTO: O locatário pagará à locadora o valor total estipulado.<br/>
                        4. CONSERVAÇÃO: O locatário declara receber os bens em perfeito estado de conservação e funcionamento, obrigando-se a devolvê-los nas mesmas condições, salvo o desgaste natural pelo uso.<br/>
                        5. DANOS E EXTRAVIO: Em caso de dano, perda, roubo ou furto dos equipamentos, o locatário será responsável pelo pagamento do valor de reposição do bem a preço de mercado atual.<br/>
                        6. USO: Os equipamentos devem ser utilizados exclusivamente para o fim a que se destinam.<br/>
                        7. DEVOLUÇÃO: A não devolução dos equipamentos na data estipulada sujeitará o locatário ao pagamento das diárias excedentes.<br/>
                        8. Declaro que li e concordo com todos os termos acima.
                     </div>
                 </div>
                 <p className="text-xs font-bold text-gray-400 uppercase">Assine abaixo</p>
                 <div className="border-2 border-dashed border-gray-300 rounded-2xl bg-white touch-none cursor-crosshair overflow-hidden relative">
                     <canvas ref={canvasRef} width={600} height={200} className="w-full h-[200px]" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
                 </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-4 bg-white sm:rounded-b-3xl">
                <button onClick={() => {const ctx = canvasRef.current?.getContext('2d'); ctx?.clearRect(0,0,600,200);}} className="px-6 py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors">Limpar</button>
                <button onClick={saveSignature} className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors">Confirmar e Assinar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
