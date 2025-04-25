import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Plus, Search, Filter, ArrowUpDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Pedido {
  id: string;
  fabricante: string;
  data_aquisicao: string;
  codigo_rastreamento: string | null;
  criado_por: string;
  data_criacao: string;
  profiles: {
    nome: string;
  };
}

const ITEMS_PER_PAGE = 10;

const Pedidos = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [fabricante, setFabricante] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [codigoRastreamento, setCodigoRastreamento] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<string>('data_criacao');
  const [sortAsc, setSortAsc] = useState(false);
  const [filterFabricante, setFilterFabricante] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');

  useEffect(() => {
    fetchPedidos();
  }, [currentPage, sortField, sortAsc, filterFabricante, filterDataInicio, filterDataFim, searchTerm]);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pedidos')
        .select('*, profiles(nome)', { count: 'exact' });

      // Aplicar filtros
      if (filterFabricante) {
        query = query.ilike('fabricante', `%${filterFabricante}%`);
      }

      if (filterDataInicio) {
        query = query.gte('data_aquisicao', filterDataInicio);
      }

      if (filterDataFim) {
        query = query.lte('data_aquisicao', filterDataFim);
      }

      if (searchTerm) {
        query = query.or(`codigo_rastreamento.ilike.%${searchTerm}%,fabricante.ilike.%${searchTerm}%`);
      }

      // Ordenação e paginação
      query = query
        .order(sortField, { ascending: sortAsc })
        .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

      const { data, error, count } = await query;

      if (error) throw error;
      setPedidos(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Não foi possível carregar os pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fabricante || !dataAquisicao) {
      toast.error('Por favor, preencha os campos obrigatórios');
      return;
    }
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('pedidos')
        .insert({
          fabricante,
          data_aquisicao: dataAquisicao,
          codigo_rastreamento: codigoRastreamento || null,
        });
        
      if (error) throw error;
      
      toast.success('Pedido cadastrado com sucesso');
      setModalOpen(false);
      setFabricante('');
      setDataAquisicao('');
      setCodigoRastreamento('');
      fetchPedidos();
    } catch (error) {
      console.error('Erro ao cadastrar pedido:', error);
      toast.error('Não foi possível cadastrar o pedido');
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Layout title="Pedidos">
      <div className="space-y-6">
        {/* Filtros e Ações */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full sm:w-auto flex items-center relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar pedidos..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Fabricante"
              className="input"
              value={filterFabricante}
              onChange={(e) => setFilterFabricante(e.target.value)}
            />
            
            <input
              type="date"
              className="input"
              value={filterDataInicio}
              onChange={(e) => setFilterDataInicio(e.target.value)}
            />
            
            <input
              type="date"
              className="input"
              value={filterDataFim}
              onChange={(e) => setFilterDataFim(e.target.value)}
            />
            
            <button
              onClick={() => setModalOpen(true)}
              className="btn-primary whitespace-nowrap"
            >
              <Plus size={18} className="mr-2" />
              Novo Pedido
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <button
                      className="flex items-center"
                      onClick={() => handleSort('fabricante')}
                    >
                      Fabricante
                      <ArrowUpDown size={16} className="ml-1" />
                    </button>
                  </th>
                  <th>
                    <button
                      className="flex items-center"
                      onClick={() => handleSort('data_aquisicao')}
                    >
                      Data de Aquisição
                      <ArrowUpDown size={16} className="ml-1" />
                    </button>
                  </th>
                  <th>Código de Rastreamento</th>
                  <th>Responsável</th>
                  <th>
                    <button
                      className="flex items-center"
                      onClick={() => handleSort('data_criacao')}
                    >
                      Data de Criação
                      <ArrowUpDown size={16} className="ml-1" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : pedidos.length > 0 ? (
                  pedidos.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="font-medium">{pedido.fabricante}</td>
                      <td>{format(new Date(pedido.data_aquisicao), 'dd/MM/yyyy', { locale: ptBR })}</td>
                      <td>{pedido.codigo_rastreamento || '-'}</td>
                      <td>{pedido.profiles.nome}</td>
                      <td>{format(new Date(pedido.data_criacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Mostrando {currentPage * ITEMS_PER_PAGE + 1} a{' '}
                {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCount)} de {totalCount} resultados
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="btn-secondary"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="btn-secondary"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Novo Pedido */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">Novo Pedido</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fabricante" className="label">
                    Fabricante *
                  </label>
                  <input
                    type="text"
                    id="fabricante"
                    value={fabricante}
                    onChange={(e) => setFabricante(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="dataAquisicao" className="label">
                    Data de Aquisição *
                  </label>
                  <input
                    type="date"
                    id="dataAquisicao"
                    value={dataAquisicao}
                    onChange={(e) => setDataAquisicao(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="codigoRastreamento" className="label">
                    Código de Rastreamento
                  </label>
                  <input
                    type="text"
                    id="codigoRastreamento"
                    value={codigoRastreamento}
                    onChange={(e) => setCodigoRastreamento(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary mr-4"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Pedidos;
