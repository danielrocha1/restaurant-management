import React, { useEffect, useState, useRef } from 'react';
import { 
    Table, 
    Input, 
    Button, 
    Form, 
    Select, 
    Card, 
    Space, 
    Popconfirm, 
    Typography, 
    Divider, 
    Collapse, 
    message, 
    Spin, 
    Row, 
    Col,
    Tag 
} from 'antd';
import { 
    EditOutlined, 
    DeleteOutlined, 
    PlusOutlined, 
    SaveOutlined, 
    ReloadOutlined 
} from '@ant-design/icons';

const { Option } = Select;
const { Title, Text } = Typography;
const { Panel } = Collapse;

const API_CATEGORIAS = "https://restaurant-sw98.onrender.com/categoriassub";

const CategoryCRUD = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [isSavingSub, setIsSavingSub] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formCat] = Form.useForm();
  const [formSub] = Form.useForm();
  const [editandoCat, setEditandoCat] = useState(null);
  const [editandoSub, setEditandoSub] = useState(null);

  const formCatRef = useRef(null);
  const formSubRef = useRef(null);

  const fetchCategorias = () => {
    setLoading(true);
    fetch(API_CATEGORIAS)
      .then(res => {
        if (!res.ok) throw new Error("Erro ao buscar categorias");
        return res.json();
      })
      .then(data => setCategorias(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error(error);
        message.error("Falha ao carregar categorias.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const salvarCategoria = async (values) => {
    setIsSavingCat(true);
    const metodo = editandoCat ? 'PUT' : 'POST';
    const url = editandoCat ? `${API_CATEGORIAS}/categoria/${editandoCat.ID}` : `${API_CATEGORIAS}/categoria`;

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: values.nome }),
      });

      if (!res.ok) throw new Error("Falha na operação da categoria");
      
      message.success(`Categoria ${editandoCat ? 'atualizada' : 'adicionada'} com sucesso!`);
      formCat.resetFields();
      setEditandoCat(null);
      fetchCategorias();
    } catch (error) {
      console.error(error);
      message.error(`Erro ao ${editandoCat ? 'atualizar' : 'adicionar'} categoria.`);
    } finally {
      setIsSavingCat(false);
    }
  };

  const salvarSubcategoria = async (values) => {
    setIsSavingSub(true);
    const metodo = editandoSub ? 'PUT' : 'POST';
    const url = editandoSub
      ? `${API_CATEGORIAS}/subcategoria/${editandoSub.ID}`
      : `${API_CATEGORIAS}/subcategoria`;

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: values.nome, CategoriaID: parseInt(values.categoria) }),
      });

      if (!res.ok) throw new Error("Falha na operação da subcategoria");

      message.success(`Subcategoria ${editandoSub ? 'atualizada' : 'adicionada'} com sucesso!`);
      formSub.resetFields();
      setEditandoSub(null);
      fetchCategorias();
    } catch (error) {
      console.error(error);
      message.error(`Erro ao ${editandoSub ? 'atualizar' : 'adicionar'} subcategoria.`);
    } finally {
      setIsSavingSub(false);
    }
  };

  const removerItem = async (id, tipo) => {
    const url = tipo === 'categoria' ? `${API_CATEGORIAS}/categoria/${id}` : `${API_CATEGORIAS}/subcategoria/${id}`;
    setDeletingId(id);

    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Falha ao remover ${tipo}`);
      
      message.success(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} removida com sucesso!`);
      fetchCategorias();
    } catch (error) {
      console.error(error);
      message.error(`Erro ao remover ${tipo}.`);
    } finally {
      setDeletingId(null);
    }
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
    { title: 'ID', dataIndex: 'ID', key: 'ID', width: 80 },
    { title: 'Nome da Categoria', dataIndex: 'Nome', key: 'Nome' },
    {
      title: 'Subcategorias',
      key: 'SubcategoriasNomes',
      // ALTERAÇÃO AQUI: Mostra os nomes das subcategorias
      render: (_, record) => (
        <Space size={[0, 8]} wrap>
          {record.Subcategorias && record.Subcategorias.length > 0 ? (
            record.Subcategorias.map(sub => (
              <Tag color="blue" key={sub.ID}>
                {sub.Nome}
              </Tag>
            ))
          ) : (
            <Text type="secondary">Nenhuma subcategoria</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditarCategoria(record)} 
            type="default" 
            title="Editar Categoria"
            disabled={isSavingCat || deletingId !== null}
          />
          <Popconfirm 
            title="Tem certeza que deseja remover esta categoria?" 
            onConfirm={() => removerItem(record.ID, 'categoria')}
            okText="Sim"
            cancelText="Não"
          >
            <Button 
                danger 
                icon={<DeleteOutlined />} 
                loading={deletingId === record.ID}
                title="Remover Categoria"
                disabled={isSavingCat || deletingId !== null}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const columnsSubcategoria = [
    { title: 'ID', dataIndex: 'ID', key: 'ID', width: 80 },
    { title: 'Subcategoria', dataIndex: 'Nome', key: 'Nome' },
    {
      title: 'Categoria Pai',
      dataIndex: 'CategoriaID',
      key: 'CategoriaID',
      render: (catId) => {
        const cat = categorias.find(c => c.ID === catId);
        return <Tag color="purple">{cat ? cat.Nome : '—'}</Tag>;
      }
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditarSubcategoria(record)} 
            type="default" 
            title="Editar Subcategoria"
            disabled={isSavingSub || deletingId !== null}
          />
          <Popconfirm 
            title="Tem certeza que deseja remover esta subcategoria?" 
            onConfirm={() => removerItem(record.ID, 'subcategoria')}
            okText="Sim"
            cancelText="Não"
          >
            <Button 
                danger 
                icon={<DeleteOutlined />} 
                loading={deletingId === record.ID}
                title="Remover Subcategoria"
                disabled={isSavingSub || deletingId !== null}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const subcategoriasFlat = categorias.flatMap(cat => cat.Subcategorias.map(sub => ({ 
      ...sub, 
      CategoriaID: cat.ID 
  })));

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
      <Title level={2} style={{ color: '#333' }}>✨ Gerenciamento de Categorias</Title>
      <Text type="primary" style={{ display: 'block', marginBottom: 24 }}>
        Adicione, edite ou remova categorias principais e suas respectivas subcategorias.
      </Text>
      
      {/* Botão de Recarregar */}
      <div style={{ marginBottom: 20 }}>
        <Button 
            onClick={fetchCategorias} 
            loading={loading} 
            icon={<ReloadOutlined />}
            type="default"
        >
            Recarregar Dados
        </Button>
      </div>

      <Row gutter={24}>
        {/* Form Categoria */}
        <Col span={12}>
            <div ref={formCatRef}>
              <Card 
                title={<Title level={4} style={{ margin: 0, color: '#0056b3' }}>{editandoCat ? "Editar Categoria" : "Nova Categoria"}</Title>} 
                bordered={false}
                style={{ marginBottom: 24, boxShadow: "0 4px 8px rgba(0,0,0,0.05)" }}
              >
                <Form form={formCat} layout="vertical" onFinish={salvarCategoria} disabled={isSavingCat}>
                  <Form.Item 
                    name="nome" 
                    label="Nome da Categoria"
                    rules={[{ required: true, message: 'Por favor, insira o nome da categoria' }]}
                  >
                    <Input placeholder="Ex: Lanches, Bebidas, etc." />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={isSavingCat} 
                      icon={isSavingCat ? null : editandoCat ? <SaveOutlined /> : <PlusOutlined />}
                      style={{ background: editandoCat ? '#faad14' : '#1890ff', borderColor: editandoCat ? '#faad14' : '#1890ff' }}
                    >
                      {editandoCat ? (isSavingCat ? "Atualizando..." : "Atualizar Categoria") : (isSavingCat ? "Adicionando..." : "Adicionar Categoria")}
                    </Button>
                    {editandoCat && (
                        <Button 
                            onClick={() => { formCat.resetFields(); setEditandoCat(null); }}
                            style={{ marginLeft: 8 }}
                            disabled={isSavingCat}
                        >
                            Cancelar
                        </Button>
                    )}
                  </Form.Item>
                </Form>
              </Card>
            </div>
        </Col>

        {/* Form Subcategoria */}
        <Col span={12}>
            <div ref={formSubRef}>
              <Card 
                title={<Title level={4} style={{ margin: 0, color: '#6a0dad' }}>{editandoSub ? "Editar Subcategoria" : "Nova Subcategoria"}</Title>} 
                bordered={false}
                style={{ marginBottom: 24, boxShadow: "0 4px 8px rgba(0,0,0,0.05)" }}
              >
                <Form form={formSub} layout="vertical" onFinish={salvarSubcategoria} disabled={isSavingSub}>
                  <Form.Item 
                    name="categoria" 
                    label="Categoria Principal"
                    rules={[{ required: true, message: 'Selecione a categoria' }]}
                  >
                    <Select placeholder="Selecione a Categoria Pai">
                      {categorias.map(cat => (
                        <Option key={cat.ID} value={cat.ID.toString()}>{cat.Nome}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item 
                    name="nome" 
                    label="Nome da Subcategoria"
                    rules={[{ required: true, message: 'Por favor, insira o nome da subcategoria' }]}
                  >
                    <Input placeholder="Ex: Hamburgueres, Cervejas, etc." />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={isSavingSub} 
                      icon={isSavingSub ? null : editandoSub ? <SaveOutlined /> : <PlusOutlined />}
                      style={{ background: editandoSub ? '#faad14' : '#9254de', borderColor: editandoSub ? '#faad14' : '#9254de' }}
                    >
                      {editandoSub ? (isSavingSub ? "Atualizando..." : "Atualizar Subcategoria") : (isSavingSub ? "Adicionando..." : "Adicionar Subcategoria")}
                    </Button>
                    {editandoSub && (
                        <Button 
                            onClick={() => { formSub.resetFields(); setEditandoSub(null); }}
                            style={{ marginLeft: 8 }}
                            disabled={isSavingSub}
                        >
                            Cancelar
                        </Button>
                    )}
                  </Form.Item>
                </Form>
              </Card>
            </div>
        </Col>
      </Row>

      <Divider orientation="left" style={{ margin: '30px 0', borderBlockStartColor: '#aaa' }}>
        <Title level={5} style={{ margin: 0, color: '#555' }}>LISTAS ATUAIS</Title>
      </Divider>

      {/* Collapse Categorias */}
      <Collapse 
        accordion 
        style={{ marginBottom: 16, boxShadow: "0 4px 8px rgba(0,0,0,0.05)", borderRadius: 8 }}
      >
        <Panel 
          header={<Title level={4} style={{ margin: 0, color: '#0056b3' }}>Categorias Principais</Title>} 
          key="categorias"
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30 }}><Spin size="large" /></div>
          ) : (
            <Table
              dataSource={categorias}
              columns={columnsCategoria}
              rowKey="ID"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Panel>
      </Collapse>

      {/* Collapse Subcategorias */}
      <Collapse 
        accordion 
        style={{ boxShadow: "0 4px 8px rgba(0,0,0,0.05)", borderRadius: 8 }}
      >
        <Panel 
          header={<Title level={4} style={{ margin: 0, color: '#6a0dad' }}>Subcategorias</Title>} 
          key="subcategorias"
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: 30 }}><Spin size="large" /></div>
          ) : (
            <Table
              dataSource={subcategoriasFlat}
              columns={columnsSubcategoria}
              rowKey="ID"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Panel>
      </Collapse>
    </div>
  );
};

export default CategoryCRUD;