import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Plus, Search, Edit2, AlertTriangle, Package, DollarSign } from 'lucide-react';
import { Equipment } from '../types';

const Inventory = () => {
  const { equipment, addEquipment, updateEquipment, getEquipmentStock } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);

  const initialFormState: Equipment = {
    id: '',
    code: '',
    name: '',
    category: '',
    description: '',
    imageUrl: 'https://picsum.photos/200/200',
    unit: 'pç',
    priceDaily: 0,
    priceWeekly: 0,
    priceBiWeekly: 0,
    priceMonthly: 0,
    stockTotal: 0,
    stockRented: 0,
    stockReserved: 0,
    active: true,
  };

  const [formData, setFormData] = useState<Equipment>(initialFormState);

  const filteredEquipment = equipment.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (item?: Equipment) => {
    if (item) {
      setEditingItem(item);
      setFormData(item);
    } else {
      setEditingItem(null);
      setFormData({ ...initialFormState, id: Date.now().toString(), imageUrl: `https://picsum.photos/200/200?random=${Date.now()}` });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await updateEquipment(formData);
    } else {
      await addEquipment(formData);
    }
    setIsModalOpen(false);
    // Optional: Add a toast here
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Estoque</h2>
          <p className="text-gray-500">Gerencie equipamentos e quantidades</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Equipamento
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 bg-gray-50/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEquipment.map(item => {
          const stock = getEquipmentStock(item.id);
          const isLowStock = stock.available < stock.total * 0.2;

          return (
            <div key={item.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg hover:border-blue-100 transition-all group">
              <div className="h-48 overflow-hidden relative">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-gray-800 shadow-sm">
                  {item.code}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 line-clamp-2 text-lg">{item.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-5 line-clamp-2 flex-1 leading-relaxed">{item.description}</p>
                
                <div className="grid grid-cols-2 gap-2 text-xs mb-5 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <div className="text-center">
                    <span className="block text-gray-400 font-medium mb-1">Total</span>
                    <span className="font-bold text-gray-900 text-sm">{stock.total}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-gray-400 font-medium mb-1">Disponível</span>
                    <span className={`font-bold text-sm ${stock.available === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {stock.available}
                    </span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="block text-gray-400 font-medium mb-1">Alugado</span>
                    <span className="font-bold text-blue-600 text-sm">{stock.rented}</span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="block text-gray-400 font-medium mb-1">Reservado</span>
                    <span className="font-bold text-amber-600 text-sm">{stock.reserved}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                   <div className="text-lg font-bold text-gray-900">
                     R$ {item.priceMonthly.toFixed(2)} <span className="text-xs font-medium text-gray-400">/mês</span>
                   </div>
                   <button 
                    onClick={() => handleOpenModal(item)}
                    className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                   >
                     <Edit2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Editar Equipamento' : 'Novo Equipamento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                <span className="text-xl text-gray-600">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome</label>
                  <input required type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Código</label>
                  <input required type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium" 
                    value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Descrição</label>
                  <textarea className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium" rows={3}
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Categoria</label>
                  <input type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium" 
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Unidade</label>
                  <input type="text" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium" 
                    value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </div>
                
                <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-2">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center"><Package className="w-4 h-4 mr-2 text-blue-500"/> Estoque</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantidade Total</label>
                      <input type="number" min="0" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-medium" 
                        value={formData.stockTotal} onChange={e => setFormData({...formData, stockTotal: parseInt(e.target.value) || 0})} />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-2">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center"><DollarSign className="w-4 h-4 mr-2 text-green-500"/> Tabela de Preços</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Diária</label>
                      <input type="number" step="0.01" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-blue-500" 
                        value={formData.priceDaily} onChange={e => setFormData({...formData, priceDaily: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Semanal</label>
                      <input type="number" step="0.01" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-blue-500" 
                        value={formData.priceWeekly} onChange={e => setFormData({...formData, priceWeekly: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Quinzenal</label>
                      <input type="number" step="0.01" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-blue-500" 
                        value={formData.priceBiWeekly} onChange={e => setFormData({...formData, priceBiWeekly: parseFloat(e.target.value) || 0})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mensal</label>
                      <input type="number" step="0.01" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 outline-none focus:border-blue-500" 
                        value={formData.priceMonthly} onChange={e => setFormData({...formData, priceMonthly: parseFloat(e.target.value) || 0})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 bg-gray-50/50 -mx-8 -mb-8 p-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-600 hover:bg-gray-200 rounded-xl font-bold transition-colors">Cancelar</button>
                <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 font-bold active:scale-95">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;