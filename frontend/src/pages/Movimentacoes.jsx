import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

const CATEGORIAS = ['Graos', 'Insumos', 'Alimentos', 'Descartaveis'];

function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroProduto, setFiltroProduto] = useState('todos');
  const [filtroFuncionario, setFiltroFuncionario] = useState('todos');
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

    fetch('/api/movimentacoes', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return [];
        }
        return res.json();
      })
      .then((data) => {
        if (data) setMovimentacoes(data);
      })
      .catch(() => console.error('Erro ao carregar movimentacoes'))
      .finally(() => setCarregando(false));
  }, []);

  // Listas únicas para selects
  const funcionariosUnicos = useMemo(() => {
    const map = {};
    movimentacoes.forEach((m) => {
      if (m.userId?._id) map[m.userId._id] = m.userId.nome;
    });
    return Object.entries(map).sort((a, b) => a[1].localeCompare(b[1]));
  }, [movimentacoes]);

  // Produtos filtrados pela categoria selecionada
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

  // Reset produto quando trocar categoria
  const handleCategoriaChange = (val) => {
    setFiltroCategoria(val);
    setFiltroProduto('todos');
  };

  // Aplicar todos os filtros
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
  }, [movimentacoes, filtroTipo, filtroCategoria, filtroProduto, filtroFuncionario, dataInicio, dataFim]);

  const totalEntradas = movFiltradas
    .filter((m) => m.tipo === 'entrada')
    .reduce((acc, m) => acc + m.quantidade, 0);

  const totalSaidas = movFiltradas
    .filter((m) => m.tipo === 'saida')
    .reduce((acc, m) => acc + m.quantidade, 0);

  const temFiltroAtivo = filtroTipo !== 'todos' || filtroCategoria !== 'todos' ||
    filtroProduto !== 'todos' || filtroFuncionario !== 'todos' || dataInicio || dataFim;

  const limparFiltros = () => {
    setFiltroTipo('todos');
    setFiltroCategoria('todos');
    setFiltroProduto('todos');
    setFiltroFuncionario('todos');
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
          <h2 className="page-titulo">Painel do Gerente</h2>
          <p className="page-subtitulo">Acompanhe todas as movimentações da equipe</p>
        </div>
      </div>

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

        <div className="filtros-grid filtros-grid-2" style={{ marginTop: 14 }}>
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
                      {mov.tipo === 'entrada' ? '+ Entrada' : '- Saída'}
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
    </Layout>
  );
}

export default Movimentacoes;
