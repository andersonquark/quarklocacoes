import React from 'react';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types';
import { 
  TrendingUp, 
  Package, 
  AlertCircle, 
  CheckCircle,
  Truck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const Dashboard = () => {
  const { orders, equipment, clients } = useStore();

  const activeOrders = orders.filter(o => 
    o.status !== OrderStatus.COMPLETED && 
    o.status !== OrderStatus.CANCELLED &&
    o.status !== OrderStatus.QUOTATION
  ).length;

  const deliveredOrders = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
  
  const totalRevenue = orders.reduce((acc, curr) => {
    return curr.status !== OrderStatus.CANCELLED && curr.status !== OrderStatus.QUOTATION 
      ? acc + curr.totalAmount 
      : acc;
  }, 0);

  // Chart Data Preparation
  const statusData = [
    { name: 'Separação', value: orders.filter(o => o.status === OrderStatus.PENDING).length, color: '#f59e0b' },
    { name: 'Em Rota', value: orders.filter(o => o.status === OrderStatus.IN_TRANSIT).length, color: '#3b82f6' },
    { name: 'Entregue', value: orders.filter(o => o.status === OrderStatus.DELIVERED).length, color: '#10b981' },
    { name: 'Finalizado', value: orders.filter(o => o.status === OrderStatus.COMPLETED).length, color: '#6b7280' },
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-gray-800">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <span className="text-sm text-gray-500">Visão Geral do Sistema</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Faturamento Total" 
          value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="bg-emerald-500"
          subtext="No período selecionado"
        />
        <StatCard 
          title="Locações Ativas" 
          value={deliveredOrders}
          icon={CheckCircle}
          color="bg-blue-500"
          subtext="Contratos vigentes"
        />
        <StatCard 
          title="Em Processamento" 
          value={activeOrders - deliveredOrders}
          icon={Truck}
          color="bg-amber-500"
          subtext="Aguardando ou em rota"
        />
        <StatCard 
          title="Clientes Ativos" 
          value={clients.length}
          icon={Package}
          color="bg-indigo-500"
          subtext="Cadastrados no sistema"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Status dos Pedidos</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            Alerta de Estoque
          </h3>
          <div className="space-y-4">
            {equipment.map(item => {
              const available = item.stockTotal - item.stockRented - item.stockReserved;
              const percentage = (available / item.stockTotal) * 100;
              
              if (percentage > 20) return null;

              return (
                <div key={item.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-xs font-bold text-red-500">{available} {item.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {equipment.every(item => (item.stockTotal - item.stockRented - item.stockReserved) / item.stockTotal > 0.2) && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum item com estoque crítico.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;