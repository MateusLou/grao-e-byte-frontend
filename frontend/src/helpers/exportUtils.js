function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function sanitizeCSVField(value) {
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(value)) {
    return "'" + value;
  }
  return value;
}

export function exportCSV(produtos) {
  const ativos = produtos.filter((p) => p.ativo !== false && (p.estoque ?? 0) > 0);

  // Agrupar por categoria
  const porCategoria = {};
  ativos.forEach((p) => {
    const cat = p.categoria || 'Outros';
    if (!porCategoria[cat]) porCategoria[cat] = [];
    porCategoria[cat].push(p);
  });

  // Gerar CSV
  let csv = '\ufeff'; // BOM para UTF-8 no Excel
  csv += 'Categoria,Nome,Descricao,Preco (R$),Tags\n';

  Object.entries(porCategoria).sort().forEach(([cat, items]) => {
    items.sort((a, b) => a.nome.localeCompare(b.nome)).forEach((p) => {
      const descricao = sanitizeCSVField(p.descricao).replace(/"/g, '""');
      const nome = sanitizeCSVField(p.nome).replace(/"/g, '""');
      const tags = sanitizeCSVField((p.tags || []).join('; ')).replace(/"/g, '""');
      const preco = p.preco.toFixed(2).replace('.', ',');
      csv += `"${sanitizeCSVField(cat)}","${nome}","${descricao}","${preco}","${tags}"\n`;
    });
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cardapio-grao-byte-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportPDF(produtos) {
  const ativos = produtos.filter((p) => p.ativo !== false && (p.estoque ?? 0) > 0);

  // Agrupar por categoria
  const porCategoria = {};
  ativos.forEach((p) => {
    const cat = p.categoria || 'Outros';
    if (!porCategoria[cat]) porCategoria[cat] = [];
    porCategoria[cat].push(p);
  });

  const categoriaColors = {
    'Graos': '#92400E',
    'Insumos': '#065F46',
    'Alimentos': '#9A3412',
    'Descartaveis': '#4338CA',
    'Outros': '#4B5563'
  };

  let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Cardápio - Grão & Byte</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; color: #111827; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #E5E7EB; }
    .header h1 { font-size: 24px; color: #111827; margin-bottom: 4px; }
    .header p { font-size: 13px; color: #6B7280; }
    .categoria { margin-bottom: 24px; }
    .categoria h2 { font-size: 16px; font-weight: 700; padding: 8px 0; margin-bottom: 12px; border-bottom: 3px solid; }
    .item { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
    .item-info { flex: 1; }
    .item-nome { font-size: 14px; font-weight: 600; }
    .item-desc { font-size: 12px; color: #6B7280; margin-top: 2px; }
    .item-tags { margin-top: 4px; }
    .tag { display: inline-block; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 8px; background: #F3F4F6; color: #6B7280; margin-right: 4px; }
    .preco { font-size: 14px; font-weight: 800; color: #D97706; white-space: nowrap; margin-left: 16px; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Grão & Byte</h1>
    <p>Cardápio - ${new Date().toLocaleDateString('pt-BR')}</p>
  </div>`;

  Object.entries(porCategoria).sort().forEach(([cat, items]) => {
    const color = categoriaColors[cat] || '#4B5563';
    html += `\n  <div class="categoria">
    <h2 style="border-bottom-color: ${color}; color: ${color}">${escapeHtml(cat)}</h2>`;

    items.sort((a, b) => a.nome.localeCompare(b.nome)).forEach((p) => {
      const preco = p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const tags = (p.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('');
      html += `
    <div class="item">
      <div class="item-info">
        <div class="item-nome">${escapeHtml(p.nome)}</div>
        <div class="item-desc">${escapeHtml(p.descricao)}</div>
        ${tags ? `<div class="item-tags">${tags}</div>` : ''}
      </div>
      <span class="preco">${preco}</span>
    </div>`;
    });

    html += `\n  </div>`;
  });

  html += `
  <div class="footer">
    <p>Grão & Byte - Sistema de Gestão de Estoque</p>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}
