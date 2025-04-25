import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="p-4 rounded-full bg-primary-100 mb-6">
        <Package size={48} className="text-primary-600" />
      </div>
      
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <h2 className="text-2xl font-medium text-gray-800 mb-6">Página não encontrada</h2>
      
      <p className="text-gray-600 mb-8 text-center max-w-md">
        A página que você está procurando pode ter sido removida ou está temporariamente indisponível.
      </p>
      
      <Link to="/dashboard" className="btn-primary flex items-center">
        <ArrowLeft size={18} className="mr-2" />
        Voltar para o Dashboard
      </Link>
    </div>
  );
};

export default NotFound;