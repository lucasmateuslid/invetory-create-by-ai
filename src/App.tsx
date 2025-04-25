import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import Dashboard from './pages/Dashboard';
import Equipamentos from './pages/Equipamentos';
import NovoEquipamento from './pages/NovoEquipamento';
import CadastroLote from './pages/CadastroLote';
import EditarEquipamento from './pages/EditarEquipamento';
import Movimentacoes from './pages/Movimentacoes';
import NovaMovimentacao from './pages/NovaMovimentacao';
import Pedidos from './pages/Pedidos';
import Categorias from './pages/Categorias';
import Usuarios from './pages/Usuarios';
import ImportExport from './pages/ImportExport';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          
          {/* Rotas protegidas (requer autenticação) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/equipamentos" element={<Equipamentos />} />
            <Route path="/equipamentos/novo" element={<NovoEquipamento />} />
            <Route path="/equipamentos/cadastro-lote" element={<CadastroLote />} />
            <Route path="/equipamentos/:id" element={<EditarEquipamento />} />
            <Route path="/movimentacoes" element={<Movimentacoes />} />
            <Route path="/movimentacoes/nova" element={<NovaMovimentacao />} />
            <Route path="/pedidos" element={<Pedidos />} />
            <Route path="/import-export" element={<ImportExport />} />
            
            {/* Rotas de administrador */}
            <Route element={<AdminRoute />}>
              <Route path="/categorias" element={<Categorias />} />
              <Route path="/usuarios" element={<Usuarios />} />
            </Route>
          </Route>
          
          {/* Redirecionamentos */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'Poppins, sans-serif',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;