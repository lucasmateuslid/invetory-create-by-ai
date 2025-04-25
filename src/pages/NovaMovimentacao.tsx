import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Save, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Equipamento {
  id: number;
  nome: string;
  num_serie: string;
  quantidade: number;
}

const NovaMovimentacao = () => {
  const [equipamentoId, setEquipamentoId] = useState<number | ''>('');
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [equipamentoSelecionado, setEquipamentoSelecionado] = useState<Equipamento | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEquipamentos();
  }, []);

  useEffect(() => {
    if (equipamentoId !== '') {
      const equipamento = equipamentos.find(e => e.id === equipamentoId);
      setEquipamentoSelecionado(equipamento || null);
    } else {
      setEquipamentoSelecionado(null);
    }
  }, [equipamentoId, equipamentos]);

  const fetchEquipamentos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('id, nome, num_serie, quantidade')
        .order('nome');

      if (error) throw error;
      setEquipamentos(data || []);
      
      // Se houver equipamentos, selecionar o primeiro por padrão
      if (data && data.length > 0) {
        setEquipamentoId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
      toast.error('Não foi possível carregar os equipamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      toast.error('Usuário não identificado');
      return;
    }
    
    if (equipamentoId === '') {
      toast.error('Por favor, selecione um equipamento');
      return;
    }
    
    if (quantidade <= 0) {
      toast.error('A quantidade deve ser maior que zero');
      return;
    }
    
    // Validar se há estoque suficiente para saída
    if (tipo === 'saida' && equipamentoSelecionado && quantidade > equipamentoSelecionado.quantidade) {
      toast.error(`Quantidade indisponível. Estoque atual: ${equipamentoSelecionado.quantidade}`);
      return;
    }
    
    setSubmitLoading(true);
    
    try {
      // Registrar a movimentação
      const { error } = await supabase
        .from('movimentacoes')
        .insert({
          equipamento_id: equipamentoId,
          tipo,
          quantidade,
          data: new Date().toISOString(),
          usuario_id: user.id,
          observacoes: observacoes || null,
        });
        
      if (error) throw error;
      
      toast.success('Movimentação registrada com sucesso');
      navigate('/movimentacoes');
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast.error('Não foi possível registrar a movimentação');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Layout title="Nova Movimentação">
      <div className="card p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="equipamento" className="label">
                  Equipamento *
                </label>
                <select
                  id="equipamento"
                  value={equipamentoId}
                  onChange={(e) => setEquipamentoId(parseInt(e.target.value))}
                  className="input"
                  required
                >
                  <option value="" disabled>Selecione um equipamento</option>
                  {equipamentos.map((equipamento) => (
                    <option key={equipamento.id} value={equipamento.id}>
                      {equipamento.nome} - {equipamento.num_serie}
                    </option>
                  ))}
                </select>
                
                {equipamentoSelecionado && (
                  <p className="mt-1 text-sm text-gray-600">
                    Estoque atual: {equipamentoSelecionado.quantidade} unidades
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="tipo" className="label">
                  Tipo de Movimentação *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`py-2 px-4 rounded-md border ${
                      tipo === 'entrada'
                        ? 'bg-success-50 border-success-500 text-success-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setTipo('entrada')}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-4 rounded-md border ${
                      tipo === 'saida'
                        ? 'bg-error-50 border-error-500 text-error-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => setTipo('saida')}
                  >
                    Saída
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="quantidade" className="label">
                  Quantidade *
                </label>
                <input
                  type="number"
                  id="quantidade"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value))}
                  className="input"
                  required
                />
              </div>
            </div>
            
            {tipo === 'saida' && equipamentoSelecionado && quantidade > equipamentoSelecionado.quantidade && (
              <div className="mt-4 p-3 bg-error-50 text-error-700 rounded-md flex items-start">
                <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
                <p>
                  Quantidade indisponível. O estoque atual deste equipamento é de {equipamentoSelecionado.quantidade} unidades.
                </p>
              </div>
            )}
            
            <div className="mt-6">
              <label htmlFor="observacoes" className="label">
                Observações
              </label>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="input min-h-[100px]"
                placeholder="Adicione informações adicionais sobre esta movimentação..."
                rows={4}
              ></textarea>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/movimentacoes')}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                ) : (
                  <Save size={18} className="mr-2" />
                )}
                Registrar Movimentação
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default NovaMovimentacao;