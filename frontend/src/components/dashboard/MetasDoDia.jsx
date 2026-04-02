import { useState } from 'react';

function MetasDoDia({ dados, isGerente, token, onMetaChanged }) {
  const [editando, setEditando] = useState(null);
  const [formValor, setFormValor] = useState('');
  const [criando, setCriando] = useState(false);
  const [novoForm, setNovoForm] = useState({ tipo: 'diaria', metrica: 'faturamento', valor: '' });

  if (!dados) return null;

  const iniciarEdicao = (meta) => {
    setEditando(meta._id);
    setFormValor(String(meta.valor));
  };

  const salvarEdicao = async (metaId) => {
    const valor = Number(formValor);
    if (!valor || valor <= 0) return;

    try {
      const meta = dados.find((m) => m._id === metaId);
      await fetch(`/api/metas/${metaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tipo: meta.tipo,
          metrica: meta.metrica,
          valor,
          inicioVigencia: meta.inicioVigencia,
          fimVigencia: meta.fimVigencia
        })
      });
      setEditando(null);
      onMetaChanged();
    } catch { /* silencioso */ }
  };

  const deletarMeta = async (metaId) => {
    try {
      await fetch(`/api/metas/${metaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      onMetaChanged();
    } catch { /* silencioso */ }
  };

  const criarMeta = async () => {
    const valor = Number(novoForm.valor);
    if (!valor || valor <= 0) return;

    const agora = new Date();
    let inicioVigencia, fimVigencia;

    if (novoForm.tipo === 'diaria') {
      inicioVigencia = new Date(agora);
      inicioVigencia.setHours(0, 0, 0, 0);
      fimVigencia = new Date(agora);
      fimVigencia.setHours(23, 59, 59, 999);
    } else {
      const dia = agora.getDay();
      inicioVigencia = new Date(agora);
      inicioVigencia.setDate(agora.getDate() - dia);
      inicioVigencia.setHours(0, 0, 0, 0);
      fimVigencia = new Date(inicioVigencia);
      fimVigencia.setDate(inicioVigencia.getDate() + 6);
      fimVigencia.setHours(23, 59, 59, 999);
    }

    try {
      await fetch('/api/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tipo: novoForm.tipo,
          metrica: novoForm.metrica,
          valor,
          inicioVigencia,
          fimVigencia
        })
      });
      setCriando(false);
      setNovoForm({ tipo: 'diaria', metrica: 'faturamento', valor: '' });
      onMetaChanged();
    } catch { /* silencioso */ }
  };

  return (
    <div className="dashboard-section">
      <div className="meta-section-header">
        <h3 className="dashboard-section-titulo">Metas</h3>
        {isGerente && !criando && (
          <button className="btn-meta-add" onClick={() => setCriando(true)} title="Nova meta">+</button>
        )}
      </div>

      {criando && (
        <div className="meta-form-criar">
          <div className="meta-form-row">
            <select value={novoForm.tipo} onChange={(e) => setNovoForm({ ...novoForm, tipo: e.target.value })}>
              <option value="diaria">Diária</option>
              <option value="semanal">Semanal</option>
            </select>
            <select value={novoForm.metrica} onChange={(e) => setNovoForm({ ...novoForm, metrica: e.target.value })}>
              <option value="faturamento">Faturamento</option>
              <option value="pedidos">Pedidos</option>
            </select>
          </div>
          <div className="meta-form-row">
            <input
              type="number"
              min="1"
              placeholder={novoForm.metrica === 'faturamento' ? 'R$ valor' : 'Qtd pedidos'}
              value={novoForm.valor}
              onChange={(e) => setNovoForm({ ...novoForm, valor: e.target.value })}
              className="meta-input"
            />
            <button className="btn-meta-salvar" onClick={criarMeta}>Criar</button>
            <button className="btn-meta-cancelar" onClick={() => setCriando(false)}>X</button>
          </div>
        </div>
      )}

      {dados.length === 0 && !criando ? (
        <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Nenhuma meta ativa.</p>
      ) : (
        <div className="metas-lista">
          {dados.map((meta) => {
            const pct = meta.valor > 0 ? Math.min((meta.progresso / meta.valor) * 100, 100) : 0;
            const pctDisplay = meta.valor > 0 ? ((meta.progresso / meta.valor) * 100).toFixed(0) : 0;
            const corClasse = pct >= 100 ? 'meta-verde' : pct >= 50 ? 'meta-ambar' : 'meta-vermelho';
            const label = meta.metrica === 'faturamento'
              ? `R$ ${meta.progresso.toFixed(2)} / R$ ${meta.valor.toFixed(2)}`
              : `${meta.progresso} / ${meta.valor} pedidos`;
            const tipoLabel = meta.tipo === 'diaria' ? 'Diária' : 'Semanal';

            return (
              <div key={meta._id} className="meta-item">
                <div className="meta-header">
                  <span className="meta-titulo">
                    {meta.metrica === 'faturamento' ? 'Faturamento' : 'Pedidos'} ({tipoLabel})
                  </span>
                  <div className="meta-header-right">
                    <span className="meta-pct">{pctDisplay}%</span>
                    {isGerente && editando !== meta._id && (
                      <>
                        <button className="btn-meta-edit" onClick={() => iniciarEdicao(meta)} title="Editar meta">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button className="btn-meta-delete" onClick={() => deletarMeta(meta._id)} title="Remover meta">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {editando === meta._id ? (
                  <div className="meta-edit-row">
                    <span className="meta-edit-label">{meta.metrica === 'faturamento' ? 'R$' : 'Qtd:'}</span>
                    <input
                      type="number"
                      min="1"
                      value={formValor}
                      onChange={(e) => setFormValor(e.target.value)}
                      className="meta-input"
                      autoFocus
                    />
                    <button className="btn-meta-salvar" onClick={() => salvarEdicao(meta._id)}>OK</button>
                    <button className="btn-meta-cancelar" onClick={() => setEditando(null)}>X</button>
                  </div>
                ) : (
                  <>
                    <div className="meta-bar-track">
                      <div className={`meta-bar-fill ${corClasse}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="meta-detalhe">{label}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MetasDoDia;
