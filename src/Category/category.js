import React, { useEffect, useState } from 'react';

const API_CATEGORIAS = "https://restaurant-sw98.onrender.com/categoriassub";

const CategoryCRUD = () => {
  const [categorias, setCategorias] = useState([]);
  const [nomeCategoria, setNomeCategoria] = useState('');
  const [nomeSubcategoria, setNomeSubcategoria] = useState('');
  const [editandoCatId, setEditandoCatId] = useState(null);
  const [editandoSubId, setEditandoSubId] = useState(null);
  const [subCategoriaPai, setSubCategoriaPai] = useState('');

  // Buscar categorias e subcategorias
  useEffect(() => {
    fetch(API_CATEGORIAS)
      .then(res => res.json())
      .then(data => setCategorias(data))
      .catch(err => console.error(err));
  }, []);

  // Salvar categoria
  const salvarCategoria = () => {
    if (!nomeCategoria.trim()) return;

    const metodo = editandoCatId ? 'PUT' : 'POST';
    const url = editandoCatId ? `${API_CATEGORIAS}/categoria/${editandoCatId}` : `${API_CATEGORIAS}/categoria`;

    fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nomeCategoria }),
    })
      .then(res => res.json())
      .then(data => {
        if (editandoCatId) {
          setCategorias(categorias.map(cat => cat.ID === editandoCatId ? { ...cat, Nome: nomeCategoria } : cat));
        } else {
          setCategorias([...categorias, { ...data, Subcategorias: [] }]);
        }
        setNomeCategoria('');
        setEditandoCatId(null);
      });
  };

  // Remover categoria
  const removerCategoria = (id) => {
    fetch(`${API_CATEGORIAS}/categoria/${id}`, { method: 'DELETE' })
      .then(() => setCategorias(categorias.filter(c => c.ID !== id)));
  };

  // Editar categoria
  const editarCategoria = (cat) => {
    setNomeCategoria(cat.Nome);
    setEditandoCatId(cat.ID);
  };

  // Salvar subcategoria
  const salvarSubcategoria = () => {
    if (!nomeSubcategoria.trim() || !subCategoriaPai) return;

    const metodo = editandoSubId ? 'PUT' : 'POST';
    const url = editandoSubId 
      ? `${API_CATEGORIAS}/subcategoria/${editandoSubId}` 
      : `${API_CATEGORIAS}/subcategoria`;

    fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nomeSubcategoria, CategoriaID: parseInt(subCategoriaPai) }),
    })
      .then(res => res.json())
      .then(data => {
        setCategorias(categorias.map(cat => {
          if (cat.ID === data.CategoriaID) {
            if (editandoSubId) {
              cat.Subcategorias = cat.Subcategorias.map(sub => sub.ID === editandoSubId ? { ...sub, Nome: nomeSubcategoria } : sub);
            } else {
              cat.Subcategorias.push(data);
            }
          }
          return cat;
        }));
        setNomeSubcategoria('');
        setEditandoSubId(null);
        setSubCategoriaPai('');
      });
  };

  // Remover subcategoria
  const removerSubcategoria = (catId, subId) => {
    fetch(`${API_CATEGORIAS}/subcategoria/${subId}`, { method: 'DELETE' })
      .then(() => {
        setCategorias(categorias.map(cat => {
          if (cat.ID === catId) {
            cat.Subcategorias = cat.Subcategorias.filter(sub => sub.ID !== subId);
          }
          return cat;
        }));
      });
  };

  // Editar subcategoria
  const editarSubcategoria = (sub) => {
    setNomeSubcategoria(sub.Nome);
    setEditandoSubId(sub.ID);
    setSubCategoriaPai(sub.CategoriaID.toString());
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Categorias e Subcategorias</h2>

      {/* Form Categoria */}
      <div className="flex gap-2 mb-6">
        <input
          value={nomeCategoria}
          onChange={e => setNomeCategoria(e.target.value)}
          placeholder="Nome da categoria"
          className="border p-2 rounded w-full"
        />
        <button
          onClick={salvarCategoria}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {editandoCatId ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>

      {/* Form Subcategoria */}
      <div className="flex gap-2 mb-6">
        <select 
          value={subCategoriaPai} 
          onChange={e => setSubCategoriaPai(e.target.value)} 
          className="border p-2 rounded w-1/3"
        >
          <option value="">Selecione a categoria</option>
          {categorias.map(cat => <option key={cat.ID} value={cat.ID}>{cat.Nome}</option>)}
        </select>
        <input
          value={nomeSubcategoria}
          onChange={e => setNomeSubcategoria(e.target.value)}
          placeholder="Nome da subcategoria"
          className="border p-2 rounded w-2/3"
        />
        <button
          onClick={salvarSubcategoria}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {editandoSubId ? 'Atualizar' : 'Adicionar'}
        </button>
      </div>

      {/* Listagem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categorias.map(cat => (
          <div key={cat.ID} className="bg-white shadow-md p-4 rounded-lg border">
            <h3 className="text-lg font-semibold flex justify-between items-center">
              {cat.Nome}
              <div>
                <button onClick={() => editarCategoria(cat)} className="text-blue-600 mr-2 hover:underline">Editar</button>
                <button onClick={() => removerCategoria(cat.ID)} className="text-red-600 hover:underline">Remover</button>
              </div>
            </h3>

            <ul className="mt-2 ml-4">
              {cat.Subcategorias.map(sub => (
                <li key={sub.ID} className="flex justify-between items-center mt-1">
                  {sub.Nome}
                  <div>
                    <button onClick={() => editarSubcategoria(sub)} className="text-blue-600 mr-2 hover:underline">Editar</button>
                    <button onClick={() => removerSubcategoria(cat.ID, sub.ID)} className="text-red-600 hover:underline">Remover</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryCRUD;
