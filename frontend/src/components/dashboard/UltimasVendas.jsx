function formatHora(data) {
  const d = new Date(data);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatData(data) {
  const d = new Date(data);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataD = new Date(d);
  dataD.setHours(0, 0, 0, 0);

  if (dataD.getTime() === hoje.getTime()) return 'Hoje';

  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (dataD.getTime() === ontem.getTime()) return 'Ontem';

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function descricaoVenda(venda) {
  if (venda.itens.length === 1) {
    return `${venda.itens[0].quantidade}x ${venda.itens[0].nome}`;
  }
  return `${venda.itens.length} itens`;
}

function UltimasVendas({ dados }) {
  if (!dados) return null;

  return (
    <div className="dashboard-section">
      <h3 className="dashboard-section-titulo">Últimas Vendas</h3>
      {dados.length === 0 ? (
        <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Nenhuma venda registrada.</p>
      ) : (
        <div className="feed-container">
          {dados.map((venda) => (
            <div key={venda._id} className="feed-item">
              <div className="feed-tempo">
                <span className="feed-data">{formatData(venda.criadoEm)}</span>
                <span className="feed-hora">{formatHora(venda.criadoEm)}</span>
              </div>
              <div className="feed-descricao">
                <span className="feed-desc-texto">{descricaoVenda(venda)}</span>
                <span className="feed-operador">{venda.userId?.nome || '—'}</span>
              </div>
              <span className="feed-valor">R$ {venda.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UltimasVendas;
