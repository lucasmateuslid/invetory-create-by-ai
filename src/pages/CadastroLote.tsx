import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { QrReader } from 'react-qr-reader';
import { Plus, Minus, Save, Camera, Ban } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Categoria {
  id: number;
  nome: string;
}

interface EquipamentoLote {
  id: string;
  nome: string;
  num_serie: string;
  categoria_id: number;
  quantidade: number;
  data_aquisicao: string;
  descricao?: string;
}

const criarEquipamentoVazio = (categoria_id: number = 0): EquipamentoLote => ({
  id: crypto.randomUUID(),
  nome: '',
  num_serie: '',
  categoria_id,
  quantidade: 1,
  data_aquisicao: new Date().toISOString().split('T')[0],
  descricao: ''
});

const CadastroLote = () => {
  const [equipamentos, setEquipamentos] = useState<EquipamentoLote[]>([criarEquipamentoVazio()]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannerAtivo, setScannerAtivo] = useState(false);
  const [equipamentoAtualIndex, setEquipamentoAtualIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
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

    fetchCategorias();
  }, []);

  const adicionarEquipamento = () => {
    const categoriaDefault = equipamentos[0]?.categoria_id || 0;
    setEquipamentos([...equipamentos, criarEquipamentoVazio(categoriaDefault)]);
  };

  const removerEquipamento = (index: number) => {
    if (equipamentos.length > 1) {
      setEquipamentos(equipamentos.filter((_, i) => i !== index));
    }
  };

  const atualizarEquipamento = (index: number, campo: keyof EquipamentoLote, valor: any) => {
    setEquipamentos(prev =>
      prev.map((equip, i) => (i === index ? { ...equip, [campo]: valor } : equip))
    );
  };

  const handleScan = (result: any, index: number) => {
    if (result?.text) {
      atualizarEquipamento(index, 'num_serie', result.text);
      setScannerAtivo(false);
      setEquipamentoAtualIndex(null);
      toast.success('Código lido com sucesso!');
    }
  };

  const handleError = (error: any) => {
    console.error(error);
    toast.error('Erro ao ler código QR');
  };

  const validarDados = () => equipamentos.every(equip =>
    equip.nome && equip.num_serie && equip.categoria_id && equip.quantidade >= 1
  );

  const handleSubmit = async () => {
    if (!validarDados()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const numerosSerie = equipamentos.map(e => e.num_serie);
      const numerosSerieUnicos = new Set(numerosSerie);
      if (numerosSerieUnicos.size !== numerosSerie.length) {
        toast.error('Existem números de série duplicados');
        return;
      }

      const { data: existentes, error: checkError } = await supabase
        .from('equipamentos')
        .select('num_serie')
        .in('num_serie', numerosSerie);

      if (checkError) throw checkError;

      if (existentes?.length) {
        const numerosExistentes = existentes.map(e => e.num_serie).join(', ');
        toast.error(`Números de série já cadastrados: ${numerosExistentes}`);
        return;
      }

      const { error } = await supabase
        .from('equipamentos')
        .insert(equipamentos.map(({ id, ...rest }) => rest));

      if (error) throw error;

      toast.success('Equipamentos cadastrados com sucesso!');
      navigate('/equipamentos');
    } catch (error) {
      console.error('Erro ao cadastrar equipamentos:', error);
      toast.error('Não foi possível cadastrar os equipamentos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Cadastro em Lote">
      <div className="space-y-6">
        {equipamentos.map((equip, index) => (
          <div key={equip.id} className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Equipamento {index + 1}</h3>
              {equipamentos.length > 1 && (
                <button
                  onClick={() => removerEquipamento(index)}
                  className="text-error-600 hover:text-error-700"
                >
                  <Minus size={20} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Nome do Equipamento *</label>
                <input
                  type="text"
                  value={equip.nome}
                  onChange={(e) => atualizarEquipamento(index, 'nome', e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Número de Série *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={equip.num_serie}
                    onChange={(e) => atualizarEquipamento(index, 'num_serie', e.target.value)}
                    className="input flex-1"
                    required
                  />
                  <button
                    onClick={() => {
                      setEquipamentoAtualIndex(index);
                      setScannerAtivo(true);
                    }}
                    className="btn-secondary"
                    type="button"
                  >
                    <Camera size={18} />
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Categoria *</label>
                <select
                  value={equip.categoria_id}
                  onChange={(e) => atualizarEquipamento(index, 'categoria_id', Number(e.target.value))}
                  className="input"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Quantidade *</label>
                <input
                  type="number"
                  min="1"
                  value={equip.quantidade}
                  onChange={(e) => atualizarEquipamento(index, 'quantidade', Number(e.target.value))}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Data de Aquisição *</label>
                <input
                  type="date"
                  value={equip.data_aquisicao}
                  onChange={(e) => atualizarEquipamento(index, 'data_aquisicao', e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Descrição</label>
                <textarea
                  value={equip.descricao}
                  onChange={(e) => atualizarEquipamento(index, 'descricao', e.target.value)}
                  className="input"
                  rows={3}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-between">
          <button onClick={adicionarEquipamento} className="btn-secondary" type="button">
            <Plus size={18} className="mr-2" /> Adicionar Equipamento
          </button>

          <div className="space-x-3">
            <button onClick={() => navigate('/equipamentos')} className="btn-secondary" type="button">
              Cancelar
            </button>
            <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
              {loading ? (
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
              ) : (
                <Save size={18} className="mr-2" />
              )}
              Salvar Todos
            </button>
          </div>
        </div>
      </div>

      {scannerAtivo && equipamentoAtualIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Ler Código QR</h3>
              <button onClick={() => { setScannerAtivo(false); setEquipamentoAtualIndex(null); }} className="text-gray-500 hover:text-gray-700">
                <Ban size={20} />
              </button>
            </div>

            <div className="aspect-square overflow-hidden rounded-lg">
              <QrReader
                constraints={{ facingMode: 'environment' }}
                onResult={(result) => result && handleScan(result, equipamentoAtualIndex)}
                onError={handleError}
                className="w-full"
              />
            </div>

            <p className="text-sm text-gray-500 mt-4 text-center">
              Posicione o código QR no centro da câmera
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CadastroLote;
