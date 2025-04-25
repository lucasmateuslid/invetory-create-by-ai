import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Package, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [totalEquipamentos, setTotalEquipamentos] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Buscar total de equipamentos
      const { data: equipamentos, error: equipamentosError } = await supabase
        .from('equipamentos')
        .select('quantidade');

      if (equipamentosError) throw equipamentosError;

      const total = equipamentos.reduce((acc, item) => acc + item.quantidade, 0);
      setTotalEquipamentos(total);

      // Buscar total de entradas e saídas
      const { data: movimentacoes, error: movimentacoesError } = await supabase
        .from('movimentacoes')
        .select('tipo, quantidade');

      if (movimentacoesError) throw movimentacoesError;

      const entradas = movimentacoes
        .filter(m => m.tipo === 'entrada')
        .reduce((acc, item) => acc + item.quantidade, 0);
      const saidas = movimentacoes
        .filter(m => m.tipo === 'saida')
        .reduce((acc, item) => acc + item.quantidade, 0);

      setTotalEntradas(entradas);
      setTotalSaidas(saidas);

      // Preparar dados para o gráfico
      await prepareChartData();

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = async () => {
    try {
      // Últimos 6 meses
      const labels = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(currentDate, i);
        labels.push(format(month, 'MMM', { locale: ptBR }));
      }

      // Buscar dados de movimentações por mês
      const { data: movimentacoes, error } = await supabase
        .from('movimentacoes')
        .select('tipo, quantidade, data')
        .gte('data', subMonths(currentDate, 6).toISOString());

      if (error) throw error;

      // Processar dados para o gráfico
      const entradasPorMes = new Array(6).fill(0);
      const saidasPorMes = new Array(6).fill(0);

      movimentacoes.forEach(mov => {
        const movDate = new Date(mov.data);
        const monthIndex = 5 - Math.round((currentDate.getTime() - movDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
        
        if (monthIndex >= 0 && monthIndex < 6) {
          if (mov.tipo === 'entrada') {
            entradasPorMes[monthIndex] += mov.quantidade;
          } else {
            saidasPorMes[monthIndex] += mov.quantidade;
          }
        }
      });

      setChartData({
        labels,
        datasets: [
          {
            label: 'Entradas',
            data: entradasPorMes,
            backgroundColor: '#2563EB',
          },
          {
            label: 'Saídas',
            data: saidasPorMes,
            backgroundColor: '#EF4444',
          },
        ],
      });
    } catch (error) {
      console.error('Erro ao preparar dados do gráfico:', error);
    }
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 flex items-center">
          <div className="rounded-full p-3 bg-primary-100 mr-4">
            <Package size={24} className="text-primary-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">Total em Estoque</h3>
            <p className="text-2xl font-bold text-gray-900">{totalEquipamentos}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center">
          <div className="rounded-full p-3 bg-success-50 mr-4">
            <TrendingUp size={24} className="text-success-700" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">Total de Entradas</h3>
            <p className="text-2xl font-bold text-gray-900">{totalEntradas}</p>
          </div>
        </div>
        
        <div className="card p-6 flex items-center">
          <div className="rounded-full p-3 bg-error-50 mr-4">
            <TrendingDown size={24} className="text-error-700" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700">Total de Saídas</h3>
            <p className="text-2xl font-bold text-gray-900">{totalSaidas}</p>
          </div>
        </div>
      </div>
      
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Movimentações (Últimos 6 meses)</h3>
        <div className="h-80">
          <Bar 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }} 
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/equipamentos/novo" className="btn-primary">
              Cadastrar Equipamento
            </Link>
            <Link to="/movimentacoes/nova" className="btn-secondary">
              Registrar Movimentação
            </Link>
            <Link to="/equipamentos" className="btn-secondary">
              Ver Inventário
            </Link>
            <Link to="/import-export" className="btn-secondary">
              Importar/Exportar
            </Link>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Itens Recentes</h3>
          <div className="overflow-hidden">
            <table className="table">
              <thead>
                <tr>
                  <th>Equipamento</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {/* Dados seriam carregados do backend */}
                <tr>
                  <td className="text-gray-800">Sem dados recentes</td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;