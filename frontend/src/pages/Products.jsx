import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { exportCSV, exportPDF } from '../helpers/exportUtils';

const CATEGORIAS = ['Todos', 'Graos', 'Insumos', 'Alimentos', 'Descartaveis'];

function Products() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState('Todos');
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [tagsSelecionadas, setTagsSelecionadas] = useState([]);
  const [tagsDisponiveis, setTagsDisponiveis] = useState([]);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [ordenacaoLocal, setOrdenacaoLocal] = useState([]);
  const [ordenacaoAlterada, setOrdenacaoAlterada] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const token = localStorage.getItem('token');
  const isGerente = localStorage.getItem('userRole') === 'gerente';

  const carregarProdutos = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const data = await response.json();
      setProdutos(data);
    } catch {
      showToast('Erro ao carregar produtos', 'error');
    } finally {
      setCarregando(false);
    }
  };

  const carregarTags = async () => {
    try {
      const response = await fetch('/api/products/tags', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTagsDisponiveis(data);
      }
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    carregarProdutos();
    carregarTags();
  }, []);

  const handleMovimentacao = async (produtoId, tipo, quantidade) => {
    try {
      const response = await fetch('/api/movimentacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ produtoId, tipo, quantidade })
      });

      if (response.ok) {
        showToast('Movimentacao registrada!', 'success');
        carregarProdutos();
      } else {
        showToast('Erro ao registrar movimentacao', 'error');
      }
    } catch {
      showToast('Erro ao registrar movimentacao', 'error');
    }
  };

  const handleToggleAtivo = (produtoId) => {
    const prod = produtos.find((p) => p._id === produtoId);
    if (prod && prod.ativo !== false) {
      setToggleTarget(produtoId);
    } else {
      executarToggle(produtoId);
    }
  };

  const executarToggle = async (produtoId) => {
    setToggleTarget(null);
    try {
      const response = await fetch(`/api/products/${produtoId}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const updated = await response.json();
        showToast(updated.ativo ? 'Produto ativado!' : 'Produto desativado!', 'success');
        carregarProdutos();
      } else {
        showToast('Erro ao alterar status', 'error');
      }
    } catch {
      showToast('Erro ao alterar status', 'error');
    }
  };

  const handleTagFilter = (tag) => {
    setTagsSelecionadas((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Piores vendas (3 menores vendaMediaDiaria entre ativos com vendas)
  const pioresVendas = useMemo(() => {
    const comVendas = produtos.filter((p) => (p.vendaMediaDiaria || 0) > 0 && p.ativo !== false);
    const sorted = [...comVendas].sort((a, b) => a.vendaMediaDiaria - b.vendaMediaDiaria);
    return new Set(sorted.slice(0, 3).map((p) => p._id));
  }, [produtos]);

  // Filtros encadeados
  const produtosFiltrados = useMemo(() => {
    let result = produtos;

    // Categoria
    if (abaAtiva !== 'Todos' && abaAtiva !== 'Personalizada') {
      result = result.filter((p) => p.categoria === abaAtiva);
    }

    // Ativo/Inativo
    if (filtroAtivo === 'ativos') {
      result = result.filter((p) => p.ativo !== false);
    } else if (filtroAtivo === 'inativos') {
      result = result.filter((p) => p.ativo === false);
    }

    // Busca
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase();
      result = result.filter(
        (p) => p.nome.toLowerCase().includes(termo) || p.descricao.toLowerCase().includes(termo)
      );
    }

    // Tags
    if (tagsSelecionadas.length > 0) {
      result = result.filter(
        (p) => p.tags && p.tags.some((t) => tagsSelecionadas.includes(t))
      );
    }

    return result;
  }, [produtos, abaAtiva, filtroAtivo, termoBusca, tagsSelecionadas]);

  // Ordenacao personalizada
  const [ordemCategorias, setOrdemCategorias] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('grao-byte-cat-order')) || [];
    } catch { return []; }
  });
  const catDragRef = useRef(null);
  const catDragOverRef = useRef(null);
  const prodDragRef = useRef(null);
  const prodDragOverRef = useRef(null);

  useEffect(() => {
    if (abaAtiva === 'Personalizada') {
      setOrdenacaoLocal([...produtos]);
      setOrdenacaoAlterada(false);
    }
  }, [abaAtiva]);

  // Categorias ordenadas respeitando a ordem salva
  const categoriasOrdenadas = useMemo(() => {
    const todasCats = [...new Set(ordenacaoLocal.map((p) => p.categoria))];
    const ordenadas = [];
    ordemCategorias.forEach((cat) => {
      if (todasCats.includes(cat)) ordenadas.push(cat);
    });
    todasCats.forEach((cat) => {
      if (!ordenadas.includes(cat)) ordenadas.push(cat);
    });
    return ordenadas;
  }, [ordenacaoLocal, ordemCategorias]);

  // Drag de categorias
  const handleCatDragStart = (index) => { catDragRef.current = index; };
  const handleCatDragOver = (e, index) => {
    e.preventDefault();
    catDragOverRef.current = index;
  };
  const handleCatDrop = () => {
    const from = catDragRef.current;
    const to = catDragOverRef.current;
    if (from === null || to === null || from === to) return;
    const newOrder = [...categoriasOrdenadas];
    const [moved] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, moved);
    setOrdemCategorias(newOrder);
    localStorage.setItem('grao-byte-cat-order', JSON.stringify(newOrder));
    setOrdenacaoAlterada(true);
    catDragRef.current = null;
    catDragOverRef.current = null;
  };

  // Drag de produtos dentro de categoria
  const handleProdDragStart = (produtoId, categoria) => {
    prodDragRef.current = { id: produtoId, categoria };
  };
  const handleProdDragOver = (e, produtoId) => {
    e.preventDefault();
    prodDragOverRef.current = produtoId;
  };
  const handleProdDrop = (targetCategoria) => {
    const drag = prodDragRef.current;
    const targetId = prodDragOverRef.current;
    if (!drag || !targetId || drag.id === targetId) return;
    if (drag.categoria !== targetCategoria) return;

    const newList = [...ordenacaoLocal];
    const fromIdx = newList.findIndex((p) => p._id === drag.id);
    const toIdx = newList.findIndex((p) => p._id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const [moved] = newList.splice(fromIdx, 1);
    newList.splice(toIdx, 0, moved);
    setOrdenacaoLocal(newList);
    setOrdenacaoAlterada(true);
    prodDragRef.current = null;
    prodDragOverRef.current = null;
  };

  const salvarOrdenacao = async () => {
    const items = ordenacaoLocal.map((p, i) => ({ _id: p._id, posicao: i }));
    try {
      const response = await fetch('/api/products/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      if (response.ok) {
        localStorage.setItem('grao-byte-cat-order', JSON.stringify(categoriasOrdenadas));
        showToast('Ordem salva com sucesso!', 'success');
        setOrdenacaoAlterada(false);
        carregarProdutos();
      } else {
        showToast('Erro ao salvar ordem', 'error');
      }
    } catch {
      showToast('Erro ao salvar ordem', 'error');
    }
  };

  if (carregando) {
    return (
      <Layout>
        <p style={{ padding: 24, color: '#999' }}>Carregando...</p>
      </Layout>
    );
  }

  // Categorias para aba Personalizada (usa ordem customizada)

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="page-titulo">Produtos</h2>
          <p className="page-subtitulo">Catálogo de itens</p>
        </div>
        {isGerente && produtos.length > 0 && (
          <div className="export-btn-group">
            <button className="btn-export" onClick={() => exportCSV(produtos)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              CSV
            </button>
            <button className="btn-export" onClick={() => exportPDF(produtos)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              PDF
            </button>
          </div>
        )}
      </div>

      {/* Busca */}
      <div className="search-container">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nome ou descricao..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
        />
        {termoBusca && (
          <button className="search-clear" onClick={() => setTermoBusca('')}>
            ✕
          </button>
        )}
      </div>

      {/* Filtro ativo/inativo */}
      {isGerente && (
        <div className="filtro-ativo-bar">
          {['todos', 'ativos', 'inativos'].map((f) => (
            <button
              key={f}
              className={`filtro-ativo-btn ${filtroAtivo === f ? 'filtro-ativo-btn-selected' : ''}`}
              onClick={() => setFiltroAtivo(f)}
            >
              {f === 'todos' ? 'Todos' : f === 'ativos' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      )}

      {/* Tags filter */}
      {tagsDisponiveis.length > 0 && (
        <div className="tags-filter">
          {tagsDisponiveis.map((tag) => (
            <button
              key={tag}
              className={`tag-filter-btn ${tagsSelecionadas.includes(tag) ? 'tag-filter-btn-selected' : ''}`}
              onClick={() => handleTagFilter(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Abas de categoria */}
      {produtos.length > 0 && (
        <div className="abas">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              className={`aba ${abaAtiva === cat ? 'aba-ativa' : ''}`}
              onClick={() => setAbaAtiva(cat)}
            >
              {cat}
            </button>
          ))}
          {isGerente && (
            <button
              className={`aba ${abaAtiva === 'Personalizada' ? 'aba-ativa' : ''}`}
              onClick={() => setAbaAtiva('Personalizada')}
            >
              Personalizada
            </button>
          )}
        </div>
      )}

      {/* Contador de resultados */}
      {(termoBusca || tagsSelecionadas.length > 0 || filtroAtivo !== 'todos') && (
        <p className="search-count">{produtosFiltrados.length} produto(s) encontrado(s)</p>
      )}

      {/* Conteudo */}
      {abaAtiva === 'Personalizada' && isGerente ? (
        <div className="ordenacao-container">
          {ordenacaoAlterada && (
            <div className="ordenacao-salvar-bar">
              <button className="btn-primario" onClick={salvarOrdenacao}>
                Salvar Ordem
              </button>
              <button className="btn-cancelar" onClick={() => { setOrdenacaoLocal([...produtos]); setOrdenacaoAlterada(false); }}>
                Cancelar
              </button>
            </div>
          )}

          {/* Barra de reordenação de categorias */}
          <div className="ordenacao-categorias-bar">
            <span className="ordenacao-categorias-label">Ordem das categorias:</span>
            <div className="ordenacao-categorias-chips">
              {categoriasOrdenadas.map((cat, idx) => (
                <div
                  key={cat}
                  className="ordenacao-categoria-chip"
                  draggable
                  onDragStart={() => handleCatDragStart(idx)}
                  onDragOver={(e) => handleCatDragOver(e, idx)}
                  onDrop={handleCatDrop}
                  onDragEnd={() => { catDragRef.current = null; catDragOverRef.current = null; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
                  </svg>
                  {cat}
                </div>
              ))}
            </div>
          </div>

          {categoriasOrdenadas.map((cat) => (
            <div key={cat} className="ordenacao-categoria">
              <h3 className="ordenacao-categoria-titulo">{cat}</h3>
              <div className="products-grid">
                {ordenacaoLocal
                  .filter((p) => p.categoria === cat)
                  .map((produto) => (
                    <div
                      key={produto._id}
                      className="product-drag-wrapper"
                      draggable
                      onDragStart={() => handleProdDragStart(produto._id, cat)}
                      onDragOver={(e) => handleProdDragOver(e, produto._id)}
                      onDrop={() => handleProdDrop(cat)}
                      onDragEnd={() => { prodDragRef.current = null; prodDragOverRef.current = null; }}
                    >
                      <ProductCard
                        produto={produto}
                        onMovimentacao={handleMovimentacao}
                        isGerente={isGerente}
                        showOrdering
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : produtos.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum produto cadastrado ainda.</p>
          <p>Clique em "Novo Produto" para começar!</p>
        </div>
      ) : (
        <div className="products-grid">
          {produtosFiltrados.map((produto) => (
            <ProductCard
              key={produto._id}
              produto={produto}
              onMovimentacao={handleMovimentacao}
              isGerente={isGerente}
              onToggleAtivo={handleToggleAtivo}
              isPiorVenda={pioresVendas.has(produto._id)}
            />
          ))}
          {produtosFiltrados.length === 0 && (
            <div className="empty-state">
              <p>Nenhum produto encontrado com esses filtros.</p>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!toggleTarget}
        title="Desativar Produto"
        message="Tem certeza que deseja desativar este produto? Ele não aparecerá no cardápio público."
        confirmLabel="Desativar"
        onConfirm={() => executarToggle(toggleTarget)}
        onCancel={() => setToggleTarget(null)}
        danger
      />
    </Layout>
  );
}

export default Products;
