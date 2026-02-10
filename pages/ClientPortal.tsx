
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types';
import { Package, Calendar, Clock, MessageCircle, FileText, CheckCircle, Truck, MapPin, Eye, Download } from 'lucide-react';
import { printOrder } from '../lib/printHandler';

const ClientPortal = () => {
  const { user } = useAuth();
  const { orders, equipment } = useStore();

  if (!user) return null;

  // Filter orders for the logged in client
  const myOrders = orders.filter(o => o.clientId === user.id);
  
  const activeRentals = myOrders.filter(o => 
    o.status === OrderStatus.DELIVERED || 
    o.status === OrderStatus.IN_TRANSIT ||
    o.status === OrderStatus.PENDING
  );

  const history = myOrders.filter(o => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CANCELLED);

  const handleContactSupport = (orderId?: string) => {
    const text = orderId 
      ? `Olá, gostaria de falar sobre o pedido #${orderId}.` 
      : `Olá, preciso de ajuda com minhas locações.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getEquipmentName = (id: string) => {
     return equipment.find(e => e.id === id)?.name || 'Equipamento não encontrado';
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl mb-8">
        <h1 className="text-3xl font-bold mb-2">Olá, {user.name}</h1>
        <p className="text-blue-100">Bem-vindo ao seu portal de cliente. Acompanhe aqui suas locações e contratos.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
           <div className="bg-white/10 backdrop-blur rounded-lg p-4">
             <div className="text-2xl font-bold">{activeRentals.length}</div>
             <div className="text-sm text-blue-200">Locações Ativas</div>
           </div>
           <div className="bg-white/10 backdrop-blur rounded-lg p-4">
             <div className="text-2xl font-bold">{history.length}</div>
             <div className="text-sm text-blue-200">Histórico Finalizado</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Rentals */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-blue-600" /> Locações Ativas
            </h2>
            
            {activeRentals.length === 0 ? (
               <div className="bg-white p-8 rounded-xl border border-gray-100 text-center text-gray-500">
                 Você não possui locações ativas no momento.
               </div>
            ) : (
               <div className="space-y-4">
                 {activeRentals.map(order => (
                   <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4">
                       <div>
                         <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">
                           {order.status === 'ENTREGUE' ? 'Em Uso' : order.status.replace('_', ' ')}
                         </span>
                         <h3 className="font-bold text-gray-800 mt-2">Pedido #{order.id.slice(0, 8)}</h3>
                       </div>
                       <button 
                         onClick={() => handleContactSupport(order.id)}
                         className="text-gray-400 hover:text-green-600 transition-colors"
                         title="Falar no WhatsApp"
                       >
                         <MessageCircle className="w-5 h-5" />
                       </button>
                     </div>
                     
                     <div className="space-y-2 mb-4 bg-gray-50/50 p-3 rounded-lg">
                       {order.items.map((item, idx) => (
                         <div key={idx} className="flex justify-between text-sm text-gray-600">
                           <span className="font-medium">{item.quantity}x {getEquipmentName(item.equipmentId)}</span>
                         </div>
                       ))}
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                             <p className="font-semibold text-gray-700">Entrega</p>
                             {new Date(order.deliveryDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                             <p className="font-semibold text-gray-700">Devolução</p>
                             {new Date(order.returnDate).toLocaleDateString()}
                          </div>
                        </div>
                     </div>

                     {/* Delivery Address */}
                     <div className="flex items-start p-3 bg-blue-50/30 rounded-lg border border-blue-100/50 mb-4">
                        <MapPin className="w-4 h-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                           <p className="text-xs font-bold text-blue-700 uppercase mb-0.5">Local de Entrega</p>
                           <p className="text-sm text-gray-700">
                              {order.street}, {order.number} {order.complement && `- ${order.complement}`}
                           </p>
                           <p className="text-xs text-gray-500">
                              {order.neighborhood} - {order.city}/{order.state}
                           </p>
                        </div>
                     </div>
                     
                     <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                        {order.signatureUrl ? (
                            <div className="flex items-center text-green-600 text-xs font-medium">
                                <CheckCircle className="w-4 h-4 mr-1" /> Contrato Assinado
                            </div>
                        ) : (
                             <div className="flex items-center text-amber-600 text-xs font-medium">
                                <FileText className="w-4 h-4 mr-1" /> Aguardando Assinatura
                            </div>
                        )}
                        <button 
                            onClick={() => printOrder(order, equipment)}
                            className="text-blue-600 text-xs font-bold hover:underline flex items-center"
                        >
                            <Download className="w-3 h-3 mr-1" /> Baixar Contrato
                        </button>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>

          {/* History */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-400" /> Histórico
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               {history.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">Sem histórico.</div>
               ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                          <th className="px-6 py-3">Data</th>
                          <th className="px-6 py-3">Itens</th>
                          <th className="px-6 py-3 text-right">Valor</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {history.map(order => (
                          <tr key={order.id}>
                            <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4">{order.items.length} itens</td>
                            <td className="px-6 py-4 text-right">R$ {order.totalAmount.toFixed(2)}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                                <button onClick={() => printOrder(order, equipment)} className="text-blue-500 hover:text-blue-700">
                                    <Eye className="w-4 h-4" />
                                </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               )}
            </div>
          </div>

        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Suporte Rápido</h3>
              <p className="text-sm text-gray-500 mb-4">
                Precisa renovar um contrato ou solicitar manutenção em algum equipamento?
              </p>
              <button 
                onClick={() => handleContactSupport()}
                className="w-full flex items-center justify-center bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition-colors font-medium shadow-lg shadow-green-500/20"
              >
                <MessageCircle className="w-5 h-5 mr-2" /> Falar no WhatsApp
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
