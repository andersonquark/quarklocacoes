
import React, { useState, useRef } from 'react';
import { Equipment, EquipmentIcon } from '../types';
import { Search, Plus, X, Edit2, Trash2, Upload, Image as ImageIcon, Hammer, HardHat, Truck, Cone, PenTool, PackageOpen } from 'lucide-react';

interface InventoryProps {
  equipment: Equipment[];
  onAddEquipment: (eq: Equipment) => void;
  onUpdateEquipment: (eq: Equipment) => void;
  onDeleteEquipment: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ equipment, onAddEquipment, onUpdateEquipment, onDeleteEquipment }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState: Partial<Equipment> = {
    name: '', 
    category: 'Estrutura', 
    stockTotal: 0, 
    priceDaily: 0, 
    priceWeekly: 0, 
    priceBiweekly: 0, 
    priceMonthly: 0, 
    icon: 'scaffold', 
    imageUrl: ''
  };

  const [formData, setFormData] = useState<Partial<Equipment>>(initialFormState);

  const handleOpenModal = (item?: Equipment) => {
    if (item) {
      setEditingId(item.id);
      setFormData({ ...item });
    } else {
      setEditingId(null);
      setFormData({ ...initialFormState });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const eqToSave = {
        ...formData,
        stockRented: formData.stockRented || 0,
        imageUrl: formData.imageUrl || `https://picsum.photos/seed/${Date.now()}/200/200`
    } as Equipment;

    if (editingId) {
      onUpdateEquipment(eqToSave);
    } else {
      onAddEquipment({ ...eqToSave, id: `eq-${Date.now()}` });
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (id: string) => {
      if(window.confirm("Tem certeza que deseja excluir este item do inventário?")) {
          onDeleteEquipment(id);
      }
  };

  const filteredEquipment = equipment.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getIconComponent = (iconName: EquipmentIcon) => {
      switch(iconName) {
          case 'scaffold': return <PackageOpen />;
          case 'mixer': return <Edit2 className="rotate-45" />;
          case 'ladder': return <Hammer />;
          case 'drill': return <PenTool />;
          case 'truck': return <Truck />;
          case 'cone': return <Cone />;
          case 'helmet': return <HardHat />;
          default: return <PackageOpen />;
      }
  };

  const IconOption = ({ icon, label, value }: { icon: any, label: string, value: EquipmentIcon }) => (
      <div 
        onClick={() => setFormData(prev => ({ ...prev, icon: value }))}
        className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all duration-200 ${formData.icon === value ? 'bg-quark-dark text-white border-quark-dark scale-105 shadow-md' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-500'}`}
      >
          {React.cloneElement(icon, { size: 20 })}
          <span className="text-[10px] font-bold uppercase">{label}</span>
      </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Inventário</h2>
          <p className="text-gray-500 mt-1">Tabela de preços e gestão de ativos.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-quark-dark text-white px-5 py-3 rounded-xl flex items-center hover:bg-black transition-all shadow-lg font-medium"
        >
          <Plus size={20} className="mr-2" /> Novo Item
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 focus:ring-2 focus:ring-quark-primary/50 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEquipment.map((item) => {
          return (
            <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative">
                   <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                   <div className="absolute bottom-1 right-1 bg-white/90 p-1 rounded-lg shadow-sm text-quark-dark">
                       {React.cloneElement(getIconComponent(item.icon), { size: 12 })}
                   </div>
                </div>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => handleOpenModal(item)} 
                        className="p-2 bg-gray-50 rounded-full hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button 
                        onClick={() => handleDeleteClick(item.id)} 
                        className="p-2 bg-gray-50 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
              </div>
              
              <h3 className="font-bold text-gray-900 mb-1 text-lg">{item.name}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">{item.category}</p>

              <div className="mt-auto">
                <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="text-center border-r border-gray-200">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Diária</p>
                        <p className="font-bold text-gray-900">R$ {item.priceDaily.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Mensal</p>
                        <p className="font-bold text-quark-secondary">R$ {item.priceMonthly.toFixed(2)}</p>
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Editar' : 'Novo'} Equipamento</h3>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X className="text-gray-500" /></button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <form id="inventoryForm" onSubmit={handleSave} className="space-y-8">
                    <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-6">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-32 h-32 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition-all overflow-hidden shrink-0"
                        >
                            {formData.imageUrl ? (
                                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="text-gray-300 mb-2" size={32} />
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        
                        <div className="flex-1 space-y-4 w-full">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
                                <input required className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estoque</label>
                                    <input type="number" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50" value={formData.stockTotal} onChange={e => setFormData({...formData, stockTotal: Number(e.target.value)})} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <h4 className="font-bold text-sm text-gray-900 mb-4">Tabela de Preços (R$)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {['Daily', 'Weekly', 'Biweekly', 'Monthly'].map((period) => {
                                const key = `price${period}` as keyof Equipment;
                                return (
                                    <div key={period}>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">{period === 'Daily' ? 'Diária' : period === 'Weekly' ? 'Semanal' : period === 'Biweekly' ? 'Quinzenal' : 'Mensal'}</label>
                                        <input type="number" className="w-full p-2 border rounded-lg" value={formData[key] as number} onChange={e => setFormData({...formData, [key]: Number(e.target.value)})} />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-4">Ícone</label>
                        <div className="grid grid-cols-4 gap-3">
                            <IconOption icon={<PackageOpen />} label="Estrutura" value="scaffold" />
                            <IconOption icon={<Hammer />} label="Ferramenta" value="ladder" />
                            <IconOption icon={<Edit2 />} label="Misturador" value="mixer" />
                            <IconOption icon={<PenTool />} label="Furadeira" value="drill" />
                            <IconOption icon={<Truck />} label="Veículo" value="truck" />
                            <IconOption icon={<Cone />} label="Sinalização" value="cone" />
                            <IconOption icon={<HardHat />} label="EPI" value="helmet" />
                            <IconOption icon={<PackageOpen />} label="Caixa" value="box" />
                        </div>
                    </div>
                </form>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end space-x-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-600 font-medium rounded-xl">Cancelar</button>
                    <button type="submit" form="inventoryForm" className="px-8 py-3 bg-quark-dark text-white font-bold rounded-xl hover:bg-black">Salvar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
