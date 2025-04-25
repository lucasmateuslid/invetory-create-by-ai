import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, ShieldCheck, User, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'usuario';
  created_at: string;
}

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [atualizando, setAtualizando] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, nome, role, created_at');
        
      if (profilesError) throw profilesError;
      
      // Buscar emails dos usuários
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) throw usersError;
      
      // Combinar dados
      const usuariosCompletos = profiles.map(profile => {
        const user = users.users.find(u => u.id === profile.id);
        return {
          ...profile,
          email: user?.email || 'E-mail não disponível',
        };
      });
      
      setUsuarios(usuariosCompletos);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Não foi possível carregar os usuários');
    } finally {
      setLoading(false);
    }
  };

  const alterarRole = async (userId: string, novoRole: 'admin' | 'usuario') => {
    setAtualizando(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: novoRole })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Atualizar estado local
      setUsuarios(usuarios.map(usuario => 
        usuario.id === userId ? { ...usuario, role: novoRole } : usuario
      ));
      
      toast.success(`Usuário atualizado para ${novoRole === 'admin' ? 'Administrador' : 'Usuário comum'}`);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Não foi possível atualizar o perfil do usuário');
    } finally {
      setAtualizando(false);
    }
  };

  const filteredUsuarios = usuarios.filter(
    usuario => 
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Gerenciar Usuários">
      <div className="flex items-center mb-6">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar usuários..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Nível de Acesso</th>
                <th>Data de Cadastro</th>
                <th className="text-right">Ações</th>
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
              ) : filteredUsuarios.length > 0 ? (
                filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="font-medium">{usuario.nome}</td>
                    <td>{usuario.email}</td>
                    <td>
                      <div className="flex items-center">
                        {usuario.role === 'admin' ? (
                          <>
                            <ShieldCheck size={18} className="text-primary-600 mr-1" />
                            <span>Administrador</span>
                          </>
                        ) : (
                          <>
                            <User size={18} className="text-gray-600 mr-1" />
                            <span>Usuário</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      {format(new Date(usuario.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end space-x-3">
                        {usuario.role === 'usuario' ? (
                          <button
                            onClick={() => alterarRole(usuario.id, 'admin')}
                            disabled={atualizando}
                            className="flex items-center text-sm text-primary-600 hover:text-primary-800"
                            title="Promover a administrador"
                          >
                            <CheckCircle size={16} className="mr-1" />
                            <span>Tornar Admin</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => alterarRole(usuario.id, 'usuario')}
                            disabled={atualizando}
                            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
                            title="Rebaixar para usuário comum"
                          >
                            <XCircle size={16} className="mr-1" />
                            <span>Remover Admin</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    Nenhum usuário encontrado
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

export default Usuarios;