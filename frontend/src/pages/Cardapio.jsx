import { useState, useEffect, useMemo } from 'react';

const CORES_CATEGORIA = {
  'Graos': '#92400E',
  'Insumos': '#065F46',
  'Alimentos': '#9A3412',
  'Descartaveis': '#4338CA',
  'Outros': '#4B5563'
};

const CORES_TAG = {
  'vegano': '#059669',
  'sem lactose': '#7C3AED',
  'sem gluten': '#DC2626'
};

function Cardapio() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/cardapio')
      .then((res) => res.json())
      .then((data) => setProdutos(data))
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  const categorias = useMemo(() => {
    const cats = {};
    produtos.forEach((p) => {
      const cat = p.categoria || 'Outros';
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(p);
    });
    return Object.entries(cats);
  }, [produtos]);

  if (carregando) {
    return (
      <div className="cardapio-page">
        <p style={{ textAlign: 'center', color: '#999', padding: 40 }}>Carregando cardápio...</p>
      </div>
    );
  }

  return (
    <div className="cardapio-page">
      <header className="cardapio-header">
        <div className="cardapio-logo-icon">G</div>
        <h1 className="cardapio-logo">Grão & Byte</h1>
        <p className="cardapio-subtitle">Nosso Cardápio</p>
      </header>

      {categorias.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#999' }}>Nenhum produto disponível no momento.</p>
      ) : (
        categorias.map(([cat, items]) => (
          <section key={cat} className="cardapio-section">
            <h2 className="cardapio-section-title" style={{ borderBottomColor: CORES_CATEGORIA[cat] || '#4B5563' }}>
              {cat}
            </h2>
            <div className="cardapio-items">
              {items.map((p) => (
                <div key={p._id} className="cardapio-item">
                  <div className="cardapio-item-info">
                    <h3 className="cardapio-item-nome">{p.nome}</h3>
                    <p className="cardapio-item-desc">{p.descricao}</p>
                    {p.tags && p.tags.length > 0 && (
                      <div className="cardapio-tags">
                        {p.tags.map((tag) => (
                          <span
                            key={tag}
                            className="tag-pill"
                            style={{
                              backgroundColor: (CORES_TAG[tag.toLowerCase()] || '#6B7280') + '18',
                              color: CORES_TAG[tag.toLowerCase()] || '#6B7280'
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="cardapio-preco">
                    {p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <footer className="cardapio-footer">
        <p>Grão & Byte - Sistema de Gestão</p>
      </footer>
    </div>
  );
}

export default Cardapio;
