import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || 'Email ou senha incorretos');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('nomeUsuario', data.nome);
      localStorage.setItem('userRole', data.role);
      navigate('/dashboard');
    } catch {
      setErro('Erro de conexao com o servidor');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-logo">Grão & Byte</h1>
        <p className="login-subtitulo">Sistema de Gestão de Estoque</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
              required
            />
          </div>

          {erro && <p className="erro-mensagem">{erro}</p>}

          <button type="submit" className="btn-primario">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
