import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

const TAGS_PREDEFINIDAS = ['Vegano', 'Sem Lactose', 'Sem Gluten'];

function ProductForm() {
  const { id } = useParams();
  const isEdicao = Boolean(id);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isGerente = localStorage.getItem('userRole') === 'gerente';
  const { showToast } = useToast();

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState('Outros');
  const [ativo, setAtivo] = useState(true);
  const [tags, setTags] = useState([]);
  const [tagsDisponiveis, setTagsDisponiveis] = useState([]);
  const [novaTag, setNovaTag] = useState('');
  const [erro, setErro] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (!isEdicao && !isGerente) {
      navigate('/products');
      return;
    }

    // Carregar tags disponiveis
    fetch('/api/products/tags', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => setTagsDisponiveis(data))
      .catch(() => {});

    if (isEdicao) {
      fetch(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => res.json())
        .then((data) => {
          setNome(data.nome);
          setDescricao(data.descricao);
          setPreco(data.preco);
          setCategoria(data.categoria || 'Outros');
          setAtivo(data.ativo !== false);
          setTags(data.tags || []);
        })
        .catch(() => setErro('Erro ao carregar produto'));
    }
  }, []);

  const toggleTag = (tag) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const adicionarTag = () => {
    const tag = novaTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setNovaTag('');
    }
  };

  const removerTag = (tag) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    const produto = {
      nome,
      descricao,
      preco: Number(preco),
      categoria,
      ativo,
      tags
    };

    try {
      const url = isEdicao ? `/api/products/${id}` : '/api/products';
      const method = isEdicao ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(produto)
      });

      if (!response.ok) {
        const data = await response.json();
        showToast(data.erro || 'Erro ao salvar produto', 'error');
        return;
      }

      showToast(isEdicao ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!', 'success');
      navigate('/products');
    } catch {
      showToast('Erro de conexao com o servidor', 'error');
    }
  };

  const handleExcluir = async () => {
    setShowDeleteModal(false);

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        showToast('Produto excluido com sucesso!', 'success');
        navigate('/products');
      } else {
        showToast('Erro ao excluir produto', 'error');
      }
    } catch {
      showToast('Erro ao excluir produto', 'error');
    }
  };

  // Combinar tags predefinidas + tags do banco (sem duplicatas)
  const todasTagsOpcoes = [...new Set([...TAGS_PREDEFINIDAS, ...tagsDisponiveis])];

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h2 className="page-titulo">{isEdicao ? 'Editar Produto' : 'Novo Produto'}</h2>
          <p className="page-subtitulo">
            {isEdicao ? 'Atualize as informações do produto' : 'Adicione um novo item ao estoque'}
          </p>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do Produto</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Café Arábica Premium"
              required
            />
          </div>

          <div className="form-group">
            <label>Descricao</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Grãos torrados de alta qualidade, origem Minas Gerais"
              required
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Custo Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="Ex: 45.00"
                required
              />
            </div>

            <div className="form-group">
              <label>Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="Graos">Grãos</option>
                <option value="Insumos">Insumos</option>
                <option value="Alimentos">Alimentos</option>
                <option value="Descartaveis">Descartáveis</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          {/* Status ativo */}
          {isEdicao && (
            <div className="form-group">
              <label>Status</label>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                />
                <span className="toggle-text">{ativo ? 'Ativo' : 'Inativo'}</span>
              </label>
            </div>
          )}

          {/* Tags */}
          <div className="form-group">
            <label>Tags</label>
            <div className="tags-opcoes">
              {todasTagsOpcoes.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-opcao-btn ${tags.includes(tag) ? 'tag-opcao-selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="tags-input-row">
              <input
                type="text"
                value={novaTag}
                onChange={(e) => setNovaTag(e.target.value)}
                placeholder="Nova tag personalizada..."
                className="tag-input"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarTag(); } }}
              />
              <button type="button" className="btn-add-tag" onClick={adicionarTag}>
                Adicionar
              </button>
            </div>
            {tags.length > 0 && (
              <div className="tags-selecionadas">
                {tags.map((tag) => (
                  <span key={tag} className="tag-pill-removable">
                    {tag}
                    <button type="button" className="tag-remove-btn" onClick={() => removerTag(tag)}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {erro && <p className="erro-mensagem">{erro}</p>}

          <div className="form-acoes">
            <button type="submit" className="btn-primario">
              {isEdicao ? 'Salvar Alterações' : 'Adicionar Produto'}
            </button>
            <button
              type="button"
              className="btn-cancelar"
              onClick={() => navigate('/products')}
            >
              Cancelar
            </button>
          </div>
        </form>

        {isEdicao && isGerente && (
          <div className="form-zona-perigo">
            <span className="form-zona-perigo-titulo">Zona de perigo</span>
            <button
              type="button"
              className="btn-excluir-full"
              onClick={() => setShowDeleteModal(true)}
            >
              Excluir Produto
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Excluir Produto"
        message={`Tem certeza que deseja excluir "${nome}"? Todas as movimentações deste produto serão removidas.`}
        confirmLabel="Excluir"
        onConfirm={handleExcluir}
        onCancel={() => setShowDeleteModal(false)}
        danger
      />
    </Layout>
  );
}

export default ProductForm;
