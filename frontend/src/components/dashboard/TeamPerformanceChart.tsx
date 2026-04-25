import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { PieChart as PieChartIcon, BarChart2 } from 'lucide-react';

import api from '../../services/api';

const COLORS = ['#000000', '#262626', '#404040', '#525252', '#737373'];

export default function TeamPerformanceChart() {
    const [loading, setLoading] = useState(true);
    const [barData, setBarData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/dashboard/team-performance');
            setBarData(res.data.barData || []);
            setPieData(res.data.pieData && res.data.pieData.length > 0 ? res.data.pieData : [{ name: 'Nenhum contrato', value: 1 }]);
        } catch (error) {
            console.error('Erro ao buscar desempenho da equipe:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-pulse">
               <div className="h-80 bg-app-card border border-app-stroke rounded-2xl"></div>
               <div className="h-80 bg-app-card border border-app-stroke rounded-2xl"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Gráfico de Barras - Produtividade */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-app-card border border-app-stroke rounded-2xl p-5 shadow-sm hover:border-primary/30 transition-colors"
                style={{ boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-black dark:bg-white/10 flex items-center justify-center">
                        <BarChart2 className="text-black dark:text-white" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-app-text-main">Volume de Trabalho</h3>
                        <p className="text-xs text-app-text-muted">Processos, Tarefas e Prazos (Última Semana)</p>
                    </div>
                </div>

                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" opacity={0.5} />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#a3a3a3', fontSize: 12 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#a3a3a3', fontSize: 12 }} 
                            />
                             <Tooltip 
                                cursor={{ fill: '#000000', opacity: 0.05 }}
                                contentStyle={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-stroke)', borderRadius: '12px', border: '1px solid var(--app-stroke)' }}
                                itemStyle={{ color: 'var(--app-text-main)', fontSize: '12px' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
                            <Bar dataKey="processos" name="Processos Novos" fill="#000000" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1500} />
                            <Bar dataKey="tarefas" name="Tarefas Concluídas" fill="#737373" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1500} />
                            <Bar dataKey="prazos" name="Prazos" fill="#D4D4D4" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1500} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Gráfico de Pizza - Contratos */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-app-card border border-app-stroke rounded-2xl p-5 shadow-sm hover:border-black/30 dark:hover:border-white/30 transition-colors"
                style={{ boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)' }}
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-black dark:bg-white/10 flex items-center justify-center">
                        <PieChartIcon className="text-white dark:text-white" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-app-text-main">Contratos Fechados</h3>
                        <p className="text-xs text-app-text-muted">Distribuição por Área de Atuação</p>
                    </div>
                </div>

                <div className="h-[250px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                                isAnimationActive={true}
                                animationDuration={1500}
                            >
                                {pieData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                             <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--app-card)', borderColor: 'var(--app-stroke)', borderRadius: '12px', border: '1px solid var(--app-stroke)' }}
                                itemStyle={{ color: 'var(--app-text-main)', fontSize: '12px' }}
                            />
                            <Legend 
                                layout="vertical" 
                                verticalAlign="middle" 
                                align="right"
                                wrapperStyle={{ fontSize: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}
