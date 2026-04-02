import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const CATEGORIAS = ['Graos', 'Insumos', 'Alimentos', 'Descartaveis'];

const ACOES_HISTORICO = {
  venda: { label: 'Venda', cor: '#3B82F6' },
  cancelar_venda: { label: 'Cancelamento', cor: '#DC2626' },
  criar: { label: 'Criação', cor: '#059669' },
  editar: { label: 'Edição', cor: '#F59E0B' },
  excluir: { label: 'Exclusão', cor: '#DC2626' },
  toggle_ativo: { label: 'Ativar/Desativar', cor: '#8B5CF6' },
  meta: { label: 'Meta', cor: '#0EA5E9' },
  registro: { label: 'Registro', cor: '#10B981' },
  remover_funcionario: { label: 'Remoção', cor: '#EF4444' }
};

function Movimentacoes() {
  const [abaGerente, setAbaGerente] = useState('movimentacoes');

  // Movimentacoes state
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroProduto, setFiltroProduto] = useState('todos');
  const [filtroFuncionario, setFiltroFuncionario] = useState('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [ordenacaoMov, setOrdenacaoMov] = useState('recente');

  // Logs/Historico state
  const [logs, setLogs] = useState([]);
  const [carregandoLogs, setCarregandoLogs] = useState(true);
  const [filtroAcao, setFiltroAcao] = useState('todos');
  const [filtroEntidade, setFiltroEntidade] = useState('todos');
  const [filtroUsuarioLog, setFiltroUsuarioLog] = useState('todos');
  const [dataInicioLog, setDataInicioLog] = useState('');
  const [dataFimLog, setDataFimLog] = useState('');
  const [ordenacaoLog, setOrdenacaoLog] = useState('recente');

  // Venda detail modal
  const [vendaDetalhe, setVendaDetalhe] = useState(null);
  const [carregandoVenda, setCarregandoVenda] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  const carregarMovimentacoes = async () => {
    try {
      const res = await fetch('/api/movimentacoes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      const data = await res.json();
      if (data) setMovimentacoes(data);
    } catch {
      console.error('Erro ao carregar movimentacoes');
    }
  };

  const carregarLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filtroAcao !== 'todos') params.append('acao', filtroAcao);
      if (filtroEntidade !== 'todos') params.append('entidade', filtroEntidade);
      if (dataInicioLog) params.append('dataInicio', dataInicioLog);
      if (dataFimLog) params.append('dataFim', dataFimLog);

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
      setCarregandoLogs(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (userRole !== 'gerente') {
      navigate('/products');
      return;
    }

    Promise.all([carregarMovimentacoes(), carregarLogs()]).finally(() => setCarregando(false));
  }, []);

  // Refetch logs quando filtros mudam
  useEffect(() => {
    if (token && userRole === 'gerente') {
      carregarLogs();
    }
  }, [filtroAcao, filtroEntidade, dataInicioLog, dataFimLog]);

  // === MOVIMENTACOES: listas e filtros ===

  const funcionariosUnicos = useMemo(() => {
    const map = {};
    movimentacoes.forEach((m) => {
      if (m.userId?._id) map[m.userId._id] = m.userId.nome;
    });
    return Object.entries(map).sort((a, b) => a[1].localeCompare(b[1]));
  }, [movimentacoes]);

  const produtosUnicos = useMemo(() => {
    const map = {};
    movimentacoes.forEach((m) => {
      if (m.produtoId?._id) {
        if (filtroCategoria === 'todos' || m.produtoId.categoria === filtroCategoria) {
          map[m.produtoId._id] = m.produtoId.nome;
        }
      }
    });
    return Object.entries(map).sort((a, b) => a[1].localeCompare(b[1]));
  }, [movimentacoes, filtroCategoria]);

  const handleCategoriaChange = (val) => {
    setFiltroCategoria(val);
    setFiltroProduto('todos');
  };

  const movFiltradas = useMemo(() => {
    return movimentacoes.filter((m) => {
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false;
      if (filtroCategoria !== 'todos' && m.produtoId?.categoria !== filtroCategoria) return false;
      if (filtroProduto !== 'todos' && m.produtoId?._id !== filtroProduto) return false;
      if (filtroFuncionario !== 'todos' && m.userId?._id !== filtroFuncionario) return false;

      if (dataInicio) {
        const inicio = new Date(dataInicio);
        inicio.setHours(0, 0, 0, 0);
        if (new Date(m.data) < inicio) return false;
      }
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        if (new Date(m.data) > fim) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      const dateA = new Date(a.data);
      const dateB = new Date(b.data);
      switch (ordenacaoMov) {
        case 'antigo': return dateA - dateB;
        case 'produto-az': return (a.produtoId?.nome || '').localeCompare(b.produtoId?.nome || '');
        case 'produto-za': return (b.produtoId?.nome || '').localeCompare(a.produtoId?.nome || '');
        case 'qtd-asc': return a.quantidade - b.quantidade;
        case 'qtd-desc': return b.quantidade - a.quantidade;
        default: return dateB - dateA;
      }
    });

    return result;
  }, [movimentacoes, filtroTipo, filtroCategoria, filtroProduto, filtroFuncionario, dataInicio, dataFim, ordenacaoMov]);

  const totalEntradas = movFiltradas
    .filter((m) => m.tipo === 'entrada')
    .reduce((acc, m) => acc + m.quantidade, 0);

  const totalSaidas = movFiltradas
    .filter((m) => m.tipo === 'saida')
    .reduce((acc, m) => acc + m.quantidade, 0);

  const temFiltroAtivo = filtroTipo !== 'todos' || filtroCategoria !== 'todos' ||
    filtroProduto !== 'todos' || filtroFuncionario !== 'todos' || dataInicio || dataFim || ordenacaoMov !== 'recente';

  const limparFiltros = () => {
    setFiltroTipo('todos');
    setFiltroCategoria('todos');
    setFiltroProduto('todos');
    setFiltroFuncionario('todos');
    setDataInicio('');
    setDataFim('');
    setOrdenacaoMov('recente');
  };

  // === LOGS: filtros ===

  // Usuários únicos extraídos dos logs
  const usuariosUnicosLogs = useMemo(() => {
    const map = {};
    logs.forEach((log) => {
      if (log.userId?._id) map[log.userId._id] = log.userId.nome;
    });
    return Object.entries(map).sort((a, b) => a[1].localeCompare(b[1]));
  }, [logs]);

  // Filtrar logs (mostra todas as ações exceto entrada/saida que ficam na aba Movimentações)
  const logsFiltrados = useMemo(() => {
    return logs.filter((log) => {
      if (log.acao === 'entrada' || log.acao === 'saida') return false;

      if (filtroAcao !== 'todos' && log.acao !== filtroAcao) return false;
      if (filtroEntidade !== 'todos' && log.entidade !== filtroEntidade) return false;
      if (filtroUsuarioLog !== 'todos' && log.userId?._id !== filtroUsuarioLog) return false;

      return true;
    });

    result.sort((a, b) => {
      const dateA = new Date(a.data);
      const dateB = new Date(b.data);
      switch (ordenacaoLog) {
        case 'antigo': return dateA - dateB;
        case 'acao-az': return (a.acao || '').localeCompare(b.acao || '');
        case 'nome-az': return (a.entidadeNome || '').localeCompare(b.entidadeNome || '');
        default: return dateB - dateA;
      }
    });

    return result;
  }, [logs, filtroAcao, filtroEntidade, filtroUsuarioLog, ordenacaoLog]);

  const temFiltroAtivoLogs = filtroAcao !== 'todos' || filtroEntidade !== 'todos' ||
    filtroUsuarioLog !== 'todos' || dataInicioLog || dataFimLog || ordenacaoLog !== 'recente';

  const limparFiltrosLogs = () => {
    setFiltroAcao('todos');
    setFiltroEntidade('todos');
    setFiltroUsuarioLog('todos');
    setDataInicioLog('');
    setDataFimLog('');
    setOrdenacaoLog('recente');
  };

  // Buscar detalhes de uma venda
  const abrirDetalheVenda = async (vendaId) => {
    setCarregandoVenda(true);
    try {
      const res = await fetch(`/api/vendas/${vendaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVendaDetalhe(data);
      }
    } catch {
      console.error('Erro ao carregar venda');
    } finally {
      setCarregandoVenda(false);
    }
  };

  // === COMUM ===

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
          <h2 className="page-titulo">Painel do Gerente</h2>
          <p className="page-subtitulo">Acompanhe movimentações e histórico do sistema</p>
        </div>
      </div>

      {/* Abas de nível superior */}
      <div className="abas">
        <button
          className={`aba ${abaGerente === 'movimentacoes' ? 'aba-ativa' : ''}`}
          onClick={() => { setAbaGerente('movimentacoes'); carregarMovimentacoes(); }}
        >
          Movimentações
        </button>
        <button
          className={`aba ${abaGerente === 'historico' ? 'aba-ativa' : ''}`}
          onClick={() => { setAbaGerente('historico'); carregarLogs(); }}
        >
          Histórico
        </button>
      </div>

      {/* === ABA: MOVIMENTACOES === */}
      {abaGerente === 'movimentacoes' && (
        <>
          <div className="resumo-bar resumo-bar-4">
            <div className="resumo-card">
              <span className="resumo-label">Movimentações</span>
              <span className="resumo-numero">{movFiltradas.length}</span>
            </div>
            <div className="resumo-card">
              <span className="resumo-label">Total Entradas</span>
              <span className="resumo-numero" style={{ color: '#1a7a32' }}>{totalEntradas}</span>
            </div>
            <div className="resumo-card">
              <span className="resumo-label">Total Saídas</span>
              <span className="resumo-numero" style={{ color: '#dc3545' }}>{totalSaidas}</span>
            </div>
            <div className="resumo-card">
              <span className="resumo-label">Saldo</span>
              <span className="resumo-numero" style={{ color: totalEntradas - totalSaidas >= 0 ? '#1a7a32' : '#dc3545' }}>
                {totalEntradas - totalSaidas >= 0 ? '+' : ''}{totalEntradas - totalSaidas}
              </span>
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
            <div className="filtros-grid filtros-grid-3">
              <div className="filtro-grupo">
                <label className="filtro-label">Funcionário</label>
                <select
                  className="filtro-select"
                  value={filtroFuncionario}
                  onChange={(e) => setFiltroFuncionario(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  {funcionariosUnicos.map(([id, nome]) => (
                    <option key={id} value={id}>{nome}</option>
                  ))}
                </select>
              </div>

              <div className="filtro-grupo">
                <label className="filtro-label">Categoria</label>
                <select
                  className="filtro-select"
                  value={filtroCategoria}
                  onChange={(e) => handleCategoriaChange(e.target.value)}
                >
                  <option value="todos">Todas</option>
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="filtro-grupo">
                <label className="filtro-label">Produto</label>
                <select
                  className="filtro-select"
                  value={filtroProduto}
                  onChange={(e) => setFiltroProduto(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  {produtosUnicos.map(([id, nome]) => (
                    <option key={id} value={id}>{nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filtros-grid filtros-grid-3" style={{ marginTop: 14 }}>
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

              <div className="filtro-grupo">
                <label className="filtro-label">Ordenar por</label>
                <select
                  className="filtro-select"
                  value={ordenacaoMov}
                  onChange={(e) => setOrdenacaoMov(e.target.value)}
                >
                  <option value="recente">Mais recente</option>
                  <option value="antigo">Mais antigo</option>
                  <option value="produto-az">Produto A-Z</option>
                  <option value="produto-za">Produto Z-A</option>
                  <option value="qtd-asc">Menor quantidade</option>
                  <option value="qtd-desc">Maior quantidade</option>
                </select>
              </div>
            </div>
          </div>

          <div className="abas">
            <button
              className={`aba ${filtroTipo === 'todos' ? 'aba-ativa' : ''}`}
              onClick={() => setFiltroTipo('todos')}
            >
              Todas
            </button>
            <button
              className={`aba ${filtroTipo === 'entrada' ? 'aba-ativa' : ''}`}
              onClick={() => setFiltroTipo('entrada')}
            >
              Entradas
            </button>
            <button
              className={`aba ${filtroTipo === 'saida' ? 'aba-ativa' : ''}`}
              onClick={() => setFiltroTipo('saida')}
            >
              Saídas
            </button>
          </div>

          {movFiltradas.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma movimentação encontrada com esses filtros.</p>
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
                    <th>Funcionário</th>
                    <th>Produto</th>
                    <th>Tipo</th>
                    <th>Quantidade</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {movFiltradas.map((mov) => (
                    <tr key={mov._id}>
                      <td>
                        <div className="tabela-user">
                          <div className="tabela-avatar">
                            {mov.userId?.nome ? mov.userId.nome.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <span className="tabela-nome">{mov.userId?.nome || 'Sistema'}</span>
                            <span className="tabela-email">{mov.userId?.email || ''}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tabela-produto">{mov.produtoId?.nome || 'Removido'}</span>
                        <span className="tabela-categoria">{mov.produtoId?.categoria || ''}</span>
                      </td>
                      <td>
                        <span className={`tabela-tipo tabela-tipo-${mov.tipo}`}>
                          {mov.tipo === 'entrada'
                            ? (mov.origem === 'cancelamento' ? '+ Entrada (Cancelamento)' : '+ Entrada')
                            : (mov.origem === 'venda' ? '- Saída (Venda)' : '- Saída (Manual)')}
                        </span>
                      </td>
                      <td className="tabela-qtd">{mov.quantidade}</td>
                      <td className="tabela-data">{formatarData(mov.data)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* === ABA: HISTORICO === */}
      {abaGerente === 'historico' && (
        <>
          <div className="filtros-container">
            <div className="filtros-titulo-row">
              <span className="filtros-titulo">Filtros</span>
              {temFiltroAtivoLogs && (
                <button className="filtros-limpar" onClick={limparFiltrosLogs}>
                  Limpar filtros
                </button>
              )}
            </div>
            <div className="filtros-grid filtros-grid-3">
              <div className="filtro-grupo">
                <label className="filtro-label">Funcionário</label>
                <select
                  className="filtro-select"
                  value={filtroUsuarioLog}
                  onChange={(e) => setFiltroUsuarioLog(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  {usuariosUnicosLogs.map(([id, nome]) => (
                    <option key={id} value={id}>{nome}</option>
                  ))}
                </select>
              </div>

              <div className="filtro-grupo">
                <label className="filtro-label">Ação</label>
                <select
                  className="filtro-select"
                  value={filtroAcao}
                  onChange={(e) => setFiltroAcao(e.target.value)}
                >
                  <option value="todos">Todas</option>
                  {Object.entries(ACOES_HISTORICO).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              <div className="filtro-grupo">
                <label className="filtro-label">Tipo</label>
                <select
                  className="filtro-select"
                  value={filtroEntidade}
                  onChange={(e) => setFiltroEntidade(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="venda">Venda</option>
                  <option value="produto">Produto</option>
                  <option value="meta">Meta</option>
                  <option value="funcionario">Funcionário</option>
                </select>
              </div>
            </div>

            <div className="filtros-grid filtros-grid-3" style={{ marginTop: 14 }}>
              <div className="filtro-grupo">
                <label className="filtro-label">Data Início</label>
                <input
                  type="date"
                  className="filtro-input"
                  value={dataInicioLog}
                  onChange={(e) => setDataInicioLog(e.target.value)}
                />
              </div>

              <div className="filtro-grupo">
                <label className="filtro-label">Data Fim</label>
                <input
                  type="date"
                  className="filtro-input"
                  value={dataFimLog}
                  onChange={(e) => setDataFimLog(e.target.value)}
                />
              </div>

              <div className="filtro-grupo">
                <label className="filtro-label">Ordenar por</label>
                <select
                  className="filtro-select"
                  value={ordenacaoLog}
                  onChange={(e) => setOrdenacaoLog(e.target.value)}
                >
                  <option value="recente">Mais recente</option>
                  <option value="antigo">Mais antigo</option>
                  <option value="acao-az">Ação A-Z</option>
                  <option value="nome-az">Nome A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {carregandoLogs ? (
            <p style={{ padding: 24, color: '#999' }}>Carregando...</p>
          ) : logsFiltrados.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum registro encontrado.</p>
              {temFiltroAtivoLogs && (
                <button className="filtros-limpar" onClick={limparFiltrosLogs} style={{ marginTop: 12 }}>
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
                    <th>Tipo</th>
                    <th>Nome</th>
                    <th>Usuário</th>
                    <th>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {logsFiltrados.map((log) => {
                    const acaoInfo = ACOES_HISTORICO[log.acao] || { label: log.acao, cor: '#6B7280' };
                    const isVendaClicavel = log.entidade === 'venda' && log.entidadeId;
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
                          <span className="tabela-categoria-inline">
                            {log.entidade === 'venda' ? 'Venda' : log.entidade === 'produto' ? 'Produto' : log.entidade === 'meta' ? 'Meta' : log.entidade === 'funcionario' ? 'Funcionário' : log.entidade}
                          </span>
                        </td>
                        <td>
                          {isVendaClicavel ? (
                            <button
                              className="link-btn"
                              onClick={() => abrirDetalheVenda(log.entidadeId)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#C8913B',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.88rem',
                                padding: 0,
                                textDecoration: 'underline'
                              }}
                            >
                              {log.entidadeNome || '—'}
                            </button>
                          ) : (
                            <span className="tabela-nome">{log.entidadeNome || '—'}</span>
                          )}
                        </td>
                        <td><span className="tabela-nome">{log.userId?.nome || 'Sistema'}</span></td>
                        <td><span className="tabela-email">{log.detalhes || '—'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal de detalhes da venda */}
      {(vendaDetalhe || carregandoVenda) && (
        <div className="modal-overlay" onClick={() => { if (!carregandoVenda) setVendaDetalhe(null); }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            {carregandoVenda ? (
              <p style={{ color: '#999', textAlign: 'center', padding: 16 }}>Carregando...</p>
            ) : vendaDetalhe && (
              <>
                <h3 className="modal-titulo">
                  Venda #{vendaDetalhe._id.slice(-6)}
                </h3>

                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span
                    className="log-acao-badge"
                    style={{
                      backgroundColor: (vendaDetalhe.status === 'finalizado' ? '#059669' : vendaDetalhe.status === 'cancelado' ? '#EF4444' : vendaDetalhe.status === 'pronto' ? '#059669' : '#F59E0B') + '18',
                      color: vendaDetalhe.status === 'finalizado' ? '#059669' : vendaDetalhe.status === 'cancelado' ? '#EF4444' : vendaDetalhe.status === 'pronto' ? '#059669' : '#F59E0B'
                    }}
                  >
                    {vendaDetalhe.status === 'em_andamento' ? 'Em andamento' :
                     vendaDetalhe.status === 'pronto' ? 'Pronto' :
                     vendaDetalhe.status === 'finalizado' ? 'Finalizado' : 'Cancelado'}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#6B7280' }}>
                    {formatarData(vendaDetalhe.criadoEm)}
                  </span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Itens</span>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {vendaDetalhe.itens.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                        <span style={{ fontSize: '0.88rem', color: '#374151' }}>
                          {item.quantidade}x {item.nome}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151' }}>
                          R$ {(item.precoUnit * item.quantidade).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '2px solid #E5E7EB' }}>
                  <span style={{ fontWeight: 700, color: '#374151' }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#C8913B' }}>
                    R$ {vendaDetalhe.total.toFixed(2)}
                  </span>
                </div>

                {vendaDetalhe.userId && (
                  <p style={{ fontSize: '0.82rem', color: '#9CA3AF', marginTop: 8 }}>
                    Operador: {vendaDetalhe.userId.nome || vendaDetalhe.userId}
                  </p>
                )}

                <div className="modal-acoes" style={{ marginTop: 16 }}>
                  <button className="modal-btn-cancelar" onClick={() => setVendaDetalhe(null)} style={{ flex: 1 }}>
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Movimentacoes;
