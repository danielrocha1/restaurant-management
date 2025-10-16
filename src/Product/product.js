import React, { useEffect, useState } from "react";
import {
  Collapse,
  List,
  Spin,
  Button,
  Popconfirm,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Space,
  Image,
} from "antd";
import { EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";

const { Panel } = Collapse;
const { Title, Text } = Typography;
const API_PRODUTOS = "https://restaurant-sw98.onrender.com/produtos";
const API_CATEGORIAS = "https://restaurant-sw98.onrender.com/categoriassub";

/**
 * CategoryCollapse — versão aprimorada
 * - UI mais agradável com Ant Design Card/Image/Tag
 * - Logs de debug mantidos
 * - Otimistic update ao editar/remover com rollback em caso de erro
 * - Desabilita botões durante operações
 * - Melhora validações do form
 */


export default function CategoryCollapse() {
  const [categorias, setCategorias] = useState([]);
  const [produtos, setProdutos] = useState({}); // { "Combinados": [ ... ] }
  const [loadingMap, setLoadingMap] = useState({}); // { "Combinados": bool, "Combinados_save": bool, ... }
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);

  const [form] = Form.useForm();

  // helper para setar loading por chave
  const setLoading = (key, value) => {
    setLoadingMap((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    console.log("Buscando categorias e subcategorias...");
    fetch(API_CATEGORIAS)
      .then((res) => res.json())
      .then((data) => {
        console.log("Categorias recebidas do backend:", data);
        setCategorias(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Erro ao buscar categorias:", err);
        message.error("Erro ao buscar categorias");
      });
  }, []);

   useEffect(() => {
    console.log(categorias)
  }, [categorias]);

  // fetchProdutos — busca e popula produtos[categoriaOuSub]
  const fetchProdutos = async (categoriaOuSub) => {
    console.log("Buscando produtos para:", categoriaOuSub);

    // se já existe e não quer refetch, comente a linha abaixo — aqui mantemos cache evitando refetch desnecessário
    if (produtos[categoriaOuSub]) {
      console.log(`Produtos de ${categoriaOuSub} já carregados, ignorando requisição.`);
      return;
    }

    setLoading(categoriaOuSub, true);
    try {
      const res = await fetch(
        `https://restaurant-sw98.onrender.com/produtos-list?categoria=${encodeURIComponent(categoriaOuSub)}&page=1`
      );
      if (!res.ok) throw new Error("Resposta não OK");
      const data = await res.json();
      console.log(`Produtos recebidos para ${categoriaOuSub}:`, data);
      setProdutos((prev) => ({ ...prev, [categoriaOuSub]: Array.isArray(data.data) ? data.data : [] }));
    } catch (err) {
      console.error("Erro ao buscar produtos:", err);
      message.error(`Erro ao buscar produtos de ${categoriaOuSub}`);
    } finally {
      setLoading(categoriaOuSub, false);
      console.log("Loading setado para false:", categoriaOuSub);
    }
  };

  // abrir modal para editar: preenche form e abre modal
  const abrirModalParaEditar = (produto, categoriaNome) => {
    console.log("Abrindo modal para editar:", produto, "categoria:", categoriaNome);
    setEditando({ ...produto, __categoriaNome: categoriaNome });
    form.setFieldsValue({
      Nome: produto.Nome || "",
      Descricao: produto.Descricao || "",
      Preco: produto.Preco != null ? Number(produto.Preco) : undefined,
      PrecoPromocional: produto.PrecoPromocional ? Number(produto.PrecoPromocional) : undefined,
      ImagemURL: produto.Imagem || produto.ImagemURL || "",
      CategoriaID: produto.CategoriaID || produto.Categoria?.ID || undefined,
    });
    setModalVisible(true);
  };

  // remover produto com optimistic update + rollback
  const removerProduto = async (id, categoriaNome) => {
    console.log("Remover pedido:", id, "categoria:", categoriaNome);
    // backup
    const prev = produtos[categoriaNome] || [];
    const nextList = prev.filter((p) => p.ID !== id);
    setProdutos((prevMap) => ({ ...prevMap, [categoriaNome]: nextList }));
    setLoading(`removendo_${id}`, true);

    try {
      const res = await fetch(`${API_PRODUTOS}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover");
      message.success("Produto removido");
      console.log("Produto removido com sucesso:", id);
    } catch (err) {
      // rollback
      setProdutos((prevMap) => ({ ...prevMap, [categoriaNome]: prev }));
      console.error("Erro ao remover produto:", err);
      message.error("Erro ao remover produto");
    } finally {
      setLoading(`removendo_${id}`, false);
    }
  };

  // salvar produto (PUT) — faz optimistic update local e refaz fetch parcial caso necessário
  const salvarProduto = async (values) => {
    if (!editando) return;
    const id = editando.ID;
    const savingKey = `salvando_${id}`;
    setLoading(savingKey, true);

    const payload = {
      ...editando,
      Nome: values.Nome,
      Descricao: values.Descricao,
      Preco: values.Preco !== undefined ? Number(values.Preco) : null,
      PrecoPromocional: values.PrecoPromocional !== undefined ? Number(values.PrecoPromocional) : null,
      Imagem: values.ImagemURL || "",
      CategoriaID: values.CategoriaID || editando.CategoriaID || (editando.Categoria ? editando.Categoria.ID : undefined),
    };

    console.log("Salvando produto (PUT):", id, payload);

    // optimistic update: atualiza localmente onde o produto está (se encontrado)
    const prevMap = { ...produtos };
    let oldCategoriaNome = editando.__categoriaNome || (editando.Categoria && editando.Categoria.Nome) || undefined;

    // attempt to find category name from categorias list if not present
    if (!oldCategoriaNome && payload.CategoriaID) {
      const cat = categorias.find((c) => c.ID === payload.CategoriaID);
      if (cat) oldCategoriaNome = cat.Nome;
    }

    // backup da lista antiga
    const backup = { ...prevMap };

    try {
      // send request
      const res = await fetch(`${API_PRODUTOS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erro ao atualizar produto");
      }
      const updated = await res.json();
      message.success("Produto atualizado");
      console.log("Produto atualizado recebido do backend:", updated);

      // Se a categoria mudou (nome ou id), removemos do antigo grupo e adicionamos no novo
      const newCategoriaNome = (updated.Categoria && updated.Categoria.Nome) || updated.CategoriaNome ||
        (function infer() {
          const c = categorias.find((c) => c.ID === payload.CategoriaID);
          return c ? c.Nome : undefined;
        })() || "Sem categoria";

      setProdutos((prevMap) => {
        const next = { ...prevMap };

        // remove do antigo
        if (oldCategoriaNome && Array.isArray(next[oldCategoriaNome])) {
          next[oldCategoriaNome] = next[oldCategoriaNome].filter((p) => p.ID !== id);
        } else {
          // também remova de qualquer lista que contenha o id
          Object.entries(next).forEach(([k, lista]) => {
            next[k] = lista.filter((p) => p.ID !== id);
          });
        }

        // insere no novo grupo (no topo)
        next[newCategoriaNome] = [updated, ...(next[newCategoriaNome] || [])];

        return next;
      });

      setModalVisible(false);
      setEditando(null);
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
      message.error("Erro ao salvar produto");
      // rollback
      setProdutos(backup);
    } finally {
      setLoading(savingKey, false);
    }
  };

  // UI Helper — exibe cartão de produto com preço/promo
  function ProductCard({ p }) {
    const preco = p.Preco != null ? Number(p.Preco).toFixed(2) : null;
    const promo = p.PrecoPromocional != null && p.PrecoPromocional !== "" ? Number(p.PrecoPromocional).toFixed(2) : null;

    return (
      <Card bordered hoverable style={{ width: "100%" }}>
        <Row gutter={16} align="middle">
          <Col>
            {p.Imagem || p.ImagemURL ? (
              <Image src={p.Imagem || p.ImagemURL} width={96} height={96} style={{ objectFit: "cover", borderRadius: 8 }} />
            ) : (
              <div style={{ width: 96, height: 96, background: "#fafafa", borderRadius: 8 }} />
            )}
          </Col>

          <Col flex="auto">
            <Title level={5} style={{ margin: 0 }}>{p.Nome}</Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>{p.Descricao}</Text>

            <Space size="small" align="center">
              {promo ? (
                <>
                  <Text delete>R$ {preco}</Text>
                  <Tag color="red" style={{ fontWeight: 700 }}>R$ {promo}</Tag>
                </>
              ) : (
                <Text strong>R$ {preco ?? "—"}</Text>
              )}
              {p.Active === false ? <Tag color="default">Inativo</Tag> : null}
            </Space>
          </Col>
        </Row>
      </Card>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>Produtos</Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => {
              // limpa cache e refetch categorias (e produtos)
              setProdutos({});
              setCategorias([]);
              fetch(API_CATEGORIAS)
                .then((r) => r.json())
                .then((d) => {
                  setCategorias(Array.isArray(d) ? d : []);
                })
                .catch(() => message.error("Erro ao recarregar categorias"));
            }}>Recarregar</Button>
          </Space>
        </Col>
      </Row>

      <Collapse
        accordion
        onChange={(key) => {
          console.log("Categoria aberta:", key);
          if (!key) return;
          const nomeCat = Array.isArray(key) ? key[0] : key;
          const catSelecionada = categorias.find((c) => c.Nome === nomeCat);
          console.log("Categoria selecionada:", catSelecionada);
          if (!catSelecionada) return;
          const temSub =
            catSelecionada.Subcategorias &&
            !(
              catSelecionada.Subcategorias.length === 1 &&
              catSelecionada.Subcategorias[0].Nome === "Sem subcategoria"
            );
          console.log(`Tem subcategorias reais? ${temSub}`);
          if (!temSub) {
            fetchProdutos(catSelecionada.Nome);
          }
        }}
      >
        {categorias.map((cat) => {
          const temSub =
            cat.Subcategorias &&
            !(
              cat.Subcategorias.length === 1 &&
              cat.Subcategorias[0].Nome === "Sem subcategoria"
            );

          console.log("Renderizando categoria:", cat.Nome, "Tem sub?", temSub);

          return (
            <Panel header={`${cat.Nome}`} key={cat.Nome}>
              {temSub ? (
                <Collapse
                  accordion
                  onChange={(key) => {
                    console.log("Subcategoria aberta:", key);
                    if (!key) return;
                    const nomeSub = Array.isArray(key) ? key[0] : key;
                    fetchProdutos(nomeSub);
                  }}
                >
                  {cat.Subcategorias.map((sub) => (
                    <Panel header={sub.Nome} key={sub.Nome}>
                      {loadingMap[sub.Nome] ? (
                        <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
                      ) : produtos[sub.Nome] ? (
                        <List
                          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3 }}
                          dataSource={produtos[sub.Nome]}
                          renderItem={(item) => (
                            <List.Item>
                              <ProductCard p={item} />
                              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                                <Button
                                  icon={<EditOutlined />}
                                  onClick={() => abrirModalParaEditar(item, sub.Nome)}
                                  disabled={Boolean(loadingMap[`salvando_${item.ID}`])}
                                >
                                  Editar
                                </Button>
                                <Popconfirm
                                  title="Remover este produto?"
                                  onConfirm={() => removerProduto(item.ID, sub.Nome)}
                                  okText="Sim"
                                  cancelText="Não"
                                >
                                  <Button danger icon={<DeleteOutlined />} loading={Boolean(loadingMap[`removendo_${item.ID}`])}>
                                    Remover
                                  </Button>
                                </Popconfirm>
                              </div>
                            </List.Item>
                          )}
                        />
                      ) : (
                        <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
                      )}
                    </Panel>
                  ))}
                </Collapse>
              ) : loadingMap[cat.Nome] ? (
                <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
              ) : produtos[cat.Nome] ? (
                <List
                  grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3 }}
                  dataSource={produtos[cat.Nome]}
                  renderItem={(p) => (
                    <List.Item>
                      <ProductCard p={p} />
                      <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => abrirModalParaEditar(p, cat.Nome)}
                          disabled={Boolean(loadingMap[`salvando_${p.ID}`])}
                        >
                          Editar
                        </Button>
                        <Popconfirm
                          title="Remover este produto?"
                          onConfirm={() => removerProduto(p.ID, cat.Nome)}
                          okText="Sim"
                          cancelText="Não"
                        >
                          <Button danger icon={<DeleteOutlined />} loading={Boolean(loadingMap[`removendo_${p.ID}`])}>
                            Remover
                          </Button>
                        </Popconfirm>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: "center", padding: 24 }}><Spin /></div>
              )}
            </Panel>
          );
        })}
      </Collapse>

      {/* Modal de edição */}
      <Modal
        title={editando ? "Editar Produto" : "Editar Produto"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditando(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={salvarProduto}
          initialValues={{ Preco: 0 }}
        >
          <Form.Item name="Nome" label="Nome" rules={[{ required: true, message: "Informe o nome" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="Descricao" label="Descrição">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="Preco"
                label="Preço"
                rules={[{ required: true, message: "Informe o preço" }]}
              >
                <InputNumber style={{ width: "100%" }} min={0} step={0.01} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="PrecoPromocional" label="Preço Promocional">
                <InputNumber style={{ width: "100%" }} min={0} step={0.01} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="ImagemURL" label="URL da Imagem">
            <Input />
          </Form.Item>

          <Form.Item
            name="CategoriaID"
            label="Categoria"
            rules={[{ required: true, message: "Selecione uma categoria" }]}
          >
            <Select placeholder="Selecione uma categoria">
              {categorias.map((c) => (
                <Select.Option key={c.ID} value={c.ID}>
                  {c.Nome}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => { setModalVisible(false); setEditando(null); form.resetFields(); }}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit" loading={Boolean(editando && loadingMap[`salvando_${editando.ID}`])}>
                Salvar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
