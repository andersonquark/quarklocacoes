import React from 'react';
import { useStore } from '../context/StoreContext';
import { OrderStatus } from '../types';
import { DollarSign, TrendingUp, Calendar, ArrowUpRight, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const Finance = () => {
  const { orders } = useStore();

  // Financial Calculations
  const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
  const activeOrders = orders.filter(o => 
    o.status === OrderStatus.DELIVERED || 
    o.status === OrderStatus.IN_TRANSIT || 
    o.status === OrderStatus.PENDING
  );
  const quoteOrders = orders.filter(o => o.status === OrderStatus.QUOTATION);

  const totalReceived = completedOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalReceivable = activeOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const potentialRevenue = quoteOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const chartData = [
    { name: 'Recebido', value: totalReceived, color: '#10b981' },
    { name: 'A Receber', value: totalReceivable, color: '#3b82f6' },
    { name: 'Potencial', value: potentialRevenue, color: '#9ca3af' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Financeiro</h2>
          <p className="text-gray-500">Controle de receitas e previsões</p>
        </div>
        <div className="flex items-center text-sm text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-200">
           <Calendar className="w-4 h-4 mr-2" />
           {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle size={60} />
          </div>
          <p className="text-sm font-medium text-gray-500">Total Recebido</p>
          <h3 className="text-3xl font-bold text-emerald-600 mt-2">
            R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-emerald-600/80 mt-1 flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-1" /> Pedidos Finalizados
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={60} />
          </div>
          <p className="text-sm font-medium text-gray-500">A Receber (Ativos)</p>
          <h3 className="text-3xl font-bold text-blue-600 mt-2">
            R$ {totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-blue-600/80 mt-1 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> Contratos Vigentes
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign size={60} />
          </div>
          <p className="text-sm font-medium text-gray-500">Potencial (Orçamentos)</p>
          <h3 className="text-3xl font-bold text-gray-600 mt-2">
            R$ {potentialRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
             Negociações em aberto
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Transações Recentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-xs text-gray-500 font-medium uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Pedido</th>
                  <th className="px-6 py-3 text-left">Cliente</th>
                  <th className="px-6 py-3 text-left">Vencimento</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 10).map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id.slice(-6)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.clientName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.returnDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-bold
                        ${order.status === 'FINALIZADO' ? 'bg-green-100 text-green-700' : 
                          order.status === 'ORCAMENTO' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      R$ {order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                   <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhuma transação registrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
           <h3 className="font-bold text-gray-800 mb-4 w-full text-left">Distribuição de Receita</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;