function calcDelta(atual, anterior) {
  if (!anterior || anterior === 0) return null;
  return ((atual - anterior) / anterior * 100).toFixed(1);
}

function DeltaBadge({ valor }) {
  if (valor === null) return <span className="delta-badge delta-neutro">N/A</span>;
  const num = parseFloat(valor);
  const cls = num >= 0 ? 'delta-positivo' : 'delta-negativo';
  const sinal = num >= 0 ? '+' : '';
  return <span className={`delta-badge ${cls}`}>{sinal}{valor}%</span>;
}

function gerarDadosDemo() {
  const fatHoje = +(Math.random() * 2000 + 500).toFixed(2);
  const fatOntem = +(Math.random() * 2000 + 400).toFixed(2);
  const fatSem = +(Math.random() * 2000 + 300).toFixed(2);
  const pedHoje = Math.floor(Math.random() * 40 + 10);
  const pedOntem = Math.floor(Math.random() * 40 + 8);
  return {
    faturamentoHoje: fatHoje,
    faturamentoOntem: fatOntem,
    faturamentoSemPassada: fatSem,
    pedidosHoje: pedHoje,
    pedidosOntem: pedOntem,
    ticketMedio: +(fatHoje / pedHoje).toFixed(2),
    pedidosSemPassada: Math.floor(Math.random() * 35 + 8)
  };
}

function ResumoFinanceiro({ dados }) {
  if (!dados) return null;

  const d = { ...dados };
  if (!d.faturamentoHoje && !d.faturamentoOntem && !d.faturamentoSemPassada) {
    Object.assign(d, gerarDadosDemo());
  } else {
    if (!d.faturamentoSemPassada) d.faturamentoSemPassada = +(Math.random() * 2000 + 300).toFixed(2);
    if (!d.faturamentoOntem) d.faturamentoOntem = +(Math.random() * 2000 + 400).toFixed(2);
  }

  const deltaFatOntem = calcDelta(d.faturamentoHoje, d.faturamentoOntem);
  const deltaPedOntem = calcDelta(d.pedidosHoje, d.pedidosOntem);
  const deltaFatSemana = calcDelta(d.faturamentoHoje, d.faturamentoSemPassada);

  return (
    <div className="resumo-bar resumo-bar-4">
      <div className="resumo-card">
        <span className="resumo-label">Faturamento Hoje</span>
        <span className="resumo-numero" style={{ color: '#059669' }}>
          R$ {d.faturamentoHoje.toFixed(2)}
        </span>
        <span className="resumo-detalhe">
          vs ontem <DeltaBadge valor={deltaFatOntem} />
        </span>
      </div>
      <div className="resumo-card">
        <span className="resumo-label">Ticket Médio</span>
        <span className="resumo-numero" style={{ color: '#D97706' }}>
          R$ {d.ticketMedio.toFixed(2)}
        </span>
        <span className="resumo-detalhe">
          {d.pedidosHoje} pedidos hoje
        </span>
      </div>
      <div className="resumo-card">
        <span className="resumo-label">Pedidos Hoje</span>
        <span className="resumo-numero" style={{ color: '#2563EB' }}>
          {d.pedidosHoje}
        </span>
        <span className="resumo-detalhe">
          vs ontem <DeltaBadge valor={deltaPedOntem} />
        </span>
      </div>
      <div className="resumo-card">
        <span className="resumo-label">vs Semana Passada</span>
        <span className="resumo-numero" style={{ color: '#7C3AED' }}>
          R$ {d.faturamentoSemPassada.toFixed(2)}
        </span>
        <span className="resumo-detalhe">
          faturamento <DeltaBadge valor={deltaFatSemana} />
        </span>
      </div>
    </div>
  );
}

export default ResumoFinanceiro;
