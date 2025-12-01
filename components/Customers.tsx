
import React, { useState } from 'react';
import { Customer, RentalOrder, RentalStatus } from '../types';
import { Search, UserPlus, Phone, MapPin, Calendar, History, Package, Edit2, X, Trash2, Mail, Lock, ChevronRight, Gift } from 'lucide-react';

interface CustomersProps {
  customers: Customer[];
  rentals: RentalOrder[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, rentals, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Form State
  const initialFormState: Partial<Customer> = {
    name: '', document: '', phone: '', email: '', address: '', birthDate: '', password: ''
  };
  const [formData, setFormData] = useState<Partial<Customer>>(initialFormState);

  const handleOpenModal = (customer?: Customer) => {
      if (customer) {
          setIsEditing(true);
          setFormData({ ...customer });
      } else {
          setIsEditing(false);
          setFormData({ ...initialFormState });
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (isEditing && selectedCustomer) {
        onUpdateCustomer({ ...formData, id: selectedCustomer.id } as Customer);
        setSelectedCustomer({ ...formData, id: selectedCustomer.id } as Customer);
    } else {
        onAddCustomer({ ...formData, id: `c-${Date.now()}` } as Customer);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Impede abrir o cliente ao clicar em deletar
      if(window.confirm("Tem certeza que deseja excluir este cliente? Todas as locações vinculadas permanecerão no histórico, mas sem o vínculo do cliente.")) {
          onDeleteCustomer(id);
          if(selectedCustomer?.id === id) {
              setSelectedCustomer(null);
          }
      }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // History Logic
  const customerHistory = selectedCustomer 
    ? rentals.filter(r => r.customerId === selectedCustomer.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  return (
    <div className="p-4 md:p-8 animate-fade-in h-full flex flex-col pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Clientes</h2>
          <p className="text-gray-500 mt-1">Gerencie cadastros e acessos.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-quark-dark text-white px-5 py-3 rounded-xl flex items-center hover:bg-black transition-all shadow-lg font-medium"
        >
          <UserPlus size={20} className="mr-2" /> Novo Cliente
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
          {/* List */}
          <div className="lg:col-span-4 flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden h-[400px] lg:h-[600px]">
             <div className="p-4 border-b border-gray-100">
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    className="w-full p-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-quark-primary"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {filteredCustomers.map(c => (
                    <div 
                        key={c.id} 
                        onClick={() => { setSelectedCustomer(c); setActiveTab('details'); }}
                        className={`p-4 rounded-2xl cursor-pointer mb-2 transition-colors group flex justify-between items-center ${selectedCustomer?.id === c.id ? 'bg-quark-dark text-white shadow-lg' : 'hover:bg-gray-50'}`}
                    >
                        <div>
                            <div className="font-bold">{c.name}</div>
                            <div className={`text-xs ${selectedCustomer?.id === c.id ? 'text-gray-400' : 'text-gray-500'}`}>{c.phone}</div>
                        </div>
                        <button 
                            onClick={(e) => handleDelete(e, c.id)}
                            className={`p-2 rounded-lg transition-colors ${selectedCustomer?.id === c.id ? 'hover:bg-white/20 text-red-400' : 'hover:bg-red-50 text-red-400 opacity-0 group-hover:opacity-100'}`}
                            title="Excluir Cliente"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
             </div>
          </div>

          {/* Details & History */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col h-auto lg:h-[600px] relative overflow-hidden">
             {selectedCustomer ? (
                 <div className="w-full h-full flex flex-col">
                     {/* Header */}
                     <div className="p-8 pb-0 flex justify-between items-start mb-6">
                         <div>
                             <h2 className="text-3xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                             <p className="text-gray-400">{selectedCustomer.document}</p>
                         </div>
                         <div className="flex space-x-2">
                            <button onClick={() => handleOpenModal(selectedCustomer)} className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 text-black">
                                <Edit2 size={20} />
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, selectedCustomer.id)} 
                                className="p-3 bg-red-50 rounded-xl hover:bg-red-100 text-red-500"
                            >
                                <Trash2 size={20} />
                            </button>
                         </div>
                     </div>

                     {/* Tabs */}
                     <div className="px-8 flex space-x-6 border-b border-gray-100 mb-6">
                         <button 
                            onClick={() => setActiveTab('details')}
                            className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'details' ? 'text-quark-dark border-quark-dark' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                        >
                             Detalhes
                         </button>
                         <button 
                            onClick={() => setActiveTab('history')}
                            className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'history' ? 'text-quark-dark border-quark-dark' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                        >
                             Histórico de Locações ({customerHistory.length})
                         </button>
                     </div>
                     
                     {/* Content */}
                     <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
                         {activeTab === 'details' && (
                             <div className="animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Email</label>
                                        <p className="text-gray-900 font-medium">{selectedCustomer.email || '-'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Senha de Acesso</label>
                                        <p className="text-gray-900 font-medium flex items-center">
                                            <Lock size={14} className="mr-2 text-gray-400"/> 
                                            {selectedCustomer.password ? '••••••' : 'Sem senha definida'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Data de Nascimento</label>
                                        <p className="text-gray-900 font-medium flex items-center">
                                            <Gift size={14} className="mr-2 text-pink-400"/> 
                                            {selectedCustomer.birthDate ? new Date(selectedCustomer.birthDate).toLocaleDateString('pt-BR') : '-'}
                                        </p>
                                    </div>
                                </div>

                                <h3 className="font-bold text-gray-900 mb-4">Dados de Contato</h3>
                                <div className="space-y-3 text-sm">
                                    <p className="flex items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><Phone size={16} className="mr-3 text-quark-dark"/> {selectedCustomer.phone}</p>
                                    <p className="flex items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm"><MapPin size={16} className="mr-3 text-quark-dark"/> {selectedCustomer.address}</p>
                                </div>
                             </div>
                         )}

                         {activeTab === 'history' && (
                             <div className="space-y-3 animate-fade-in">
                                 {customerHistory.map(r => (
                                     <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                         <div>
                                             <p className="font-bold text-gray-900 flex items-center">
                                                 #{r.contractNumber}
                                                 <span className={`ml-2 px-2 py-0.5 rounded text-[10px] uppercase ${r.status === RentalStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{r.status}</span>
                                             </p>
                                             <p className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString('pt-BR')} • {r.periodType || 'Período não definido'}</p>
                                         </div>
                                         <div className="text-right">
                                             <p className="font-bold text-gray-900">R$ {r.totalValue.toFixed(2)}</p>
                                             <p className="text-xs text-gray-500">{r.items.length} itens</p>
                                         </div>
                                     </div>
                                 ))}
                                 {customerHistory.length === 0 && (
                                     <div className="text-center py-10 text-gray-400">Nenhum histórico encontrado.</div>
                                 )}
                             </div>
                         )}
                     </div>
                 </div>
             ) : (
                 <div className="text-center p-8 flex flex-col items-center justify-center h-full text-gray-400">
                     <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                         <Search size={32} />
                     </div>
                     <p>Selecione um cliente para ver os detalhes</p>
                 </div>
             )}
          </div>

          {/* Modal Add/Edit */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                     <h3 className="text-xl font-bold text-gray-900">{isEditing ? 'Editar' : 'Novo'} Cliente</h3>
                     <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X className="text-gray-500" /></button>
                  </div>
                  
                  <div className="p-8 overflow-y-auto custom-scrollbar">
                    <form id="customerForm" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo / Razão Social</label>
                                <input required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF / CNPJ</label>
                                <input className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone (WhatsApp)</label>
                                <input className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Endereço Completo</label>
                                <input className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>
                            
                            {/* Acesso ao Portal */}
                            <div className="md:col-span-2 bg-blue-50 p-4 rounded-2xl border border-blue-100 mt-2">
                                <h4 className="font-bold text-blue-900 mb-4 flex items-center"><Lock size={16} className="mr-2"/> Acesso ao Portal do Cliente</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-blue-400 uppercase mb-1">Email (Login)</label>
                                        <input type="email" className="w-full p-3 border border-blue-100 rounded-xl bg-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@cliente.com" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-blue-400 uppercase mb-1">Senha</label>
                                        <input className="w-full p-3 border border-blue-100 rounded-xl bg-white" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="****" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-blue-400 uppercase mb-1">Data de Nascimento (CRM)</label>
                                        <input type="date" className="w-full p-3 border border-blue-100 rounded-xl bg-white" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                  </div>
                  <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-600 font-medium rounded-xl">Cancelar</button>
                        <button type="submit" form="customerForm" className="px-8 py-3 bg-quark-dark text-white font-bold rounded-xl hover:bg-black">Salvar Cliente</button>
                  </div>
               </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Customers;
