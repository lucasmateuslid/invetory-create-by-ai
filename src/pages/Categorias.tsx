import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../components/Layout';
import { Plus, Edit, Trash, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Categoria {
  id: number;
  nome: string;
  descricao: string | null;
}

const Categorias = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Não foi possível carregar as categorias');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (categoria?: Categoria) => {
    if (categoria) {
      setEditingId(categoria.id);
      setNome(categoria.nome);
      setDescricao(categoria.descricao || '');
    } else {
      setEditingId(null);
      setNome('');
      setDescricao('');
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setNome('');
    setDescricao('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!nome) {
      toast.error('Por favor, informe o nome da categoria');
      return;
    }
    
    setSaving(true);
    
    try {
      if (editingId) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('categorias')
          .update({
            nome,
            descricao: descricao || null,
          })
          .eq('id', editingId);
          
        if (error) throw error;
        toast.success('Categoria atualizada com sucesso');
      } else {
        // Criar nova categoria
        const { error } = await supabase
          .from('categorias')
          .insert({
            nome,
            descricao: descricao || null,
          });
          
        if (error) throw error;
        toast.success('Categoria criada com sucesso');
      }
      
      // Recarregar lista e fechar modal
      await fetchCategorias();
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast.error('Não foi possível salvar a categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        // Verificar se existem equipamentos usando esta categoria
        const { data: equipamentos, error: checkError } = await supabase
          .from('equipamentos')
          .select('id')
          .eq('categoria_id', id)
          .limit(1);
          
        if (checkError) throw checkError;
        
        if (equipamentos && equipamentos.length > 0) {
          toast.error('Não é possível excluir: existem equipamentos vinculados a esta categoria');
          return;
        }
        
        // Excluir categoria
        const { error } = await supabase
          .from('categorias')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        toast.success('Categoria removida com sucesso');
        setCategorias(categorias.filter(c => c.id !== id));
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        toast.error('Não foi possível excluir a categoria');
      }
    }
  };

  return (
    <Layout title="Categorias">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => openModal()}
          className="btn-primary"
        >
          <Plus size={18} className="mr-2" />
          Nova Categoria
        </button>
      </div>
      
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-4">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : categorias.length > 0 ? (
                categorias.map((categoria) => (
                  <tr key={categoria.id} className="hover:bg-gray-50">
                    <td className="font-medium">{categoria.nome}</td>
                    <td className="text-gray-700">{categoria.descricao || '-'}</td>
                    <td className="text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openModal(categoria)}
                          className="p-1 text-gray-600 hover:text-primary-600"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(categoria.id)}
                          className="p-1 text-gray-600 hover:text-error-600"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-gray-500">
                    Nenhuma categoria encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal de Cadastro/Edição */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingId ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="nome" className="label">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="descricao" className="label">
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="input"
                  rows={3}
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Save size={18} className="mr-2" />
                  )}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Categorias;