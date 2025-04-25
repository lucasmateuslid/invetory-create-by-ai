import React, { useState, ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Package, LineChart, ArrowRightLeft, FilePlus, 
  Menu, X, LogOut, User, Users, Tag, 
  FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

const Layout = ({ children, title }: LayoutProps) => {
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inventarioOpen, setInventarioOpen] = useState(true);
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleInventario = () => {
    setInventarioOpen(!inventarioOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-2 text-gray-600"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              InventControl
            </h1>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="hidden md:flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <LogOut size={18} className="mr-1" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-md font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <LineChart size={18} className="mr-2" />
                Dashboard
              </NavLink>
              
              <div className="pt-4">
                <button 
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 px-3 py-2"
                  onClick={toggleInventario}
                >
                  <span className="flex items-center">
                    <Package size={18} className="mr-2" />
                    Inventário
                  </span>
                  {inventarioOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {inventarioOpen && (
                  <div className="ml-6 mt-1 space-y-1">
                    <NavLink 
                      to="/equipamentos" 
                      className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-md ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <FilePlus size={16} className="mr-2" />
                      Equipamentos
                    </NavLink>
                    <NavLink 
                      to="/movimentacoes" 
                      className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-md ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <ArrowRightLeft size={16} className="mr-2" />
                      Movimentações
                    </NavLink>
                    <NavLink 
                      to="/import-export" 
                      className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-md ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <FileText size={16} className="mr-2" />
                      Importar/Exportar
                    </NavLink>
                  </div>
                )}
              </div>
              
              {isAdmin && (
                <>
                  <NavLink 
                    to="/categorias" 
                    className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-md font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Tag size={18} className="mr-2" />
                    Categorias
                  </NavLink>
                  <NavLink 
                    to="/usuarios" 
                    className={({ isActive }) => `flex items-center px-3 py-2 text-sm rounded-md font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <Users size={18} className="mr-2" />
                    Usuários
                  </NavLink>
                </>
              )}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <User size={18} className="text-primary-700" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Meu Perfil</p>
                <p className="text-xs text-gray-500">{isAdmin ? 'Administrador' : 'Usuário'}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Menu mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleMobileMenu}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="px-2 space-y-1">
                  <NavLink 
                    to="/dashboard" 
                    className={({ isActive }) => `flex items-center px-3 py-2 text-base rounded-md font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={toggleMobileMenu}
                  >
                    <LineChart size={20} className="mr-3" />
                    Dashboard
                  </NavLink>
                  
                  <NavLink 
                    to="/equipamentos" 
                    className={({ isActive }) => `flex items-center px-3 py-2 text-base rounded-md font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={toggleMobileMenu}
                  >
                    <FilePlus size={20} className="mr-3" />
                    Equipamentos
                  </NavLink>
                  
                  <NavLink 
                    to="/movimentacoes" 
                    className={({ isActive }) => `flex items-center px-3 py-2 text-base rounded-md font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={toggleMobileMenu}
                  >
                    <ArrowRightLeft size={20} className="mr-3" />
                    Movimentações
                  </NavLink>
                  
                  <NavLink 
                    to="/import-export" 
                    className={({ isActive }) => `flex items-center px-3 py-2 text-base rounded-md font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    onClick={toggleMobileMenu}
                  >
                    <FileText size={20} className="mr-3" />
                    Importar/Exportar
                  </NavLink>
                  
                  {isAdmin && (
                    <>
                      <NavLink 
                        to="/categorias" 
                        className={({ isActive }) => `flex items-center px-3 py-2 text-base rounded-md font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={toggleMobileMenu}
                      >
                        <Tag size={20} className="mr-3" />
                        Categorias
                      </NavLink>
                      
                      <NavLink 
                        to="/usuarios" 
                        className={({ isActive }) => `flex items-center px-3 py-2 text-base rounded-md font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'}`}
                        onClick={toggleMobileMenu}
                      >
                        <Users size={20} className="mr-3" />
                        Usuários
                      </NavLink>
                    </>
                  )}
                  
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center px-3 py-2 text-base rounded-md font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut size={20} className="mr-3" />
                    Sair
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            {children}
          </div>
        </main>
      </div>
      
      {/* Navegação mobile (fixa na parte inferior) */}
      <nav className="md:hidden bg-white border-t border-gray-200 fixed bottom-0 w-full">
        <div className="grid grid-cols-4 h-16">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `flex flex-col items-center justify-center ${isActive ? 'text-primary-600' : 'text-gray-600'}`}
          >
            <LineChart size={20} />
            <span className="text-xs mt-1">Dashboard</span>
          </NavLink>
          <NavLink 
            to="/equipamentos" 
            className={({ isActive }) => `flex flex-col items-center justify-center ${isActive ? 'text-primary-600' : 'text-gray-600'}`}
          >
            <Package size={20} />
            <span className="text-xs mt-1">Equipamentos</span>
          </NavLink>
          <NavLink 
            to="/movimentacoes" 
            className={({ isActive }) => `flex flex-col items-center justify-center ${isActive ? 'text-primary-600' : 'text-gray-600'}`}
          >
            <ArrowRightLeft size={20} />
            <span className="text-xs mt-1">Movimentações</span>
          </NavLink>
          <NavLink 
            to="/import-export" 
            className={({ isActive }) => `flex flex-col items-center justify-center ${isActive ? 'text-primary-600' : 'text-gray-600'}`}
          >
            <FileText size={20} />
            <span className="text-xs mt-1">Importar</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Layout;