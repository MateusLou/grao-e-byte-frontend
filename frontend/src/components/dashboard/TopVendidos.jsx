function TopVendidos({ dados }) {
  if (!dados) return null;

  const maxQty = dados.length > 0 ? dados[0].quantidade : 1;

  return (
    <div className="dashboard-section">
      <h3 className="dashboard-section-titulo">Mais Vendidos Hoje</h3>
      {dados.length === 0 ? (
        <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Nenhuma venda registrada hoje.</p>
      ) : (
        <div className="chart-bar-container">
          {dados.map((item) => (
            <div key={item._id} className="chart-bar-row">
              <span className="chart-bar-label">{item.nome}</span>
              <div className="chart-bar-track">
                <div
                  className="chart-bar"
                  style={{
                    width: `${(item.quantidade / maxQty) * 100}%`,
                    backgroundColor: '#D97706'
                  }}
                />
              </div>
              <span className="chart-bar-count">
                {item.quantidade}x
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TopVendidos;
