
import React, { useEffect, useState } from 'react';
import { RentalOrder, Equipment, Customer, RentalStatus, CustomerRanking } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, AlertTriangle, DollarSign, FileText, Calendar, Trophy, Gift, Send, Crown } from 'lucide-react';
import { generateBirthdayMessage } from '../services/geminiService';

interface DashboardProps {
  rentals: RentalOrder[];
  equipment: Equipment[];
  customers: Customer[];
}

const Dashboard: React.FC<DashboardProps> = ({ rentals, equipment, customers }) => {
  const [birthdayMessage, setBirthdayMessage] = useState<string | null>(null);
  const [generatingMsgFor, setGeneratingMsgFor] = useState<string | null>(null);
  
  // Stats Logic
  const activeCount = rentals.filter(r => r.status === RentalStatus.ACTIVE).length;
  const lateCount = rentals.filter(r => r.status === RentalStatus.LATE).length;
  const pendingApproval = rentals.filter(r => r.status === RentalStatus.PENDING_APPROVAL).length;
  const totalRevenue = rentals.reduce((acc, curr) => acc + curr.totalValue, 0);

  // Ranking Logic
  const customerRanking: CustomerRanking[] = customers.map(c => {
      const customerRentals = rentals.filter(r => r.customerId === c.id && r.status !== RentalStatus.CANCELLED);
      const revenue = customerRentals.reduce((sum, r) => sum + r.totalValue, 0);
      return { ...c, totalRevenue: revenue, rentalCount: customerRentals.length };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);

  // Birthday Logic
  const currentMonth = new Date().getMonth();
  const birthdays = customers.filter(c => {
      if(!c.birthDate) return false;
      const d = new Date(c.birthDate);
      return d.getMonth() === currentMonth;
  }).sort((a, b) => {
      const da = new Date(a.birthDate!);
      const db = new Date(b.birthDate!);
      return da.getDate() - db.getDate();
  });

  const chartData = [
    { name: 'Jan', value: 4000 },
    { name: 'Fev', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Abr', value: 2780 },
    { name: 'Mai', value: 1890 },
    { name: 'Jun', value: 2390 },
    { name: 'Jul', value: 3490 },
    { name: 'Ago', value: totalRevenue },
  ];

  const handleGenerateBirthdayMsg = async (customerName: string) => {
      setGeneratingMsgFor(customerName);
      const msg = await generateBirthdayMessage(customerName);
      setBirthdayMessage(msg);
      setGeneratingMsgFor(null);
      
      if(msg) {
          const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
          window.open(url, '_blank');
      }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all">
      <div className="flex justify-between items-start z-10">
        <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${color} text-white bg-opacity-90`}>
            <Icon size={20} />
        </div>
      </div>
      {subtext && <p className="text-xs text-gray-400 z-10">{subtext}</p>}
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Painel de Controle</h1>
          <p className="text-gray-500 mt-1">Visão geral e inteligência de clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Receita Total" value={`R$ ${totalRevenue.toLocaleString('pt-BR', { notation: 'compact' })}`} icon={DollarSign} color="bg-green-500" subtext="+12% vs mês anterior" />
        <StatCard title="Aluguéis Ativos" value={activeCount} icon={TrendingUp} color="bg-blue-500" subtext="Equipamentos em campo" />
        <StatCard title="Em Análise" value={pendingApproval} icon={FileText} color="bg-orange-500" subtext="Requer aprovação" />
        <StatCard title="Atrasados" value={lateCount} icon={AlertTriangle} color="bg-red-500" subtext="Ação necessária" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Performance Financeira</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#1F1D2B' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
             {/* Ranking Widget */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                    <Trophy className="mr-2 text-yellow-500" size={20}/> Top 5 Clientes
                </h3>
                <div className="space-y-4">
                    {customerRanking.map((c, idx) => (
                        <div key={c.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                            <div className="flex items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-400'}`}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{c.name}</p>
                                    <p className="text-[10px] text-gray-400">{c.rentalCount} pedidos</p>
                                </div>
                            </div>
                            <p className="text-xs font-bold text-quark-dark">R$ {c.totalRevenue.toLocaleString('pt-BR', {notation: 'compact'})}</p>
                        </div>
                    ))}
                    {customerRanking.length === 0 && <p className="text-sm text-gray-400">Nenhum dado ainda.</p>}
                </div>
             </div>

            {/* Birthday Widget */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500 blur-[50px] opacity-10 rounded-full"></div>
                <h3 className="font-bold text-gray-900 mb-4 flex items-center relative z-10">
                    <Gift className="mr-2 text-pink-500" size={20}/> Aniversariantes (Mês)
                </h3>
                <div className="space-y-3 relative z-10">
                    {birthdays.map(c => {
                        const day = new Date(c.birthDate!).getDate();
                        const isToday = day === new Date().getDate();
                        return (
                            <div key={c.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold mr-3 ${isToday ? 'bg-pink-500 text-white' : 'bg-white text-gray-500 border'}`}>
                                        <span>{day}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{c.name.split(' ')[0]}</p>
                                        {isToday && <span className="text-[10px] text-pink-600 font-bold animate-pulse">É Hoje!</span>}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleGenerateBirthdayMsg(c.name)}
                                    disabled={generatingMsgFor === c.name}
                                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors"
                                    title="Enviar Parabéns com IA"
                                >
                                    {generatingMsgFor === c.name ? <span className="text-[10px]">...</span> : <Send size={14} />}
                                </button>
                            </div>
                        )
                    })}
                    {birthdays.length === 0 && (
                        <div className="text-center py-4">
                            <Calendar size={32} className="mx-auto text-gray-200 mb-2"/>
                            <p className="text-sm text-gray-400">Nenhum aniversariante este mês.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
