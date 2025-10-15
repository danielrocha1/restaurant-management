import React, { useState, useEffect } from 'react';

const Product = () => {
  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState({
    Nome: '',
    Descricao: '',
    Preco: '',
    PrecoPromocional: '',
    ImagemURL: ''
  });
  const [editandoId, setEditandoId] = useState(null); // guarda o ID do produto em edição

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const res = await fetch('http://localhost:4000/produtos');
      const data = await res.json();
      setProdutos(data);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const limparFormulario = () => {
    setForm({
      Nome: '',
      Descricao: '',
      Preco: '',
      PrecoPromocional: '',
      ImagemURL: ''
    });
    setEditandoId(null);
  };

  const adicionarProduto = async () => {
    try {
      const res = await fetch('http://localhost:4000/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        limparFormulario();
        fetchProdutos();
      }
    } catch (err) {
      console.error('Erro ao adicionar produto:', err);
    }
  };

  const editarProduto = (produto) => {
    setForm({
      Nome: produto.Nome,
      Descricao: produto.Descricao,
      Preco: produto.Preco,
      PrecoPromocional: produto.PrecoPromocional,
      ImagemURL: produto.Imagem
    });
    setEditandoId(produto.ID);
  };

  const atualizarProduto = async () => {
    try {
      const res = await fetch(`http://localhost:4000/produtos/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        limparFormulario();
        fetchProdutos();
      }
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
    }
  };

  const removerProduto = async (id) => {
    try {
      const res = await fetch(`http://localhost:4000/produtos/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProdutos(produtos.filter(p => p.ID !== id));
      }
    } catch (err) {
      console.error('Erro ao remover produto:', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Produtos</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: 400 }}>
        <input name="Nome" value={form.Nome} onChange={handleChange} placeholder="Nome" />
        <input name="Descricao" value={form.Descricao} onChange={handleChange} placeholder="Descrição" />
        <input name="Preco" value={form.Preco} onChange={handleChange} placeholder="Preço" />
        <input name="PrecoPromocional" value={form.PrecoPromocional} onChange={handleChange} placeholder="Preço Promocional" />
        <input name="ImagemURL" value={form.ImagemURL} onChange={handleChange} placeholder="URL da Imagem" />

        {editandoId ? (
          <>
            <button onClick={atualizarProduto} style={{ background: 'green', color: 'white' }}>Atualizar Produto</button>
            <button onClick={limparFormulario} style={{ background: 'gray', color: 'white' }}>Cancelar</button>
          </>
        ) : (
          <button onClick={adicionarProduto}>Adicionar Produto</button>
        )}
      </div>

      <ul style={{ listStyle: 'none', padding: 0, marginTop: 30 }}>
        {produtos.map(p => (
          <li key={p.ID} style={{ border: '1px solid #ccc', marginBottom: 10, padding: 10 }}>
            <h3>{p.Nome}</h3>
            <p>{p.Descricao}</p>
            <p><strong>Preço:</strong> {p.Preco}</p>
            {p.PrecoPromocional && <p><strong>Promoção:</strong> {p.PrecoPromocional}</p>}
            {p.ImagemURL && <img src={p.ImagemURL} alt={p.Nome} style={{ maxWidth: '200px' }} />}
            <div style={{ marginTop: 10 }}>
              <button onClick={() => editarProduto(p)} style={{ marginRight: 10 }}>Editar</button>
              <button onClick={() => removerProduto(p.ID)} style={{ color: 'red' }}>Remover</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Product;
