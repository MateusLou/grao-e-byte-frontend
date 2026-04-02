import { useNavigate } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const nomeUsuario = localStorage.getItem('nomeUsuario');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('nomeUsuario');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-esquerda">
        <h1 className="header-logo">Grão & Byte</h1>
        <span className="header-subtitulo">Sistema de Gestão de Estoque</span>
      </div>
      <div className="header-direita">
        <span className="header-usuario">Olá, {nomeUsuario}</span>
        <button className="btn-sair" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </header>
  );
}

export default Header;
