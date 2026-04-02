function GraficoPorHora({ dados }) {
  if (!dados) return null;

  // Preencher todas as horas de 6 a 22
  const horasMap = {};
  dados.forEach(d => { horasMap[d._id] = d; });

  const horas = [];
  for (let h = 6; h <= 22; h++) {
    horas.push({
      hora: h,
      pedidos: horasMap[h]?.pedidos || 0,
      faturamento: horasMap[h]?.faturamento || 0
    });
  }

  const maxPedidos = Math.max(...horas.map(h => h.pedidos), 1);

  return (
    <div className="dashboard-section">
      <h3 className="dashboard-section-titulo">Movimento por Hora</h3>
      {horas.every(h => h.pedidos === 0) ? (
        <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Sem movimento hoje.</p>
      ) : (
        <div className="hourly-chart-wrapper">
          <div className="hourly-chart">
            {horas.map((h) => (
              <div key={h.hora} className="hourly-col">
                {h.pedidos > 0 && (
                  <span className="hourly-bar-count">{h.pedidos}</span>
                )}
                <div
                  className="hourly-bar"
                  style={{ height: `${(h.pedidos / maxPedidos) * 100}%` }}
                  title={`${h.hora}h: ${h.pedidos} pedidos - R$${h.faturamento.toFixed(2)}`}
                />
                <span className="hourly-bar-label">{h.hora}h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GraficoPorHora;
