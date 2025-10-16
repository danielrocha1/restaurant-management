import React, { useEffect, useState, useRef } from 'react';
import { Table, Input, Button, Form, Select, Card, Space, Popconfirm, Typography, Divider, Collapse } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title } = Typography;
const { Panel } = Collapse;

const API_CATEGORIAS = "https://restaurant-sw98.onrender.com/categoriassub";

const CategoryCRUD = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formCat] = Form.useForm();
  const [formSub] = Form.useForm();
  const [editandoCat, setEditandoCat] = useState(null);
  const [editandoSub, setEditandoSub] = useState(null);

  const formCatRef = useRef(null);
  const formSubRef = useRef(null);

  const fetchCategorias = () => {
    setLoading(true);
    fetch(API_CATEGORIAS)
      .then(res => res.json())
      .then(data => setCategorias(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const salvarCategoria = (values) => {
    const metodo = editandoCat ? 'PUT' : 'POST';
    const url = editandoCat ? `${API_CATEGORIAS}/categoria/${editandoCat.ID}` : `${API_CATEGORIAS}/categoria`;

    fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: values.nome }),
    })
      .then(res => res.json())
      .then(() => {
        formCat.resetFields();
        setEditandoCat(null);
        fetchCategorias();
      });
  };

  const salvarSubcategoria = (values) => {
    const metodo = editandoSub ? 'PUT' : 'POST';
    const url = editandoSub
      ? `${API_CATEGORIAS}/subcategoria/${editandoSub.ID}`
      : `${API_CATEGORIAS}/subcategoria`;

    fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: values.nome, CategoriaID: parseInt(values.categoria) }),
    })
      .then(res => res.json())
      .then(() => {
        formSub.resetFields();
        setEditandoSub(null);
        fetchCategorias();
      });
  };

  const removerCategoria = (id) => {
    fetch(`${API_CATEGORIAS}/categoria/${id}`, { method: 'DELETE' })
      .then(() => fetchCategorias());
  };

  const removerSubcategoria = (id) => {
    fetch(`${API_CATEGORIAS}/subcategoria/${id}`, { method: 'DELETE' })
      .then(() => fetchCategorias());
  };

  const handleEditarCategoria = (record) => {
    setEditandoCat(record);
    formCat.setFieldsValue({ nome: record.Nome });
    formCatRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleEditarSubcategoria = (record) => {
    setEditandoSub(record);
    formSub.setFieldsValue({ nome: record.Nome, categoria: record.CategoriaID.toString() });
    formSubRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const columnsCategoria = [
    { title: 'Categoria', dataIndex: 'Nome', key: 'Nome' },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditarCategoria(record)} />
          <Popconfirm title="Remover categoria?" onConfirm={() => removerCategoria(record.ID)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const columnsSubcategoria = [
    { title: 'Subcategoria', dataIndex: 'Nome', key: 'Nome' },
    {
      title: 'Categoria Pai',
      dataIndex: 'CategoriaID',
      key: 'CategoriaID',
      render: (catId) => {
        const cat = categorias.find(c => c.ID === catId);
        return cat ? cat.Nome : '-';
      }
    },
    {
      title: 'Ações',
      key: 'acoes',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditarSubcategoria(record)} />
          <Popconfirm title="Remover subcategoria?" onConfirm={() => removerSubcategoria(record.ID)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const subcategoriasFlat = categorias.flatMap(cat => cat.Subcategorias.map(sub => ({ ...sub })));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Title level={2}>Edição de Categorias e Subcategorias</Title>

      {/* Form Categoria */}
      <div ref={formCatRef}>
        <Card title={editandoCat ? "Editar Categoria" : "Adicionar Categoria"} style={{ marginBottom: 24 }}>
          <Form form={formCat} layout="inline" onFinish={salvarCategoria}>
            <Form.Item name="nome" rules={[{ required: true, message: 'Informe o nome' }]}>
              <Input placeholder="Nome da categoria" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                {editandoCat ? "Atualizar" : "Adicionar"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>

      {/* Form Subcategoria */}
      <div ref={formSubRef}>
        <Card title={editandoSub ? "Editar Subcategoria" : "Adicionar Subcategoria"} style={{ marginBottom: 24 }}>
          <Form form={formSub} layout="inline" onFinish={salvarSubcategoria}>
            <Form.Item name="categoria" rules={[{ required: true, message: 'Selecione a categoria' }]}>
              <Select placeholder="Categoria">
                {categorias.map(cat => (
                  <Option key={cat.ID} value={cat.ID.toString()}>{cat.Nome}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="nome" rules={[{ required: true, message: 'Informe o nome' }]}>
              <Input placeholder="Nome da subcategoria" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                {editandoSub ? "Atualizar" : "Adicionar"}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>

      <Divider />

      {/* Collapse Categorias */}
      <Collapse accordion>
        <Panel header="Categorias" key="categorias">
          <Table
            dataSource={categorias}
            columns={columnsCategoria}
            rowKey="ID"
            loading={loading}
            pagination={false}
          />
        </Panel>
      </Collapse>

      <Divider />

      {/* Collapse Subcategorias */}
      <Collapse accordion>
        <Panel header="Subcategorias" key="subcategorias">
          <Table
            dataSource={subcategoriasFlat}
            columns={columnsSubcategoria}
            rowKey="ID"
            loading={loading}
            pagination={false}
          />
        </Panel>
      </Collapse>
    </div>
  );
};

export default CategoryCRUD;
