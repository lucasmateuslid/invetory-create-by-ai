import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Plus, Search, Filter, Edit, Trash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

// Tipos
interface Equipamento {
  id: number;
  nome: string;
  num_serie: string;
  quantidade: number;
  data_aquisicao: string;
  categoria_id: number;
  categoria: {
    nome: string;
  };
}

const Equipamentos = () => {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categorias, setCategorias] = useState<{id: number, nome: string}[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<number | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchEquipamentos();
    fetchCategorias();
  }, [categoriaSelecionada]);

  const fetchEquipamentos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('equipamentos')
        .select(`
          id,
          nome,
          num_serie,
          quantidade,
          data_aquisicao,
          categoria_id,
          categorias(nome)
        `)
        .order('nome');

      if (categoriaSelecionada) {
        query = query.eq('categoria_id', categoriaSelecionada);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Formatar os dados para incluir o nome da categoria
      const formattedData = data.map(item => ({
        ...item,
        categoria: item.categorias,
      }));

      setEquipamentos(formattedData);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
      toast.error('Não foi possível carregar os equipamentos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setCategorias(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem remover equipamentos');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir este equipamento?')) {
      try {
        const { error } = await supabase
          .from('equipamentos')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        setEquipamentos(equipamentos.filter(e => e.id !== id));
        toast.success('Equipamento removido com sucesso');
      } catch (error) {
        console.error('Erro ao excluir equipamento:', error);
        toast.error('Não foi possível excluir o equipamento');
      }
    }
  };

  const filteredEquipamentos = equipamentos.filter(
    equipamento => 
      equipamento.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipamento.num_serie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Equipamentos">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div className="w-full sm:w-auto flex items-center relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar equipamentos..."
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
              value={categoriaSelecionada || ''}
              onChange={(e) => setCategoriaSelecionada(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nome}</option>
              ))}
            </select>
          </div>
          
          {isAdmin && (
            <Link to="/equipamentos/novo" className="btn-primary whitespace-nowrap">
              <Plus size={18} className="mr-1" />
              Novo Equipamento
            </Link>
          )}
        </div>
      </div>
      
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Nº Série</th>
                <th>Quantidade</th>
                <th>Data Aquisição</th>
                {isAdmin && <th className="text-right">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center py-4">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredEquipamentos.length > 0 ? (
                filteredEquipamentos.map((equipamento) => (
                  <tr key={equipamento.id} className="hover:bg-gray-50">
                    <td className="font-medium">{equipamento.nome}</td>
                    <td>{equipamento.categoria?.nome}</td>
                    <td>{equipamento.num_serie}</td>
                    <td>{equipamento.quantidade}</td>
                    <td>
                      {format(new Date(equipamento.data_aquisicao), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    {isAdmin && (
                      <td className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Link
                            to={`/equipamentos/${equipamento.id}`}
                            className="p-1 text-gray-600 hover:text-primary-600"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(equipamento.id)}
                            className="p-1 text-gray-600 hover:text-error-600"
                          >
                            <Trash size={18} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="text-center py-4 text-gray-500">
                    Nenhum equipamento encontrado
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

export default Equipamentos;