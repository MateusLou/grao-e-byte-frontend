import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

function AlertasEstoque() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (userRole !== 'gerente') {
      navigate('/products');
      return;
    }

    fetch('/api/products', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return [];
        }
        return res.json();
      })
      .then((data) => {
        if (data) setProdutos(data);
      })
      .catch(() => console.error('Erro ao carregar produtos'))
      .finally(() => setCarregando(false));
  }, []);

  const produtosCriticos = useMemo(() => {
    return produtos
      .filter((p) => {
        const vmd = p.vendaMediaDiaria || 0;
        if (vmd === 0) return false;
        return p.estoque <= vmd;
      })
      .sort((a, b) => {
        const diasA = a.vendaMediaDiaria > 0 ? a.estoque / a.vendaMediaDiaria : Infinity;
        const diasB = b.vendaMediaDiaria > 0 ? b.estoque / b.vendaMediaDiaria : Infinity;
        return diasA - diasB;
      });
  }, [produtos]);

  const produtosAlerta = useMemo(() => {
    return produtos
      .filter((p) => {
        const vmd = p.vendaMediaDiaria || 0;
        if (vmd === 0) return false;
        return p.estoque > vmd && p.estoque <= vmd * 2;
      })
      .sort((a, b) => {
        const diasA = a.vendaMediaDiaria > 0 ? a.estoque / a.vendaMediaDiaria : Infinity;
        const diasB = b.vendaMediaDiaria > 0 ? b.estoque / b.vendaMediaDiaria : Infinity;
        return diasA - diasB;
      });
  }, [produtos]);

  const produtosSemVenda = useMemo(() => {
    return produtos.filter((p) => (p.vendaMediaDiaria || 0) === 0);
  }, [produtos]);

  const calcularDiasRestantes = (estoque, vmd) => {
    if (vmd <= 0) return '—';
    const dias = Math.floor(estoque / vmd);
    return dias;
  };

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
          <h2 className="page-titulo">Alertas de Estoque</h2>
          <p className="page-subtitulo">Produtos com problemas ou risco de ruptura</p>
        </div>
      </div>

      <div className="resumo-bar resumo-bar-4">
        <div className="resumo-card">
          <span className="resumo-label">Total Produtos</span>
          <span className="resumo-numero">{produtos.length}</span>
        </div>
        <div className="resumo-card">
          <span className="resumo-label">Críticos</span>
          <span className="resumo-numero" style={{ color: '#dc3545' }}>{produtosCriticos.length}</span>
        </div>
        <div className="resumo-card">
          <span className="resumo-label">Atenção</span>
          <span className="resumo-numero" style={{ color: '#e67e22' }}>{produtosAlerta.length}</span>
        </div>
        <div className="resumo-card">
          <span className="resumo-label">Sem Vendas</span>
          <span className="resumo-numero" style={{ color: '#999' }}>{produtosSemVenda.length}</span>
        </div>
      </div>

      {produtosCriticos.length > 0 && (
        <>
          <div className="alerta-section">
            <div className="alerta-section-header alerta-critico">
              <span className="alerta-icon">⚠</span>
              <span className="alerta-section-titulo">Estoque Crítico</span>
              <span className="alerta-section-desc">Estoque igual ou menor que a venda média diária</span>
            </div>
          </div>
          <div className="tabela-container" style={{ marginBottom: 28 }}>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Estoque Atual</th>
                  <th>Venda Média/Dia</th>
                  <th>Dias Restantes</th>
                </tr>
              </thead>
              <tbody>
                {produtosCriticos.map((p) => (
                  <tr key={p._id}>
                    <td><span className="tabela-nome">{p.nome}</span></td>
                    <td><span className="tabela-categoria-inline">{p.categoria}</span></td>
                    <td>
                      <span className="alerta-estoque-critico">{p.estoque}</span>
                    </td>
                    <td className="tabela-qtd">{p.vendaMediaDiaria}</td>
                    <td>
                      <span className="alerta-dias alerta-dias-critico">
                        {calcularDiasRestantes(p.estoque, p.vendaMediaDiaria)} {calcularDiasRestantes(p.estoque, p.vendaMediaDiaria) !== '—' ? 'dias' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {produtosAlerta.length > 0 && (
        <>
          <div className="alerta-section">
            <div className="alerta-section-header alerta-atencao">
              <span className="alerta-icon">!</span>
              <span className="alerta-section-titulo">Atenção</span>
              <span className="alerta-section-desc">Estoque pode acabar em menos de 2 dias</span>
            </div>
          </div>
          <div className="tabela-container" style={{ marginBottom: 28 }}>
            <table className="tabela">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Estoque Atual</th>
                  <th>Venda Média/Dia</th>
                  <th>Dias Restantes</th>
                </tr>
              </thead>
              <tbody>
                {produtosAlerta.map((p) => (
                  <tr key={p._id}>
                    <td><span className="tabela-nome">{p.nome}</span></td>
                    <td><span className="tabela-categoria-inline">{p.categoria}</span></td>
                    <td>
                      <span className="alerta-estoque-atencao">{p.estoque}</span>
                    </td>
                    <td className="tabela-qtd">{p.vendaMediaDiaria}</td>
                    <td>
                      <span className="alerta-dias alerta-dias-atencao">
                        {calcularDiasRestantes(p.estoque, p.vendaMediaDiaria)} dias
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {produtosCriticos.length === 0 && produtosAlerta.length === 0 && (
        <div className="empty-state">
          <p>Nenhum produto com problema de estoque no momento.</p>
        </div>
      )}
    </Layout>
  );
}

export default AlertasEstoque;
