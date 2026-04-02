import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const ACOES = {
  criar: { label: 'Criação', cor: '#059669' },
  editar: { label: 'Edição', cor: '#F59E0B' },
  excluir: { label: 'Exclusão', cor: '#EF4444' },
  toggle_ativo: { label: 'Toggle Status', cor: '#7C3AED' },
  entrada: { label: 'Entrada', cor: '#059669' },
  saida: { label: 'Saída', cor: '#DC2626' },
  registro: { label: 'Registro', cor: '#3B82F6' },
  remover_funcionario: { label: 'Remoção', cor: '#EF4444' }
};

function Logs() {
  const [logs, setLogs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroAcao, setFiltroAcao] = useState('todos');
  const [filtroEntidade, setFiltroEntidade] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (userRole !== 'gerente') {
      navigate('/products');
      return;
    }
    carregarLogs();
  }, []);

  const carregarLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filtroAcao !== 'todos') params.append('acao', filtroAcao);
      if (filtroEntidade !== 'todos') params.append('entidade', filtroEntidade);
      if (dataInicio) params.append('dataInicio', dataInicio);
      if (dataFim) params.append('dataFim', dataFim);

      const response = await fetch(`/api/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const data = await response.json();
      setLogs(data);
    } catch {
      console.error('Erro ao carregar logs');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (token && userRole === 'gerente') {
      carregarLogs();
    }
  }, [filtroAcao, filtroEntidade, dataInicio, dataFim]);

  const temFiltroAtivo = filtroAcao !== 'todos' || filtroEntidade !== 'todos' || dataInicio || dataFim;

  const limparFiltros = () => {
    setFiltroAcao('todos');
    setFiltroEntidade('todos');
    setDataInicio('');
    setDataFim('');
  };

  const formatarData = (dataStr) => {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (carregando) {
    return (
      <Layout>
        <p style={{ padding: 24, color: '#999' }}>Carregando...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="page-titulo">Histórico de Alterações</h2>
          <p className="page-subtitulo">Registro de todas as ações no sistema</p>
        </div>
      </div>

      <div className="filtros-container">
        <div className="filtros-titulo-row">
          <span className="filtros-titulo">Filtros</span>
          {temFiltroAtivo && (
            <button className="filtros-limpar" onClick={limparFiltros}>
              Limpar filtros
            </button>
          )}
        </div>
        <div className="filtros-grid filtros-grid-4">
          <div className="filtro-grupo">
            <label className="filtro-label">Ação</label>
            <select
              className="filtro-select"
              value={filtroAcao}
              onChange={(e) => setFiltroAcao(e.target.value)}
            >
              <option value="todos">Todas</option>
              {Object.entries(ACOES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo">
            <label className="filtro-label">Entidade</label>
            <select
              className="filtro-select"
              value={filtroEntidade}
              onChange={(e) => setFiltroEntidade(e.target.value)}
            >
              <option value="todos">Todas</option>
              <option value="produto">Produto</option>
              <option value="funcionario">Funcionário</option>
              <option value="movimentacao">Movimentação</option>
            </select>
          </div>

          <div className="filtro-grupo">
            <label className="filtro-label">Data Início</label>
            <input
              type="date"
              className="filtro-input"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>

          <div className="filtro-grupo">
            <label className="filtro-label">Data Fim</label>
            <input
              type="date"
              className="filtro-input"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum registro encontrado.</p>
          {temFiltroAtivo && (
            <button className="filtros-limpar" onClick={limparFiltros} style={{ marginTop: 12 }}>
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="tabela-container">
          <table className="tabela">
            <thead>
              <tr>
                <th>Data</th>
                <th>Ação</th>
                <th>Entidade</th>
                <th>Nome</th>
                <th>Usuário</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const acaoInfo = ACOES[log.acao] || { label: log.acao, cor: '#6B7280' };
                return (
                  <tr key={log._id}>
                    <td className="tabela-data">{formatarData(log.data)}</td>
                    <td>
                      <span
                        className="log-acao-badge"
                        style={{ backgroundColor: acaoInfo.cor + '18', color: acaoInfo.cor }}
                      >
                        {acaoInfo.label}
                      </span>
                    </td>
                    <td>
                      <span className="tabela-categoria-inline">{log.entidade}</span>
                    </td>
                    <td><span className="tabela-nome">{log.entidadeNome || '—'}</span></td>
                    <td><span className="tabela-nome">{log.userId?.nome || 'Sistema'}</span></td>
                    <td><span className="tabela-email">{log.detalhes || '—'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

export default Logs;
