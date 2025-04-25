import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Plus, Search, Filter, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

// Tipos
interface Movimentacao {
  id: number;
  equipamento_id: number;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  data: string;
  usuario_id: string;
  observacoes: string | null;
  equipamentos: {
    nome: string;
  };
  profiles: {
    nome: string;
  };
}

const Movimentacoes = () => {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('');

  useEffect(() => {
    fetchMovimentacoes();
  }, [tipoFiltro]);

  const fetchMovimentacoes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('movimentacoes')
        .select(`
          id,
          equipamento_id,
          tipo,
          quantidade,
          data,
          usuario_id,
          observacoes,
          equipamentos(nome),
          profiles(nome)
        `)
        .order('data', { ascending: false });

      if (tipoFiltro) {
        query = query.eq('tipo', tipoFiltro);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMovimentacoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      toast.error('Não foi possível carregar as movimentações');
    } finally {
      setLoading(false);
    }
  };

  const filteredMovimentacoes = movimentacoes.filter(
    movimentacao => 
      movimentacao.equipamentos.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movimentacao.profiles.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Movimentações">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="w-full sm:w-auto flex items-center relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar movimentações..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
          <div className="flex items-center">
            <Filter size={18} className="text-gray-500 mr-2" />
            <select
              className="input"
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
            >
              <option value="">Todos os tipos</option>
              <option value="entrada">Entradas</option>
              <option value="saida">Saídas</option>
            </select>
          </div>
          
          <Link to="/movimentacoes/nova" className="btn-primary whitespace-nowrap">
            <Plus size={18} className="mr-1" />
            Nova Movimentação
          </Link>
        </div>
      </div>
      
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Equipamento</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Data</th>
                <th>Responsável</th>
                <th className="text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredMovimentacoes.length > 0 ? (
                filteredMovimentacoes.map((movimentacao) => (
                  <tr key={movimentacao.id} className="hover:bg-gray-50">
                    <td className="font-medium">{movimentacao.equipamentos.nome}</td>
                    <td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        movimentacao.tipo === 'entrada' 
                          ? 'bg-success-50 text-success-700' 
                          : 'bg-error-50 text-error-700'
                      }`}>
                        {movimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td>{movimentacao.quantidade}</td>
                    <td>
                      {format(new Date(movimentacao.data), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </td>
                    <td>{movimentacao.profiles.nome}</td>
                    <td className="text-right">
                      <button
                        onClick={() => {
                          if (movimentacao.observacoes) {
                            toast(movimentacao.observacoes, {
                              icon: <Info size={18} />,
                              duration: 5000,
                            });
                          } else {
                            toast('Sem observações adicionais', {
                              icon: <Info size={18} />,
                            });
                          }
                        }}
                        className="p-1 text-gray-600 hover:text-primary-600"
                      >
                        <Info size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    Nenhuma movimentação encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Movimentacoes;