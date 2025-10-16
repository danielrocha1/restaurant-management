import React, { useEffect, useState } from 'react';

const API_URL = 'https://restaurant-sw98.onrender.com/categorias';

const Category = () => {
  const [categorias, setCategorias] = useState([]);
  const [nome, setNome] = useState('');
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setCategorias(data))
      .catch(err => console.error('Erro ao buscar categorias:', err));
  }, []);

  const salvar = () => {
    if (!nome.trim()) return;

    const metodo = editandoId ? 'PUT' : 'POST';
    const url = editandoId ? `${API_URL}/${editandoId}` : API_URL;

    fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    })
      .then(res => res.json())
      .then(data => {
        if (editandoId) {
          setCategorias(categorias.map(cat => cat.ID === editandoId ? { ...cat, Nome: nome } : cat));
        } else {
          setCategorias([...categorias, data]);
        }
        setNome('');
        setEditandoId(null);
      });
  };

  const remover = (id) => {
    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      .then(() => {
        setCategorias(categorias.filter(c => c.ID !== id));
      });
  };

  const editar = (cat) => {
    setNome(cat.Nome);
    setEditandoId(cat.ID);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Categorias</h2>
      <div className="flex gap-2 mb-6">
        <input
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Nome da categoria"
          className="border p-2 rounded w-full"
        />
        <button
          onClick={salvar}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {editandoId ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categorias.map(cat => (
          <div key={cat.ID} className="bg-white shadow-md p-4 rounded-lg border">
            <h3 className="text-lg font-semibold">{cat.Nome}</h3>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => editar(cat)}
                className="text-blue-600 hover:underline"
              >
                Editar
              </button>
              <button
                onClick={() => remover(cat.ID)}
                className="text-red-600 hover:underline"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Category;
