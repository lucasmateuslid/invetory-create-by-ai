import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Upload, Download, FileSpreadsheet, Calendar, Filter, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const ImportExport = () => {
  const [loading, setLoading] = useState(false);
  const [equipamentos, setEquipamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportTipo, setExportTipo] = useState('todos');
  const [exportEquipamentoId, setExportEquipamentoId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importStep, setImportStep] = useState(1);

  useEffect(() => {
    // Definir datas padrão (último mês)
    const hoje = new Date();
    const ultimoMes = new Date();
    ultimoMes.setMonth(ultimoMes.getMonth() - 1);
    
    setDataFim(hoje.toISOString().split('T')[0]);
    setDataInicio(ultimoMes.toISOString().split('T')[0]);
    
    fetchEquipamentos();
    fetchCategorias();
  }, []);

  const fetchEquipamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setEquipamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
    }
  };

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const handleExportarMovimentacoes = async () => {
    setExportLoading(true);
    try {
      let query = supabase
        .from('movimentacoes')
        .select(`
          id,
          tipo,
          quantidade,
          data,
          observacoes,
          equipamentos(nome, num_serie),
          profiles(nome)
        `)
        .gte('data', dataInicio)
        .lte('data', `${dataFim}T23:59:59`);
      
      if (exportTipo !== 'todos') {
        query = query.eq('tipo', exportTipo);
      }
      
      if (exportEquipamentoId) {
        query = query.eq('equipamento_id', exportEquipamentoId);
      }
      
      const { data, error } = await query.order('data', { ascending: false });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('Nenhum dado encontrado para exportação');
        return;
      }
      
      // Preparar dados para exportação
      const exportData = data.map(item => ({
        'Equipamento': item.equipamentos.nome,
        'Nº Série': item.equipamentos.num_serie,
        'Tipo': item.tipo === 'entrada' ? 'Entrada' : 'Saída',
        'Quantidade': item.quantidade,
        'Data': new Date(item.data).toLocaleString('pt-BR'),
        'Responsável': item.profiles.nome,
        'Observações': item.observacoes || '',
      }));
      
      // Criar planilha
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');
      
      // Exportar arquivo
      const fileName = `movimentacoes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Exportação concluída com sucesso');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Não foi possível exportar os dados');
    } finally {
      setExportLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
      toast.error('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)');
      e.target.value = '';
      return;
    }
    
    setArquivoSelecionado(file);
    
    try {
      // Pré-visualizar dados
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (jsonData.length === 0) {
            toast.error('A planilha está vazia');
            return;
          }
          
          // Verificar estrutura mínima da planilha
          const primeiraLinha = jsonData[0] as any;
          const camposNecessarios = ['nome', 'num_serie', 'categoria', 'quantidade', 'data_aquisicao'];
          
          const temCamposNecessarios = camposNecessarios.every(campo => 
            Object.keys(primeiraLinha).some(key => 
              key.toLowerCase().includes(campo.toLowerCase())
            )
          );
          
          if (!temCamposNecessarios) {
            toast.error('A planilha não contém todos os campos necessários');
            return;
          }
          
          setPreviewData(jsonData.slice(0, 5)); // Mostrar apenas as 5 primeiras linhas
          setImportStep(2);
        } catch (error) {
          console.error('Erro ao processar arquivo:', error);
          toast.error('Não foi possível processar o arquivo');
        }
      };
      
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Erro ao ler arquivo:', error);
      toast.error('Não foi possível ler o arquivo');
    }
  };

  const handleImportarEquipamentos = async () => {
    if (!arquivoSelecionado) {
      toast.error('Nenhum arquivo selecionado');
      return;
    }
    
    setImportLoading(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          let sucessos = 0;
          let falhas = 0;
          
          // Processar cada linha
          for (const linha of jsonData) {
            const item = linha as any;
            
            // Encontrar categoria pelo nome
            const nomeCategoria = 
              item.categoria || 
              item.Categoria || 
              item.CATEGORIA || 
              'Outros';
            
            let categoriaId = null;
            
            // Buscar categoria existente
            const categoriaExistente = categorias.find((c: any) => 
              c.nome.toLowerCase() === nomeCategoria.toLowerCase()
            );
            
            if (categoriaExistente) {
              categoriaId = categoriaExistente.id;
            } else {
              // Criar nova categoria
              const { data: novaCategoria, error: errorCategoria } = await supabase
                .from('categorias')
                .insert({ nome: nomeCategoria })
                .select('id')
                .single();
                
              if (errorCategoria) {
                console.error('Erro ao criar categoria:', errorCategoria);
                falhas++;
                continue;
              }
              
              categoriaId = novaCategoria.id;
            }
            
            // Processar data
            let dataAquisicao = new Date().toISOString().split('T')[0];
            const dataRaw = item.data_aquisicao || item['Data de Aquisição'] || item.DATA_AQUISICAO;
            
            if (dataRaw) {
              // Tentar converter diferentes formatos de data
              try {
                const data = new Date(dataRaw);
                if (!isNaN(data.getTime())) {
                  dataAquisicao = data.toISOString().split('T')[0];
                }
              } catch (e) {
                // Usar data atual se não conseguir converter
              }
            }
            
            // Criar equipamento
            const equipamento = {
              nome: item.nome || item.Nome || item.NOME || '',
              num_serie: item.num_serie || item['Número de Série'] || item.NUM_SERIE || '',
              categoria_id: categoriaId,
              quantidade: parseInt(item.quantidade || item.Quantidade || item.QUANTIDADE || '1'),
              data_aquisicao: dataAquisicao,
              descricao: item.descricao || item.Descrição || item.DESCRICAO || '',
            };
            
            if (!equipamento.nome || !equipamento.num_serie) {
              falhas++;
              continue;
            }
            
            // Verificar se já existe um equipamento com o mesmo número de série
            const { data: existingEquipamento, error: errorExistente } = await supabase
              .from('equipamentos')
              .select('id')
              .eq('num_serie', equipamento.num_serie)
              .maybeSingle();
              
            if (errorExistente) {
              console.error('Erro ao verificar equipamento existente:', errorExistente);
              falhas++;
              continue;
            }
            
            if (existingEquipamento) {
              // Atualizar equipamento existente
              const { error: errorUpdate } = await supabase
                .from('equipamentos')
                .update({
                  nome: equipamento.nome,
                  categoria_id: equipamento.categoria_id,
                  quantidade: equipamento.quantidade,
                  descricao: equipamento.descricao,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingEquipamento.id);
                
              if (errorUpdate) {
                console.error('Erro ao atualizar equipamento:', errorUpdate);
                falhas++;
              } else {
                sucessos++;
              }
            } else {
              // Inserir novo equipamento
              const { error: errorInsert } = await supabase
                .from('equipamentos')
                .insert(equipamento);
                
              if (errorInsert) {
                console.error('Erro ao inserir equipamento:', errorInsert);
                falhas++;
              } else {
                sucessos++;
              }
            }
          }
          
          toast.success(`Importação concluída: ${sucessos} equipamentos importados com sucesso, ${falhas} falhas`);
          setImportStep(1);
          setArquivoSelecionado(null);
          setPreviewData([]);
          
          // Recarregar equipamentos
          fetchEquipamentos();
        } catch (error) {
          console.error('Erro ao processar importação:', error);
          toast.error('Ocorreu um erro durante a importação');
        } finally {
          setImportLoading(false);
        }
      };
      
      reader.readAsBinaryString(arquivoSelecionado);
    } catch (error) {
      console.error('Erro na importação:', error);
      toast.error('Não foi possível realizar a importação');
      setImportLoading(false);
    }
  };

  const cancelarImportacao = () => {
    setImportStep(1);
    setArquivoSelecionado(null);
    setPreviewData([]);
  };

  return (
    <Layout title="Importação e Exportação">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Importação */}
        <div className="card p-6 animate-fade-in">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Upload size={20} className="mr-2 text-primary-600" />
            Importar Equipamentos
          </h3>
          
          {importStep === 1 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Faça upload de um arquivo Excel (.xlsx ou .xls) com os dados dos equipamentos para importação.
              </p>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileSpreadsheet size={36} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-4">
                  Arraste um arquivo ou clique para selecionar
                </p>
                <input
                  type="file"
                  id="arquivo-import"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label htmlFor="arquivo-import" className="btn-primary cursor-pointer">
                  Selecionar Arquivo
                </label>
              </div>
              
              <div className="bg-primary-50 p-4 rounded-md">
                <h4 className="font-medium text-primary-800 mb-2">Formato Esperado</h4>
                <p className="text-sm text-primary-700 mb-2">
                  A planilha deve conter as seguintes colunas:
                </p>
                <ul className="text-sm text-primary-700 list-disc list-inside">
                  <li>nome: Nome do equipamento</li>
                  <li>num_serie: Número de série (único)</li>
                  <li>categoria: Nome da categoria</li>
                  <li>quantidade: Quantidade disponível</li>
                  <li>data_aquisicao: Data de aquisição (opcional)</li>
                  <li>descricao: Descrição do equipamento (opcional)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Pré-visualização dos Dados</h4>
                <div className="text-sm text-gray-500">
                  Mostrando 5 de {previewData.length} registros
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      {previewData.length > 0 && 
                        Object.keys(previewData[0]).map((key, index) => (
                          <th key={index}>{key}</th>
                        ))
                      }
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex}>{value?.toString() || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end space-x-3 mt-4">
                <button 
                  onClick={cancelarImportacao}
                  className="btn-secondary"
                  disabled={importLoading}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleImportarEquipamentos}
                  className="btn-primary"
                  disabled={importLoading}
                >
                  {importLoading ? (
                    <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Upload size={18} className="mr-2" />
                  )}
                  Confirmar Importação
                </button>
              </div>
              
              <div className="flex items-start mt-4 p-3 bg-amber-50 text-amber-800 rounded-md text-sm">
                <AlertCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Atenção</p>
                  <p>
                    Equipamentos com números de série existentes serão atualizados. 
                    Esta operação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Exportação */}
        <div className="card p-6 animate-fade-in">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Download size={20} className="mr-2 text-primary-600" />
            Exportar Movimentações
          </h3>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Exporte as movimentações de equipamentos para um arquivo Excel com base nos filtros abaixo.
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dataInicio" className="label flex items-center">
                    <Calendar size={16} className="mr-1" />
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    id="dataInicio"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="input"
                  />
                </div>
                
                <div>
                  <label htmlFor="dataFim" className="label flex items-center">
                    <Calendar size={16} className="mr-1" />
                    Data Final
                  </label>
                  <input
                    type="date"
                    id="dataFim"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="input"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="exportTipo" className="label flex items-center">
                  <Filter size={16} className="mr-1" />
                  Tipo de Movimentação
                </label>
                <select
                  id="exportTipo"
                  value={exportTipo}
                  onChange={(e) => setExportTipo(e.target.value)}
                  className="input"
                >
                  <option value="todos">Todas as movimentações</option>
                  <option value="entrada">Apenas entradas</option>
                  <option value="saida">Apenas saídas</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="exportEquipamento" className="label flex items-center">
                  <Filter size={16} className="mr-1" />
                  Equipamento
                </label>
                <select
                  id="exportEquipamento"
                  value={exportEquipamentoId}
                  onChange={(e) => setExportEquipamentoId(e.target.value)}
                  className="input"
                >
                  <option value="">Todos os equipamentos</option>
                  {equipamentos.map((equip: any) => (
                    <option key={equip.id} value={equip.id}>
                      {equip.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                onClick={handleExportarMovimentacoes}
                className="btn-primary"
                disabled={exportLoading}
              >
                {exportLoading ? (
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin mr-2"></div>
                ) : (
                  <Download size={18} className="mr-2" />
                )}
                Exportar para Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ImportExport;