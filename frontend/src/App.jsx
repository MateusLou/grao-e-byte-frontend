import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Movimentacoes from './pages/Movimentacoes';
import Funcionarios from './pages/Funcionarios';
import AlertasEstoque from './pages/AlertasEstoque';
import Logs from './pages/Logs';
import Dashboard from './pages/Dashboard';
import Cardapio from './pages/Cardapio';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/novo" element={<ProductForm />} />
      <Route path="/products/editar/:id" element={<ProductForm />} />
      <Route path="/movimentacoes" element={<Movimentacoes />} />
      <Route path="/funcionarios" element={<Funcionarios />} />
      <Route path="/alertas" element={<AlertasEstoque />} />
      <Route path="/logs" element={<Logs />} />
      <Route path="/cardapio" element={<Cardapio />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
