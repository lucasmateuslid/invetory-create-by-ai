import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Categoria {
  id: number;
  nome: string;
}

interface EquipamentoData {
  id: number;
  nome: string;
  num_serie: string;
  categoria_id: number;
  quantidade: number;
  data_aquisicao: string;
  descricao: string | null;
}

const EditarEquipamento = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [nome, setNome] = useState('');
  const [numSerie, setNumSerie] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [quantidade, setQuantidade] = useState(1);
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [numSerieOriginal, setNumSerieOriginal] = useState('');

  useEffect(() => {
    if (id) {
      fetchEquipamento();
      fetchCategorias();
    }
  }, [id]);

  const fetchEquipamento = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        setNome(data.nome);
        setNumSerie(data.num_serie);
        setNumSerieOriginal(data.num_serie);
        setCategoriaId(data.categoria_id);
        setQuantidade(data.quantidade);
        setDataAquisicao(data.data_aquisicao);
        setDescricao(data.descricao || '');
      }
    } catch (error) {
      console.error('Erro ao buscar equipamento:', error);
      toast.error('Não foi possível carregar os dados do equipamento');
      navigate('/equipamentos');
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
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Não foi possível carregar as categorias');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!nome || !numSerie || categoriaId === '' || !dataAquisicao) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    setSaving(true);
    
    try {
      // Verificar duplicidade apenas se o número de série foi alterado
      if (numSerie !== numSerieOriginal) {
        const { data: existingData, error: existingError } = await supabase
          .from('equipamentos')
          .select('id')
          .eq('num_serie', numSerie)
          .neq('id', id)
          .maybeSingle();
          
        if (existingError) throw existingError;
        
        if (existingData) {
          toast.error('Já existe um equipamento com este número de série');
          setSaving(false);
          return;
        }
      }
      
      // Atualizar equipamento
      const { error } = await supabase
        .from('equipamentos')
        .update({
          nome,
          num_serie: numSerie,
          categoria_id: categoriaId,
          quantidade,
          data_aquisicao: dataAquisicao,
          descricao: descricao || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Equipamento atualizado com sucesso');
      navigate('/equipamentos');
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error);
      toast.error('Não foi possível atualizar o equipamento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Editar Equipamento">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Editar Equipamento">
      <div className="card p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nome" className="label">
                Nome do Equipamento *
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
            
            <div>
              <label htmlFor="numSerie" className="label">
                Número de Série *
              </label>
              <input
                type="text"
                id="numSerie"
                value={numSerie}
                onChange={(e) => setNumSerie(e.target.value)}
                className="input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="categoria" className="label">
                Categoria *
              </label>
              <select
                id="categoria"
                value={categoriaId}
                onChange={(e) => setCategoriaId(parseInt(e.target.value))}
                className="input"
                required
              >
                <option value="" disabled>Selecione uma categoria</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="quantidade" className="label">
                Quantidade *
              </label>
              <input
                type="number"
                id="quantidade"
                min="0"
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value))}
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
          </div>
          
          <div className="mt-6">
            <label htmlFor="descricao" className="label">
              Descrição
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="input min-h-[100px]"
              rows={4}
            ></textarea>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/equipamentos')}
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
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditarEquipamento;