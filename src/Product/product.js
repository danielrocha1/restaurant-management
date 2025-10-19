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
    EyeOutlined, 
    EyeInvisibleOutlined 
} from "@ant-design/icons";

const { Panel } = Collapse;
const { Title, Text } = Typography;
const API_PRODUTOS = "https://restaurant-sw98.onrender.com/produtos";
const API_CATEGORIAS = "https://restaurant-sw98.onrender.com/categoriassub";

export default function CategoryCollapse() {
    const [categorias, setCategorias] = useState([]);
    const [produtos, setProdutos] = useState({});
    const [loadingMap, setLoadingMap] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [editando, setEditando] = useState(null);
    const [subcategoriasOptions, setSubcategoriasOptions] = useState([]);

    const [form] = Form.useForm();

    const setLoading = (key, value) => {
        setLoadingMap((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        fetch(API_CATEGORIAS)
            .then((res) => res.json())
            .then((data) => setCategorias(Array.isArray(data) ? data : []))
            .catch(() => message.error("Erro ao buscar categorias"));
    }, []);

    useEffect(() => {
        console.log("Categorias e Subcategorias encontradas:");
        categorias.forEach((cat, i) => {
            console.log(`${i + 1}. Categoria: ${cat.Nome}`);
            cat.Subcategorias.forEach((sub, j) => {
                console.log(`   ${i + 1}.${j + 1} Subcategoria: ${sub.Nome}`);
            });
        });
    }, [categorias]);

    const fetchProdutos = async (categoriaOuSub) => {
        if (produtos[categoriaOuSub]) return;
        setLoading(categoriaOuSub, true);
        try {
            const res = await fetch(
                `https://restaurant-sw98.onrender.com/produtos-list/admin?categoria=${encodeURIComponent(categoriaOuSub)}`
            );
            if (!res.ok) throw new Error("Resposta não OK");
            const data = await res.json();
            setProdutos((prev) => ({ ...prev, [categoriaOuSub]: Array.isArray(data.data) ? data.data : [] }));
        } catch {
            message.error(`Erro ao buscar produtos de ${categoriaOuSub}`);
        } finally {
            setLoading(categoriaOuSub, false);
        }
    };

    const abrirModalParaEditar = (produto, categoriaNome) => {
        setEditando({ ...produto, __categoriaNome: categoriaNome });
        const categoria = categorias.find((c) => c.ID === produto.CategoriaID) || categorias.find((c) => c.Nome === categoriaNome);
        setSubcategoriasOptions(categoria?.Subcategorias || []);
        form.setFieldsValue({
            Nome: produto.Nome || "",
            Descricao: produto.Descricao || "",
            Preco: produto.Preco != null ? Number(produto.Preco) / 100 : undefined,
            PrecoPromocional: produto.PrecoPromocional ? Number(produto.PrecoPromocional) / 100 : undefined,
            ImagemURL: produto.Imagem || produto.ImagemURL || "",
            CategoriaNome: categoria?.Nome || undefined,
            SubcategoriaNome: produto.SubcategoriaNome || categoria?.Subcategorias[0]?.Nome,
        });
        setModalVisible(true);
    };

    const removerProduto = async (id, categoriaNome) => {
        const prev = produtos[categoriaNome] || [];
        setProdutos((prevMap) => ({ ...prevMap, [categoriaNome]: prev.filter((p) => p.ID !== id) }));
        setLoading(`removendo_${id}`, true);

        try {
            const res = await fetch(`${API_PRODUTOS}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Erro ao remover");
            message.success("Produto removido");
        } catch {
            setProdutos((prevMap) => ({ ...prevMap, [categoriaNome]: prev }));
            message.error("Erro ao remover produto");
        } finally {
            setLoading(`removendo_${id}`, false);
        }
    };

    const toggleActiveStatus = async (produto, categoriaNome) => {
        const id = produto.ID;
        const newActiveStatus = !produto.Active;
        const toggleKey = `toggle_active_${id}`;
        const prevList = produtos[categoriaNome] || [];
        const prevProduto = produto;
        setProdutos(prevMap => ({ ...prevMap, [categoriaNome]: prevList.map(p => p.ID === id ? { ...p, Active: newActiveStatus } : p) }));
        setLoading(toggleKey, true);

        try {
            const res = await fetch(`${API_PRODUTOS}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ Active: newActiveStatus }),
            });
            if (!res.ok) throw new Error("Erro ao alternar status");
            message.success(`Produto ${newActiveStatus ? 'ativado' : 'inativado'} com sucesso!`);
        } catch {
            message.error("Erro ao salvar status do produto. Revertendo...");
            setProdutos(prevMap => ({ ...prevMap, [categoriaNome]: prevList.map(p => p.ID === id ? prevProduto : p) }));
        } finally {
            setLoading(toggleKey, false);
        }
    };

    const salvarProduto = async (values) => {
    if (!editando) return;

    const savingKey = `salvando_${editando.ID}`;
    setLoading(savingKey, true);

    try {
        // Encontrar categoria e subcategoria selecionadas
        const categoriaSelecionada = categorias.find(c => c.Nome === values.CategoriaNome);
        const subSelecionada = categoriaSelecionada?.Subcategorias.find(
            s => s.Nome === values.SubcategoriaNome
        );

        // Payload correto: só enviar IDs
        const payload = {
            Nome: values.Nome,
            Descricao: values.Descricao,
            Preco: values.Preco != null ? Number(values.Preco * 100) : 0,
            PrecoPromocional: values.PrecoPromocional != null ? Number(values.PrecoPromocional * 100) : 0,
            Imagem: values.ImagemURL || "",
            CategoriaID: categoriaSelecionada?.ID,
            SubcategoriaID: subSelecionada?.ID || null, // ✅ só o ID
            Active: editando.Active
        };

        const res = await fetch(`${API_PRODUTOS}/${editando.ID}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Erro ao atualizar produto");
        }

        const updated = await res.json();
        message.success("Produto atualizado com sucesso!");

        // Atualiza lista local
        setProdutos(prevMap => {
            const newMap = { ...prevMap };
            // Remove antigo
            Object.keys(newMap).forEach(catName => {
                newMap[catName] = newMap[catName].filter(p => p.ID !== updated.ID);
            });

            const catName = categoriaSelecionada?.Nome || "Sem categoria";
            if (!newMap[catName]) newMap[catName] = [];
            newMap[catName].push(updated);

            return newMap;
        });

        setModalVisible(false);
        setEditando(null);

    } catch (err) {
        console.error("Falha ao atualizar produto:", err);
        message.error("Erro ao atualizar produto");
    } finally {
        setLoading(savingKey, false);
    }
};

    function ProductCard({ p, categoriaNome }) {
        const preco = p.Preco != null ? (p.Preco / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : null;
        const promo = p.PrecoPromocional != null ? (p.PrecoPromocional / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : null;
        const isActive = p.Active !== false;
        const toggleKey = `toggle_active_${p.ID}`;

        return (
            <Card bordered hoverable style={{ width: "100%" }} bodyStyle={{ padding: 12 }}>
                <Row gutter={16} align="middle">
                    <Col>
                        {p.Imagem || p.ImagemURL ? (
                            <Image src={p.Imagem || p.ImagemURL} width={64} height={64} style={{ objectFit: "cover", borderRadius: 4 }} />
                        ) : (
                            <div style={{ width: 64, height: 64, background: "#fafafa", borderRadius: 4 }} />
                        )}
                    </Col>
                    <Col flex="auto">
                        <Title level={5} style={{ margin: 0, marginBottom: 2 }}>{p.Nome}</Title>
                        <Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 4 }}>
                            {p.Descricao && p.Descricao.length > 80 ? p.Descricao.substring(0, 80) + '...' : p.Descricao}
                        </Text>
                        <Space size="small" align="center">
                            {promo && promo !== "R$ 0,00" ? (
                                <>
                                    <Text delete>{preco}</Text>
                                    <Tag color="red" style={{ fontWeight: 700 }}>{promo}</Tag>
                                </>
                            ) : (
                                <Text strong>{preco ?? "—"}</Text>
                            )}
                            <Tag color={isActive ? "green" : "default"}>{isActive ? 'ATIVO' : 'INATIVO'}</Tag>
                        </Space>
                    </Col>
                    <Col>
                        <Space direction="vertical" size={4} style={{ minWidth: 80 }}>
                            <Button icon={isActive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                onClick={() => toggleActiveStatus(p, categoriaNome)}
                                loading={Boolean(loadingMap[toggleKey])}
                                size="small"
                                type={isActive ? 'default' : 'primary'}
                                title={isActive ? 'Inativar Produto' : 'Ativar Produto'}>
                                {isActive ? 'Inativar' : 'Ativar'}
                            </Button>
                            <Button icon={<EditOutlined />}
                                onClick={() => abrirModalParaEditar(p, categoriaNome)}
                                disabled={Boolean(loadingMap[`salvando_${p.ID}`])}
                                size="small">
                                Editar
                            </Button>
                            <Popconfirm
                                title="Remover este produto permanentemente?"
                                onConfirm={() => removerProduto(p.ID, categoriaNome)}
                                okText="Sim"
                                cancelText="Não">
                                <Button danger icon={<DeleteOutlined />} loading={Boolean(loadingMap[`removendo_${p.ID}`])} size="small">
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
                                .then((d) => setCategorias(Array.isArray(d) ? d : []))
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
                    const temSub = catSelecionada.Subcategorias &&
                        !(catSelecionada.Subcategorias.length === 1 && catSelecionada.Subcategorias[0].Nome === "Sem subcategoria");
                    if (!temSub) {
                        fetchProdutos(catSelecionada.Nome);
                    }
                }}
            >
                {categorias.map((cat) => {
                    const temSub = cat.Subcategorias &&
                        !(cat.Subcategorias.length === 1 && cat.Subcategorias[0].Nome === "Sem subcategoria");

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
                                    renderItem={(item) => (
                                        <List.Item style={{ padding: 0, border: 'none', marginBottom: 8 }}>
                                            <ProductCard
                                                p={item}
                                                categoriaNome={cat.Nome}
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

            <Modal
                title="Editar Produto"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                onOk={() => form.submit()}
                okText="Salvar"
                cancelText="Cancelar"
            >
                <Form form={form} layout="vertical" onFinish={salvarProduto}>
                    <Form.Item name="Nome" label="Nome" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="Descricao" label="Descrição">
                        <Input.TextArea />
                    </Form.Item>
                    <Row gutter={8}>
                        <Col span={12}>
                            <Form.Item name="Preco" label="Preço" rules={[{ required: true }]}>
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
                        name="CategoriaNome"
                        label="Categoria"
                        rules={[{ required: true }]}
                    >
                        <Select
                            placeholder="Selecione uma categoria"
                            onChange={(catNome) => {
                                const cat = categorias.find((c) => c.Nome === catNome);
                                if (cat) {
                                    setSubcategoriasOptions(cat.Subcategorias);
                                    form.setFieldsValue({
                                        SubcategoriaNome: cat.Subcategorias[0]?.Nome || null,
                                    });
                                } else {
                                    setSubcategoriasOptions([]);
                                    form.setFieldsValue({ SubcategoriaNome: null });
                                }
                            }}
                        >
                            {categorias.map((c) => (
                                <Select.Option key={c.Nome} value={c.Nome}>
                                    {c.Nome}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="SubcategoriaNome"
                        label="Subcategoria"
                        rules={[{ required: true }]}
                    >
                        <Select placeholder="Selecione uma subcategoria">
                            {subcategoriasOptions.map((sc) => (
                                <Select.Option key={sc.Nome} value={sc.Nome}>
                                    {sc.Nome}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
