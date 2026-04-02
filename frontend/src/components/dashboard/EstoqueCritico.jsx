import { useNavigate } from 'react-router-dom';

function EstoqueCritico({ dados }) {
  const navigate = useNavigate();

  if (!dados) return null;

  return (
    <div className="dashboard-section">
      <h3 className="dashboard-section-titulo">
        Estoque Crítico
        {dados.length > 0 && (
          <span className="badge-alerta">{dados.length}</span>
        )}
      </h3>
      {dados.length === 0 ? (
        <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Nenhum item em nível crítico.</p>
      ) : (
        <>
          <div className="estoque-critico-lista">
            {dados.slice(0, 5).map((item) => (
              <div key={item._id} className="estoque-critico-item">
                <div className="estoque-critico-info">
                  <span className="estoque-critico-nome">{item.nome}</span>
                  <span className="estoque-critico-cat">{item.categoria}</span>
                </div>
                <span className="estoque-critico-badge">
                  {item.estoque} un
                </span>
              </div>
            ))}
          </div>
          {dados.length > 5 && (
            <button
              className="dashboard-link-btn"
              style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/alertas')}
            >
              Ver todos ({dados.length})
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default EstoqueCritico;
