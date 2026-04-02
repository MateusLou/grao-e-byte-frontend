import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

function Funcionarios() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const { showToast } = useToast();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (userRole !== 'gerente') {
      navigate('/products');
      return;
    }
    carregarFuncionarios();
  }, []);

  const carregarFuncionarios = async () => {
    try {
      const response = await fetch('/api/auth/funcionarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFuncionarios(data);
      }
    } catch {
      showToast('Erro ao carregar funcionarios', 'error');
    }
  };

  const handleDeletar = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);

    try {
      const response = await fetch(`/api/auth/funcionarios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('Funcionario removido com sucesso!', 'success');
        carregarFuncionarios();
      } else {
        const data = await response.json();
        showToast(data.erro || 'Erro ao remover funcionario', 'error');
      }
    } catch {
      showToast('Erro de conexao com o servidor', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nome, email, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.erro || 'Erro ao cadastrar funcionario', 'error');
        return;
      }

      showToast(`Funcionario "${nome}" cadastrado com sucesso!`, 'success');
      setNome('');
      setEmail('');
      setSenha('');
      carregarFuncionarios();
    } catch {
      showToast('Erro de conexao com o servidor', 'error');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="page-titulo">Funcionários</h2>
          <p className="page-subtitulo">Cadastre novos membros da equipe</p>
        </div>
      </div>

      <div className="func-layout">
        <div className="form-container">
          <h3 className="form-section-titulo">Novo Funcionário</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Ana Costa"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ana@graobyte.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha de acesso"
                required
                minLength={4}
              />
            </div>

            <button type="submit" className="btn-primario">
              Cadastrar Funcionário
            </button>
          </form>
        </div>

        <div className="func-lista-container">
          <h3 className="form-section-titulo">Equipe Atual</h3>
          {funcionarios.length === 0 ? (
            <p style={{ color: '#999', fontSize: '0.85rem' }}>Nenhum funcionário cadastrado.</p>
          ) : (
            <div className="func-lista">
              {funcionarios.map((func) => (
                <div key={func._id} className="func-item">
                  <div className="tabela-avatar">
                    {func.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="func-item-info">
                    <span className="tabela-nome">{func.nome}</span>
                    <span className="tabela-email">{func.email}</span>
                  </div>
                  {func.role !== 'gerente' && (
                    <button
                      className="func-btn-deletar"
                      onClick={() => setDeleteTarget({ id: func._id, nome: func.nome })}
                      title="Remover funcionário"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remover Funcionário"
        message={deleteTarget ? `Tem certeza que deseja remover "${deleteTarget.nome}"?` : ''}
        confirmLabel="Remover"
        onConfirm={handleDeletar}
        onCancel={() => setDeleteTarget(null)}
        danger
      />
    </Layout>
  );
}

export default Funcionarios;
