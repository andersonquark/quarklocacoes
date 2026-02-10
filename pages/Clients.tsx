
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Client, Order } from '../types';
import { Search, Plus, Edit2, Phone, Mail, MapPin, User, FileText, ArrowLeft, Download, Eye } from 'lucide-react';
import { printOrder } from '../lib/printHandler';

const Clients = () => {
  const { clients, addClient, updateClient, orders, equipment } = useStore();
  const [view, setView] = useState<'LIST' | 'DETAILS'>('LIST');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // List State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Client>({ 
    id: '', 
    name: '', 
    document: '', 
    phone: '', 
    email: '', 
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    complement: '',
    reference: ''
  });

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.document.includes(searchTerm)
  );

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData(client);
    } else {
      setEditingClient(null);
      setFormData({ 
        id: `cli-${Date.now()}`, 
        name: '', 
        document: '', 
        phone: '', 
        email: '', 
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        complement: '',
        reference: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient(formData);
    } else {
      addClient(formData);
    }
    setIsModalOpen(false);
  };

  const getClientStats = (clientId: string) => {
    const clientOrders = orders.filter(o => o.clientId === clientId);
    return {
      totalOrders: clientOrders.length,
      activeOrders: clientOrders.filter(o => o.status !== 'FINALIZADO' && o.status !== 'CANCELADO' && o.status !== 'ORCAMENTO').length
    };
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setView('DETAILS');
  };

  const formatAddress = (c: Client) => {
    return `${c.street}, ${c.number} - ${c.neighborhood}, ${c.city}/${c.state}`;
  };

  // --- Render Details View ---
  if (view === 'DETAILS' && selectedClient) {
    const clientOrders = orders.filter(o => o.clientId === selectedClient.id && o.type === 'PEDIDO');
    const clientQuotes = orders.filter(o => o.clientId === selectedClient.id && o.type === 'ORCAMENTO');
    // Using signed contracts or any order for simplicity in demo
    const signedContracts = clientOrders; 

    return (
      <div className="space-y-6">
         <div className="flex items-center mb-6">
            <button onClick={() => setView('LIST')} className="mr-4 p-2 hover:bg-gray-200 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="text-2xl font-bold text-gray-800">{selectedClient.name}</h2>
         </div>

         {/* Client Info Card */}
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
             <div className="space-y-2 mb-4 md:mb-0">
                 <p className="flex items-center text-gray-600"><User className="w-4 h-4 mr-2"/> {selectedClient.document}</p>
                 <p className="flex items-center text-gray-600"><Phone className="w-4 h-4 mr-2"/> {selectedClient.phone}</p>
                 <p className="flex items-center text-gray-600"><Mail className="w-4 h-4 mr-2"/> {selectedClient.email}</p>
                 <p className="flex items-center text-gray-600"><MapPin className="w-4 h-4 mr-2"/> {formatAddress(selectedClient)}</p>
             </div>
             <button onClick={() => handleOpenModal(selectedClient)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                 Editar Dados
             </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Active/History Orders */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="p-4 border-b border-gray-100 bg-gray-50">
                     <h3 className="font-bold text-gray-700">Histórico de Pedidos</h3>
                 </div>
                 <div className="p-4 max-h-80 overflow-y-auto">
                     {clientOrders.length === 0 ? <p className="text-gray-400 text-sm">Nenhum pedido realizado.</p> : (
                         <div className="space-y-3">
                             {clientOrders.map(order => (
                                 <div key={order.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                                     <div>
                                         <p className="font-bold text-sm text-gray-800">#{order.id.slice(0, 8)} - {new Date(order.createdAt).toLocaleDateString()}</p>
                                         <p className="text-xs text-gray-500">{order.items.length} itens | {order.billingPeriod}</p>
                                     </div>
                                     <div className="text-right">
                                         <span className={`px-2 py-1 text-xs rounded-full font-bold ${order.status === 'ENTREGUE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                             {order.status}
                                         </span>
                                         <p className="text-sm font-bold mt-1">R$ {order.totalAmount.toFixed(2)}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
             </div>

             {/* Contracts */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                 <div className="p-4 border-b border-gray-100 bg-gray-50">
                     <h3 className="font-bold text-gray-700">Contratos & Assinaturas</h3>
                 </div>
                 <div className="p-4 max-h-80 overflow-y-auto">
                     {signedContracts.length === 0 ? <p className="text-gray-400 text-sm">Nenhum contrato disponível.</p> : (
                         <div className="space-y-3">
                             {signedContracts.map(order => (
                                 <div key={order.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                                     <div>
                                         <p className="font-bold text-sm text-gray-800">Pedido #{order.id.slice(0, 8)}</p>
                                         {order.signatureUrl ? (
                                             <p className="text-xs text-green-600 flex items-center"><FileText className="w-3 h-3 mr-1"/> Assinado</p>
                                         ) : (
                                             <p className="text-xs text-amber-600 flex items-center"><FileText className="w-3 h-3 mr-1"/> Pendente</p>
                                         )}
                                     </div>
                                     <div className="flex space-x-2">
                                         <button 
                                            onClick={() => printOrder(order, equipment)}
                                            className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 rounded" 
                                            title="Visualizar / Imprimir"
                                         >
                                             <Eye className="w-4 h-4" />
                                         </button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
             </div>
         </div>
      </div>
    );
  }

  // --- Render List View ---
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Clientes</h2>
          <p className="text-gray-500">Gerencie sua base de clientes</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF/CNPJ..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map(client => {
          const stats = getClientStats(client.id);
          
          return (
            <div 
                key={client.id} 
                onClick={() => handleViewClient(client)}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mr-4 group-hover:bg-indigo-100 transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">{client.name}</h3>
                    <p className="text-xs text-gray-500">{client.document}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" />
                  {client.phone}
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="truncate">{client.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center text-sm text-gray-500">
                  <FileText className="w-4 h-4 mr-1" />
                  {stats.totalOrders} contratos
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${stats.activeOrders > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {stats.activeOrders > 0 ? `${stats.activeOrders} ativos` : 'Inativo'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Razão Social</label>
                <input required type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ</label>
                <input required type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input required type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input type="email" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-700 mb-2 mt-2">Endereço</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CEP</label>
                     <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none" 
                       value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} />
                  </div>
                  <div className="col-span-1"></div>
                  <div className="col-span-2">
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rua / Logradouro</label>
                     <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none" 
                       value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Número</label>
                     <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none" 
                       value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Complemento</label>
                     <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none" 
                       value={formData.complement || ''} onChange={e => setFormData({...formData, complement: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Bairro</label>
                     <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none" 
                       value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cidade</label>
                     <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none" 
                       value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                     <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none" 
                       value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                  </div>
                   <div className="col-span-2">
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Referência</label>
                     <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none" 
                       value={formData.reference || ''} onChange={e => setFormData({...formData, reference: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
