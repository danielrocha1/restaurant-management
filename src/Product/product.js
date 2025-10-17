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
import { 
    EditOutlined, 
    DeleteOutlined, 
    ReloadOutlined, 
    EyeOutlined, // Novo ícone
    EyeInvisibleOutlined // Novo ícone
} from "@ant-design/icons";

const { Panel } = Collapse;
const { Title, Text } = Typography;
const API_PRODUTOS = "https://restaurant-sw98.onrender.com/produtos";
const API_CATEGORIAS = "https://restaurant-sw98.onrender.com/categoriassub";

/**
 * CategoryCollapse — Gerenciamento de Produtos em Listas por Categoria/Subcategoria
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

    // fetchProdutos — busca e popula produtos[categoriaOuSub]
    const fetchProdutos = async (categoriaOuSub) => {
        console.log("Buscando produtos para:", categoriaOuSub);

        if (produtos[categoriaOuSub]) {
            console.log(`Produtos de ${categoriaOuSub} já carregados, ignorando requisição.`);
            return;
        }

        setLoading(categoriaOuSub, true);
        try {
            // Usando o novo endpoint sem paginação
            const res = await fetch(
                `https://restaurant-sw98.onrender.com/produtos-list/admin?categoria=${encodeURIComponent(categoriaOuSub)}`
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

    // remover produto com optimistic update + rollback (mantido)
    const removerProduto = async (id, categoriaNome) => {
        console.log("Remover pedido:", id, "categoria:", categoriaNome);
        // ... (lógica de remoção)
        const prev = produtos[categoriaNome] || [];
        const nextList = prev.filter((p) => p.ID !== id);
        setProdutos((prevMap) => ({ ...prevMap, [categoriaNome]: nextList }));
        setLoading(`removendo_${id}`, true);

        try {
            const res = await fetch(`${API_PRODUTOS}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Erro ao remover");
            message.success("Produto removido");
        } catch (err) {
            setProdutos((prevMap) => ({ ...prevMap, [categoriaNome]: prev }));
            message.error("Erro ao remover produto");
        } finally {
            setLoading(`removendo_${id}`, false);
        }
    };

    // **********************************************
    // NOVA FUNÇÃO: Alternar Status Ativo
    // **********************************************
    const toggleActiveStatus = async (produto, categoriaNome) => {
        const id = produto.ID;
        const newActiveStatus = !produto.Active;
        const toggleKey = `toggle_active_${id}`;

        console.log(`Alterando status do produto ${id} para Active: ${newActiveStatus}`);

        // 1. Atualização Otimista
        const prevList = produtos[categoriaNome] || [];
        const prevProduto = produto;
        const updatedList = prevList.map(p => 
            p.ID === id ? { ...p, Active: newActiveStatus } : p
        );
        
        setProdutos(prevMap => ({ ...prevMap, [categoriaNome]: updatedList }));
        setLoading(toggleKey, true);

        try {
            // 2. Chamada PUT para atualizar apenas o status 'Active'
            const res = await fetch(`${API_PRODUTOS}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Active: newActiveStatus }),
            });
            
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Erro ao alternar status");
            }
            
            message.success(`Produto ${newActiveStatus ? 'ativado' : 'inativado'} com sucesso!`);

        } catch (err) {
            console.error("Erro ao alternar status:", err);
            message.error("Erro ao salvar status do produto. Revertendo...");
            
            // 3. Rollback
            setProdutos(prevMap => ({ 
                ...prevMap, 
                [categoriaNome]: prevList.map(p => p.ID === id ? prevProduto : p)
            }));
        } finally {
            setLoading(toggleKey, false);
        }
    };
    // **********************************************


    // salvar produto (PUT) — (mantido)
    const salvarProduto = async (values) => {
        if (!editando) return;
        const id = editando.ID;
        const savingKey = `salvando_${id}`;
        setLoading(savingKey, true);
        // ... (lógica de salvamento)
        const payload = {
            ...editando,
            Nome: values.Nome,
            Descricao: values.Descricao,
            Preco: values.Preco !== undefined ? Number(values.Preco) : null,
            PrecoPromocional: values.PrecoPromocional !== undefined ? Number(values.PrecoPromocional) : null,
            Imagem: values.ImagemURL || "",
            CategoriaID: values.CategoriaID || editando.CategoriaID || (editando.Categoria ? editando.Categoria.ID : undefined),
        };
        const prevMap = { ...produtos };
        let oldCategoriaNome = editando.__categoriaNome || (editando.Categoria && editando.Categoria.Nome) || undefined;
        try {
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
            const newCategoriaNome = (updated.Categoria && updated.Categoria.Nome) || 
                (function infer() {
                    const c = categorias.find((c) => c.ID === payload.CategoriaID);
                    return c ? c.Nome : undefined;
                })() || "Sem categoria";
            setProdutos((prevMap) => {
                const next = { ...prevMap };
                if (oldCategoriaNome && Array.isArray(next[oldCategoriaNome])) {
                    next[oldCategoriaNome] = next[oldCategoriaNome].filter((p) => p.ID !== id);
                } else {
                    Object.entries(next).forEach(([k, lista]) => {
                        next[k] = lista.filter((p) => p.ID !== id);
                    });
                }
                next[newCategoriaNome] = [updated, ...(next[newCategoriaNome] || [])];
                return next;
            });
            setModalVisible(false);
            setEditando(null);
        } catch (err) {
            message.error("Erro ao salvar produto");
            setProdutos(prevMap);
        } finally {
            setLoading(savingKey, false);
        }
    };


    // UI Helper — exibe cartão de produto com preço/promo
    function ProductCard({ p, categoriaNome, loadingMap, abrirModalParaEditar, removerProduto, toggleActiveStatus }) {
        const preco = p.Preco != null ? Number(p.Preco).toFixed(2) : null;
        const promo = p.PrecoPromocional != null && p.PrecoPromocional !== "" ? Number(p.PrecoPromocional).toFixed(2) : null;
        const isActive = p.Active !== false; // Considera Active: null ou true como ativo
        const toggleKey = `toggle_active_${p.ID}`;

        return (
            <Card 
                bordered 
                hoverable 
                style={{ width: "100%" }}
                bodyStyle={{ padding: 12 }} 
            >
                <Row gutter={16} align="middle">
                    {/* Coluna da Imagem */}
                    <Col>
                        {p.Imagem || p.ImagemURL ? (
                            <Image 
                                src={p.Imagem || p.ImagemURL} 
                                width={64}
                                height={64} 
                                style={{ objectFit: "cover", borderRadius: 4 }} 
                            />
                        ) : (
                            <div style={{ width: 64, height: 64, background: "#fafafa", borderRadius: 4 }} />
                        )}
                    </Col>

                    {/* Coluna da Informação (Nome, Descrição, Preços) */}
                    <Col flex="auto">
                        <Title level={5} style={{ margin: 0, marginBottom: 2 }}>{p.Nome}</Title>
                        <Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
                            {p.Descricao && p.Descricao.length > 80 ? p.Descricao.substring(0, 80) + '...' : p.Descricao}
                        </Text>

                        <Space size="small" align="center">
                            {promo ? (
                                <>
                                    <Text delete>R$ {preco}</Text>
                                    <Tag color="red" style={{ fontWeight: 700 }}>R$ {promo}</Tag>
                                </>
                            ) : (
                                <Text strong>R$ {preco ?? "—"}</Text>
                            )}
                            {/* Tag de status */}
                            <Tag color={isActive ? "green" : "default"}>{isActive ? 'ATIVO' : 'INATIVO'}</Tag>
                        </Space>
                    </Col>

                    {/* Coluna das Ações */}
                    <Col>
                        <Space direction="vertical" size={4} style={{ minWidth: 80 }}>
                            {/* Botão de Olho (Ativar/Inativar) */}
                            <Button
                                icon={isActive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                onClick={() => toggleActiveStatus(p, categoriaNome)}
                                loading={Boolean(loadingMap[toggleKey])}
                                size="small"
                                type={isActive ? 'default' : 'primary'}
                                title={isActive ? 'Inativar Produto' : 'Ativar Produto'}
                            >
                                {isActive ? 'Inativar' : 'Ativar'}
                            </Button>
                            
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => abrirModalParaEditar(p, categoriaNome)}
                                disabled={Boolean(loadingMap[`salvando_${p.ID}`])}
                                size="small"
                            >
                                Editar
                            </Button>
                            <Popconfirm
                                title="Remover este produto permanentemente?"
                                onConfirm={() => removerProduto(p.ID, categoriaNome)}
                                okText="Sim"
                                cancelText="Não"
                            >
                                <Button 
                                    danger 
                                    icon={<DeleteOutlined />} 
                                    loading={Boolean(loadingMap[`removendo_${p.ID}`])}
                                    size="small"
                                >
                                    Remover
                                </Button>
                            </Popconfirm>
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
                    <Title level={4} style={{ margin: 0 }}>Gerenciamento de Produtos</Title>
                </Col>
                <Col>
                    <Space>
                        <Button icon={<ReloadOutlined />} onClick={() => {
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
                    if (!key) return;
                    const nomeCat = Array.isArray(key) ? key[0] : key;
                    const catSelecionada = categorias.find((c) => c.Nome === nomeCat);
                    if (!catSelecionada) return;
                    const temSub =
                        catSelecionada.Subcategorias &&
                        !(
                            catSelecionada.Subcategorias.length === 1 &&
                            catSelecionada.Subcategorias[0].Nome === "Sem subcategoria"
                        );
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

                    return (
                        <Panel header={`${cat.Nome} (${cat.Subcategorias.length} subcategorias)`} key={cat.Nome}>
                            {temSub ? (
                                <Collapse
                                    accordion
                                    onChange={(key) => {
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
                                                    dataSource={produtos[sub.Nome]}
                                                    renderItem={(item) => (
                                                        <List.Item style={{ padding: 0, border: 'none', marginBottom: 8 }}>
                                                            <ProductCard 
                                                                p={item} 
                                                                categoriaNome={sub.Nome}
                                                                loadingMap={loadingMap}
                                                                abrirModalParaEditar={abrirModalParaEditar}
                                                                removerProduto={removerProduto}
                                                                toggleActiveStatus={toggleActiveStatus} // Passa a nova função
                                                            />
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
                                    dataSource={produtos[cat.Nome]}
                                    renderItem={(p) => (
                                        <List.Item style={{ padding: 0, border: 'none', marginBottom: 8 }}>
                                            <ProductCard 
                                                p={p} 
                                                categoriaNome={cat.Nome}
                                                loadingMap={loadingMap}
                                                abrirModalParaEditar={abrirModalParaEditar}
                                                removerProduto={removerProduto}
                                                toggleActiveStatus={toggleActiveStatus} // Passa a nova função
                                            />
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

            {/* Modal de edição (mantido) */}
            <Modal
                title={editando ? `Editar Produto: ${editando.Nome}` : "Editar Produto"}
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
                                <InputNumber style={{ width: "100%" }} min={0} step={0.01} precision={2} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="PrecoPromocional" label="Preço Promocional">
                                <InputNumber style={{ width: "100%" }} min={0} step={0.01} precision={2} />
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