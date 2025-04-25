import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';

const Cadastro = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!nome || !email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await signUp(email, password, nome);
      
      if (error) {
        toast.error(error.message || 'Falha ao criar conta');
        return;
      }
      
      toast.success('Conta criada com sucesso!');
      navigate('/login');
    } catch (error) {
      toast.error('Ocorreu um erro ao criar conta');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary-100">
              <Package size={30} className="text-primary-600" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Criar Conta</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Cadastre-se para acessar o sistema de inventário
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <div className="mt-1">
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  autoComplete="name"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input"
                  placeholder="Seu nome completo"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                A senha deve ter pelo menos 6 caracteres
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
                ) : (
                  'Cadastrar'
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Já tem uma conta?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Fazer login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;