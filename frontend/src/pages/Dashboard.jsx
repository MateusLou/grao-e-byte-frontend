import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ResumoFinanceiro from '../components/dashboard/ResumoFinanceiro';

import EstoqueCritico from '../components/dashboard/EstoqueCritico';
import MetasDoDia from '../components/dashboard/MetasDoDia';
import TopVendidos from '../components/dashboard/TopVendidos';
import GraficoPorHora from '../components/dashboard/GraficoPorHora';
import UltimasVendas from '../components/dashboard/UltimasVendas';

function Dashboard() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isGerente = localStorage.getItem('userRole') === 'gerente';

  const fetchDashboard = useCallback(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setDados(data);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, [token, navigate]);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (carregando) {
    return (
      <Layout>
        <p style={{ padding: 24, color: '#999' }}>Carregando...</p>
      </Layout>
    );
  }

  if (!dados) {
    return (
      <Layout>
        <p style={{ padding: 24, color: '#999' }}>Erro ao carregar dados.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="page-titulo">Dashboard</h2>
          <p className="page-subtitulo">Visão geral do dia</p>
        </div>
      </div>

      {/* Linha 1: Resumo financeiro */}
      <ResumoFinanceiro dados={dados.resumoFinanceiro} />

      {/* Linha 2: Estoque + Metas */}
      <div className="dashboard-grid" style={{ marginTop: 20 }}>
        <EstoqueCritico dados={dados.estoqueCritico} />
        <MetasDoDia dados={dados.metas} isGerente={isGerente} token={token} onMetaChanged={fetchDashboard} />
      </div>

      {/* Linha 3: Top vendidos + Grafico por hora */}
      <div className="dashboard-grid" style={{ marginTop: 20 }}>
        <TopVendidos dados={dados.topVendidosHoje} />
        <GraficoPorHora dados={dados.movimentoPorHora} />
      </div>

      {/* Linha 4: Ultimas vendas */}
      <div style={{ marginTop: 20 }}>
        <UltimasVendas dados={dados.ultimasVendas} />
      </div>
    </Layout>
  );
}

export default Dashboard;
