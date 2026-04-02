import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

const CATEGORIAS = ['Todos', 'Graos', 'Insumos', 'Alimentos', 'Descartaveis'];

function Vendas() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState('');
  const [vendas, setVendas] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('nova-venda');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [tagsSelecionadas, setTagsSelecionadas] = useState([]);
  const [tagsDisponiveis, setTagsDisponiveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const token = localStorage.getItem('token');

  const carregarProdutos = async () => {
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      const data = await res.json();
      setProdutos(data.filter(p => p.ativo !== false));
    } catch {
      showToast('Erro ao carregar produtos', 'error');
    }
  };

  const carregarTags = async () => {
    try {
      const res = await fetch('/api/products/tags', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTagsDisponiveis(data);
      }
    } catch {}
  };

  const carregarVendas = async () => {
    try {
      const res = await fetch('/api/vendas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVendas(data);
      }
    } catch {
      showToast('Erro ao carregar vendas', 'error');
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    Promise.all([carregarProdutos(), carregarVendas(), carregarTags()]).finally(() => setCarregando(false));
  }, []);

  // Filtros encadeados: estoque > 0, categoria, busca, tags
  const produtosFiltrados = useMemo(() => {
    let result = produtos.filter(p => (p.estoque || 0) > 0);

    if (categoriaAtiva !== 'Todos') {
      result = result.filter(p => p.categoria === categoriaAtiva);
    }

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      result = result.filter(
        p => p.nome.toLowerCase().includes(termo) || p.descricao.toLowerCase().includes(termo)
      );
    }

    if (tagsSelecionadas.length > 0) {
      result = result.filter(
        p => p.tags && p.tags.some(t => tagsSelecionadas.includes(t))
      );
    }

    return result;
  }, [produtos, categoriaAtiva, busca, tagsSelecionadas]);

  const handleTagFilter = (tag) => {
    setTagsSelecionadas(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Carrinho - chamado pelo ProductCard via onMovimentacao(produtoId, tipo, quantidade)
  const adicionarAoCarrinho = (produtoId, tipo, quantidade) => {
    const produto = produtos.find(p => p._id === produtoId);
    if (!produto) return;
    const qtd = Number(quantidade) || 1;

    setCarrinho(prev => {
      const existe = prev.find(item => item.produtoId === produtoId);
      if (existe) {
        return prev.map(item =>
          item.produtoId === produtoId
            ? { ...item, quantidade: item.quantidade + qtd }
            : item
        );
      }
      return [...prev, {
        produtoId: produtoId,
        nome: produto.nome,
        precoUnit: produto.preco,
        quantidade: qtd,
        estoque: produto.estoque || 0
      }];
    });
    showToast(`${qtd}x ${produto.nome} adicionado ao carrinho`, 'success');
  };

  const alterarQuantidade = (produtoId, novaQtd) => {
    if (novaQtd < 1) {
      setCarrinho(prev => prev.filter(item => item.produtoId !== produtoId));
      return;
    }
    setCarrinho(prev =>
      prev.map(item =>
        item.produtoId === produtoId ? { ...item, quantidade: novaQtd } : item
      )
    );
  };

  const removerDoCarrinho = (produtoId) => {
    setCarrinho(prev => prev.filter(item => item.produtoId !== produtoId));
  };

  const totalCarrinho = useMemo(() => {
    return carrinho.reduce((acc, item) => acc + item.precoUnit * item.quantidade, 0);
  }, [carrinho]);

  const totalItensCarrinho = useMemo(() => {
    return carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  }, [carrinho]);

  // Criar venda
  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      showToast('Adicione pelo menos um item', 'warning');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          itens: carrinho.map(item => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade
          }))
        })
      });

      if (res.ok) {
        showToast('Venda registrada com sucesso!', 'success');
        setCarrinho([]);
        await carregarVendas();
        await carregarProdutos();
        setAbaAtiva('pedidos');
      } else {
        const data = await res.json();
        showToast(data.erro || 'Erro ao registrar venda', 'error');
      }
    } catch {
      showToast('Erro de conexao', 'error');
    } finally {
      setEnviando(false);
    }
  };

  // Atualizar status da venda
  const atualizarStatus = async (vendaId, novoStatus) => {
    try {
      const res = await fetch(`/api/vendas/${vendaId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: novoStatus })
      });

      if (res.ok) {
        const label = novoStatus === 'pronto' ? 'Pedido pronto!' :
                      novoStatus === 'finalizado' ? 'Pedido finalizado!' :
                      'Pedido cancelado!';
        showToast(label, novoStatus === 'cancelado' ? 'warning' : 'success');
        await carregarVendas();
        if (novoStatus === 'cancelado') await carregarProdutos();
        if (novoStatus === 'finalizado') setAbaAtiva('historico');
      } else {
        const data = await res.json();
        showToast(data.erro || 'Erro ao atualizar status', 'error');
      }
    } catch {
      showToast('Erro de conexao', 'error');
    }
  };

  const handleCancelar = (vendaId) => {
    setCancelTarget(vendaId);
  };

  const confirmarCancelamento = () => {
    if (cancelTarget) {
      atualizarStatus(cancelTarget, 'cancelado');
      setCancelTarget(null);
    }
  };

  const formatarData = (dataStr) => {
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const statusLabel = {
    em_andamento: 'Em andamento',
    pronto: 'Pronto',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado'
  };

  const statusColor = {
    em_andamento: '#F59E0B',
    pronto: '#059669',
    finalizado: '#6B7280',
    cancelado: '#EF4444'
  };

  const vendasAtivas = useMemo(() =>
    vendas.filter(v => v.status === 'em_andamento' || v.status === 'pronto'),
    [vendas]
  );

  const vendasFinalizadas = useMemo(() =>
    vendas.filter(v => v.status === 'finalizado' || v.status === 'cancelado'),
    [vendas]
  );

  const temFiltroAtivo = categoriaAtiva !== 'Todos' || busca.trim() || tagsSelecionadas.length > 0;

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
          <h2 className="page-titulo">Vendas</h2>
          <p className="page-subtitulo">Registre vendas e acompanhe pedidos</p>
        </div>
      </div>

      {/* Abas */}
      <div className="abas">
        <button
          className={`aba ${abaAtiva === 'nova-venda' ? 'aba-ativa' : ''}`}
          onClick={() => setAbaAtiva('nova-venda')}
        >
          Nova Venda
          {carrinho.length > 0 && (
            <span className="pdv-badge">{totalItensCarrinho}</span>
          )}
        </button>
        <button
          className={`aba ${abaAtiva === 'pedidos' ? 'aba-ativa' : ''}`}
          onClick={() => setAbaAtiva('pedidos')}
        >
          Pedidos Ativos {vendasAtivas.length > 0 && (
            <span className="pdv-badge">{vendasAtivas.length}</span>
          )}
        </button>
        <button
          className={`aba ${abaAtiva === 'historico' ? 'aba-ativa' : ''}`}
          onClick={() => setAbaAtiva('historico')}
        >
          Historico
        </button>
      </div>

      {/* === ABA: NOVA VENDA === */}
      {abaAtiva === 'nova-venda' && (
        <div className="pdv-container">
          <div className="pdv-produtos">
            {/* Busca */}
            <div className="search-container">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar produto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              {busca && (
                <button className="search-clear" onClick={() => setBusca('')}>
                  ✕
                </button>
              )}
            </div>

            {/* Tags filter */}
            {tagsDisponiveis.length > 0 && (
              <div className="tags-filter">
                {tagsDisponiveis.map(tag => (
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
            <div className="abas">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat}
                  className={`aba ${categoriaAtiva === cat ? 'aba-ativa' : ''}`}
                  onClick={() => setCategoriaAtiva(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Contador */}
            {temFiltroAtivo && (
              <p className="search-count">{produtosFiltrados.length} produto(s) com estoque</p>
            )}

            {/* Grid de produtos */}
            <div className="products-grid">
              {produtosFiltrados.map(produto => (
                <ProductCard
                  key={produto._id}
                  produto={produto}
                  onMovimentacao={adicionarAoCarrinho}
                  isGerente={false}
                  modoVenda
                />
              ))}
              {produtosFiltrados.length === 0 && (
                <div className="empty-state">
                  <p>Nenhum produto com estoque encontrado.</p>
                  {temFiltroAtivo && (
                    <button
                      className="filtros-limpar"
                      onClick={() => { setCategoriaAtiva('Todos'); setBusca(''); setTagsSelecionadas([]); }}
                      style={{ marginTop: 12 }}
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Carrinho */}
          <div className="pdv-carrinho">
            <h3 className="pdv-carrinho-titulo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Carrinho
              {carrinho.length > 0 && (
                <span className="pdv-carrinho-count">{carrinho.length}</span>
              )}
            </h3>

            {carrinho.length === 0 ? (
              <div className="pdv-carrinho-vazio">
                <p>Carrinho vazio</p>
                <p className="pdv-carrinho-dica">Use o botao "Adicionar a Venda" nos produtos</p>
              </div>
            ) : (
              <>
                <div className="pdv-carrinho-itens">
                  {carrinho.map(item => (
                    <div key={item.produtoId} className="pdv-carrinho-item">
                      <div className="pdv-carrinho-item-info">
                        <span className="pdv-carrinho-item-nome">{item.nome}</span>
                        <span className="pdv-carrinho-item-preco">
                          R$ {item.precoUnit.toFixed(2)} un.
                        </span>
                      </div>
                      <div className="pdv-carrinho-item-controles">
                        <button
                          className="pdv-qty-btn"
                          onClick={() => alterarQuantidade(item.produtoId, item.quantidade - 1)}
                        >
                          -
                        </button>
                        <span className="pdv-qty-valor">{item.quantidade}</span>
                        <button
                          className="pdv-qty-btn"
                          onClick={() => alterarQuantidade(item.produtoId, item.quantidade + 1)}
                          disabled={item.quantidade >= item.estoque}
                          title={item.quantidade >= item.estoque ? 'Estoque máximo atingido' : ''}
                        >
                          +
                        </button>
                        <button
                          className="pdv-remove-btn"
                          onClick={() => removerDoCarrinho(item.produtoId)}
                          title="Remover"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                      <span className="pdv-carrinho-item-subtotal">
                        R$ {(item.precoUnit * item.quantidade).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pdv-carrinho-footer">
                  <div className="pdv-carrinho-total">
                    <span>Total</span>
                    <span className="pdv-carrinho-total-valor">
                      R$ {totalCarrinho.toFixed(2)}
                    </span>
                  </div>
                  <button
                    className="btn-primario pdv-btn-finalizar"
                    onClick={finalizarVenda}
                    disabled={enviando}
                  >
                    {enviando ? 'Registrando...' : 'Registrar Venda'}
                  </button>
                  <button
                    className="btn-cancelar"
                    onClick={() => setCarrinho([])}
                    style={{ marginTop: 8 }}
                  >
                    Limpar Carrinho
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* === ABA: PEDIDOS ATIVOS === */}
      {abaAtiva === 'pedidos' && (
        <div className="pdv-pedidos">
          {vendasAtivas.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum pedido ativo no momento.</p>
            </div>
          ) : (
            <div className="pdv-pedidos-grid">
              {vendasAtivas.map(venda => (
                <div key={venda._id} className="pdv-pedido-card" style={{ borderTopColor: statusColor[venda.status] }}>
                  <div className="pdv-pedido-header">
                    <span className="pdv-pedido-id">#{venda._id.slice(-6)}</span>
                    <span
                      className="pdv-pedido-status"
                      style={{ background: statusColor[venda.status] + '18', color: statusColor[venda.status] }}
                    >
                      {statusLabel[venda.status]}
                    </span>
                  </div>

                  <div className="pdv-pedido-itens">
                    {venda.itens.map((item, i) => (
                      <div key={i} className="pdv-pedido-item-linha">
                        <span>{item.quantidade}x {item.nome}</span>
                        <span className="pdv-pedido-item-preco">R$ {(item.precoUnit * item.quantidade).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pdv-pedido-footer">
                    <div className="pdv-pedido-total">
                      <span>Total:</span>
                      <span className="pdv-pedido-total-valor">R$ {venda.total.toFixed(2)}</span>
                    </div>
                    <span className="pdv-pedido-data">{formatarData(venda.criadoEm)}</span>
                    {venda.userId && (
                      <span className="pdv-pedido-operador">{venda.userId.nome}</span>
                    )}
                  </div>

                  <div className="pdv-pedido-acoes">
                    {venda.status === 'em_andamento' && (
                      <>
                        <button
                          className="btn-entrada"
                          style={{ flex: 1 }}
                          onClick={() => atualizarStatus(venda._id, 'pronto')}
                        >
                          Marcar Pronto
                        </button>
                        <button
                          className="btn-saida"
                          style={{ flex: 'none', padding: '6px 12px' }}
                          onClick={() => handleCancelar(venda._id)}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {venda.status === 'pronto' && (
                      <>
                        <button
                          className="btn-primario"
                          style={{ flex: 1, width: 'auto' }}
                          onClick={() => atualizarStatus(venda._id, 'finalizado')}
                        >
                          Finalizar
                        </button>
                        <button
                          className="btn-saida"
                          style={{ flex: 'none', padding: '6px 12px' }}
                          onClick={() => handleCancelar(venda._id)}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === ABA: HISTORICO === */}
      {abaAtiva === 'historico' && (
        <div>
          {vendasFinalizadas.length === 0 ? (
            <div className="empty-state">
              <p>Nenhuma venda finalizada ainda.</p>
            </div>
          ) : (
            <div className="tabela-container">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Itens</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Operador</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {vendasFinalizadas.map(venda => (
                    <tr key={venda._id}>
                      <td className="tabela-nome">#{venda._id.slice(-6)}</td>
                      <td>
                        {venda.itens.map((item, i) => (
                          <span key={i} className="pdv-hist-item">
                            {item.quantidade}x {item.nome}{i < venda.itens.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </td>
                      <td className="tabela-nome" style={{ fontWeight: 700 }}>
                        R$ {venda.total.toFixed(2)}
                      </td>
                      <td>
                        <span
                          className="pdv-pedido-status"
                          style={{ background: statusColor[venda.status] + '18', color: statusColor[venda.status] }}
                        >
                          {statusLabel[venda.status]}
                        </span>
                      </td>
                      <td className="tabela-nome">{venda.userId?.nome || 'Sistema'}</td>
                      <td className="tabela-data">{formatarData(venda.criadoEm)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!cancelTarget}
        title="Cancelar Pedido"
        message="Tem certeza que deseja cancelar este pedido? O estoque dos itens sera restaurado."
        confirmLabel="Cancelar Pedido"
        onConfirm={confirmarCancelamento}
        onCancel={() => setCancelTarget(null)}
        danger
      />
    </Layout>
  );
}

export default Vendas;
