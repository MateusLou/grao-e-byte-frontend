function StatusPedidos({ dados }) {
  if (!dados) return null;

  return (
    <div className="dashboard-section">
      <h3 className="dashboard-section-titulo">Status dos Pedidos</h3>
      <div className="semaforo-container">
        <div className="semaforo-item">
          <div className="semaforo-circulo semaforo-em-andamento">
            {dados.emAndamento}
          </div>
          <span className="semaforo-label">Em andamento</span>
        </div>
        <div className="semaforo-item">
          <div className="semaforo-circulo semaforo-pronto">
            {dados.prontos}
          </div>
          <span className="semaforo-label">Prontos</span>
        </div>
        <div className="semaforo-item">
          <div className="semaforo-circulo semaforo-aguardando">
            {dados.emAndamento + dados.prontos}
          </div>
          <span className="semaforo-label">Total abertos</span>
        </div>
      </div>
    </div>
  );
}

export default StatusPedidos;
