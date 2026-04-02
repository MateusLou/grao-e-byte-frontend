import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CORES_CATEGORIA = {
  'Graos': '#92400E',
  'Insumos': '#065F46',
  'Alimentos': '#9A3412',
  'Descartaveis': '#4338CA',
  'Outros': '#4B5563'
};

const COR_TAG = '#2563EB';

function ProductCard({ produto, onMovimentacao, isGerente, onToggleAtivo, isPiorVenda, showOrdering, onMoveUp, onMoveDown }) {
  const navigate = useNavigate();
  const [movTipo, setMovTipo] = useState(null);
  const [quantidade, setQuantidade] = useState('');

  const precoFormatado = produto.preco.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const handleConfirmar = () => {
    const qtd = Number(quantidade);
    if (qtd > 0) {
      onMovimentacao(produto._id, movTipo, qtd);
      setMovTipo(null);
      setQuantidade('');
    }
  };

  const handleCancelar = () => {
    setMovTipo(null);
    setQuantidade('');
  };

  const estoque = produto.estoque || 0;
  const vendaMedia = produto.vendaMediaDiaria || 0;
  const estoqueCritico = vendaMedia > 0 && estoque <= vendaMedia;
  const estoqueBaixo = vendaMedia > 0 && estoque <= vendaMedia * 2 && !estoqueCritico;
  const corCategoria = CORES_CATEGORIA[produto.categoria] || CORES_CATEGORIA.Outros;
  const isInativo = produto.ativo === false;

  return (
    <div className={`product-card ${isInativo ? 'product-card-inativo' : ''}`}>
      <div className="product-card-faixa" style={{ backgroundColor: corCategoria }} />

      {isInativo && <span className="product-badge-inativo">INATIVO</span>}

      <div className="product-card-corpo">
        <div className="product-card-info">
          <div className="product-card-top-row">
            <span className="product-categoria" style={{ backgroundColor: corCategoria + '18', color: corCategoria }}>
              {produto.categoria}
            </span>
            {isGerente && onToggleAtivo && (
              <button
                className={`toggle-ativo-btn ${isInativo ? 'toggle-inativo' : 'toggle-ativo'}`}
                onClick={() => onToggleAtivo(produto._id)}
                title={isInativo ? 'Ativar produto' : 'Desativar produto'}
              >
                {isInativo ? 'Inativo' : 'Ativo'}
              </button>
            )}
          </div>

          <h3 className="product-nome">{produto.nome}</h3>
          <p className="product-descricao">{produto.descricao}</p>

          {produto.tags && produto.tags.length > 0 && (
            <div className="tags-display">
              {produto.tags.map((tag) => (
                <span
                  key={tag}
                  className="tag-pill"
                  style={{
                    backgroundColor: COR_TAG + '18',
                    color: COR_TAG
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="product-preco">{precoFormatado}</p>

          {isPiorVenda && (
            <span className="badge-pior-venda">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
              Baixa venda
            </span>
          )}

          <div className="estoque-section">
            <div className="estoque-display">
              <span className={`estoque-numero ${estoqueCritico ? 'estoque-critico' : estoqueBaixo ? 'estoque-baixo' : ''}`}>
                {estoque}
              </span>
              <span className="estoque-unidade">em estoque</span>
              {estoqueCritico && (
                <span className="estoque-alerta-icon" title={`Estoque crítico! Média diária: ${vendaMedia}`}>
                  ⚠
                </span>
              )}
              {estoqueBaixo && (
                <span className="estoque-aviso-icon" title={`Estoque baixo. Média diária: ${vendaMedia}`}>
                  !
                </span>
              )}
            </div>

            {!showOrdering && (
              <>
                {movTipo === null ? (
                  <div className="estoque-botoes">
                    <button className="btn-entrada" onClick={() => setMovTipo('entrada')}>
                      + Entrada
                    </button>
                    <button className="btn-saida" onClick={() => setMovTipo('saida')}>
                      - Saída
                    </button>
                  </div>
                ) : (
                  <div className="mov-input-grupo">
                    <span className="mov-input-label">
                      {movTipo === 'entrada' ? '+ Entrada' : '- Saída'}
                    </span>
                    <div className="mov-input-row">
                      <input
                        type="number"
                        min="1"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="Qtd"
                        className="mov-input"
                        autoFocus
                      />
                      <button className="btn-mov-confirmar" onClick={handleConfirmar}>
                        OK
                      </button>
                      <button className="btn-mov-cancelar" onClick={handleCancelar}>
                        X
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {showOrdering ? (
          <div className="ordering-controls">
            <div className="drag-handle" title="Arraste para reordenar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
              </svg>
            </div>
          </div>
        ) : (
          isGerente && (
            <div className="product-card-acoes">
              <button
                className="btn-editar"
                onClick={() => navigate(`/products/editar/${produto._id}`)}
              >
                Editar
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default ProductCard;
