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
    Alert, // Importado para melhor feedback visual
} from "antd";
import {
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    SaveOutlined, // Novo ícone de salvar
} from "@ant-design/icons";

const { Panel } = Collapse;
const { Title, Text } = Typography;
const API_PRODUTOS = "https://restaurant-sw98.onrender.com/produtos";
const API_CATEGORIAS = "https://restaurant-sw98.onrender.com/categoriassub";

// Estilos para modernização (Cores e Sombra)
const cardStyle = {
    width: "100%",
    // Adicionando sombra suave para um visual mais moderno
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    borderRadius: 8,
};

const imageStyle = {
    objectFit: "cover",
    borderRadius: 4,
    border: "1px solid #f0f0f0", // Borda leve na imagem
};

export default function CategoryCollapse() {
    const [categorias, setCategorias] = useState([]);
    const [produtos, setProdutos] = useState({});
    const [loadingMap, setLoadingMap] = useState({});
    const [modalVisible, setModalVisible] = useState(false);
    const [editando, setEditando] = useState(null);
    const [subcategoriasOptions, setSubcategoriasOptions] = useState([]);
    // Estado para controle do loading de salvar, para o Modal
    const [isSaving, setIsSaving] = useState(false);

    const [form] = Form.useForm();

    const setLoading = (key, value) => {
        setLoadingMap((prev) => ({ ...prev, [key]: value }));
    };

    // Função para buscar categorias (mantida)
    useEffect(() => {
        fetch(API_CATEGORIAS)
            .then((res) => res.json())
            .then((data) => setCategorias(Array.isArray(data) ? data : []))
            .catch(() => message.error("Erro ao buscar categorias"));
    }, []);
    
    // Removendo o console.log grande que estava aqui para manter o código limpo
    /*
    useEffect(() => {
        console.log("Categorias e Subcategorias encontradas:");
        categorias.forEach((cat, i) => {
            console.log(`${i + 1}. Categoria: ${cat.Nome}`);
            cat.Subcategorias.forEach((sub, j) => {
                console.log(`   ${i + 1}.${j + 1} Subcategoria: ${sub.Nome}`);
            });
        });
    }, [categorias]);
    */

    // Função para buscar produtos (mantida)
    const fetchProdutos = async (categoriaOuSub) => {
        // Se já tiver produtos carregados, não recarrega (opcional: pode querer forçar recarga)
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
        
        // Determina a categoria/subcategoria para preencher o formulário
        const categoria = categorias.find((c) => c.ID === produto.CategoriaID) || categorias.find((c) => c.Subcategorias.some(sub => sub.Nome === produto.SubcategoriaNome));
        
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
            message.success("Produto removido com sucesso! 🎉");
        } catch {
            setProdutos((prevMap) => ({ ...prevMap, [categoriaNome]: prev }));
            message.error("Erro ao remover produto 😔");
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
            message.error("Erro ao salvar status do produto. Revertendo... 😞");
            setProdutos(prevMap => ({ ...prevMap, [categoriaNome]: prevList.map(p => p.ID === id ? prevProduto : p) }));
        } finally {
            setLoading(toggleKey, false);
        }
    };

    const salvarProduto = async (values) => {
        if (!editando) return;

        // Ativa o loading do botão salvar no Modal (animação principal)
        setIsSaving(true); 

        try {
            const categoriaSelecionada = categorias.find(c => c.Nome === values.CategoriaNome);
            const subSelecionada = categoriaSelecionada?.Subcategorias.find(
                s => s.Nome === values.SubcategoriaNome
            );

            // Payload correto
            const payload = {
                Nome: values.Nome,
                Descricao: values.Descricao,
                // Garantindo que Preço e PreçoPromocional sejam 0 se null
                Preco: values.Preco != null ? Math.round(Number(values.Preco * 100)) : 0, 
                PrecoPromocional: values.PrecoPromocional != null ? Math.round(Number(values.PrecoPromocional * 100)) : 0, 
                Imagem: values.ImagemURL || "",
                SubcategoriaID: subSelecionada?.ID || null,
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
            message.success("Produto atualizado com sucesso! ✨");

            // Atualiza lista local
            setProdutos(prevMap => {
                const newMap = { ...prevMap };
                // 1. Remove antigo de todas as listas
                Object.keys(newMap).forEach(catName => {
                    newMap[catName] = newMap[catName].filter(p => p.ID !== updated.ID);
                });

                // 2. Adiciona na nova lista correta (Nome da Subcategoria ou Nome da Categoria)
                // Se o produto tem SubcategoriaID, ele deve ir para a lista da Subcategoria.
                // Se não tiver, vai para a lista da Categoria.
                const targetCatName = subSelecionada ? subSelecionada.Nome : categoriaSelecionada.Nome;
                
                if (!newMap[targetCatName]) newMap[targetCatName] = [];
                
                // Garantir que não duplique (embora o filter acima já ajude)
                if (!newMap[targetCatName].some(p => p.ID === updated.ID)) {
                     newMap[targetCatName].push(updated);
                }

                return newMap;
            });

            setModalVisible(false);
            setEditando(null);

        } catch (err) {
            console.error("Falha ao atualizar produto:", err);
            message.error("Erro ao atualizar produto. Tente novamente. 😥");
        } finally {
            // Desativa o loading do botão salvar no Modal
            setIsSaving(false); 
        }
    };

    function ProductCard({ p, categoriaNome }) {
        const preco = p.Preco != null ? (p.Preco / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : null;
        const promo = p.PrecoPromocional != null ? (p.PrecoPromocional / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : null;
        const isActive = p.Active !== false;
        const toggleKey = `toggle_active_${p.ID}`;

        return (
            // Uso do estilo moderno com sombra
            <Card bordered hoverable style={cardStyle} bodyStyle={{ padding: 16 }}> 
                <Row gutter={16} align="middle">
                    <Col>
                        {p.Imagem || p.ImagemURL ? (
                            <Image src={p.Imagem || p.ImagemURL} width={64} height={64} style={imageStyle} fallback="https://via.placeholder.com/64" />
                        ) : (
                            <div style={{ width: 64, height: 64, background: "#f5f5f5", borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Text type="secondary" style={{ fontSize: 10, textAlign: 'center' }}>Sem Imagem</Text>
                            </div>
                        )}
                    </Col>
                    <Col flex="auto">
                        <Title level={5} style={{ margin: 0, marginBottom: 4, color: '#1890ff' }}>{p.Nome}</Title>
                        <Text type="secondary" style={{ display: "block", fontSize: 12, marginBottom: 6, lineHeight: 1.4 }}>
                            {p.Descricao && p.Descricao.length > 80 ? p.Descricao.substring(0, 80) + '...' : p.Descricao || 'Sem descrição.'}
                        </Text>
                        <Space size="small" align="center" style={{ marginTop: 4 }}>
                            {promo && promo !== "R$ 0,00" && p.PrecoPromocional > 0 ? (
                                <>
                                    <Text delete type="danger">{preco}</Text>
                                    <Tag color="volcano" style={{ fontWeight: 700, fontSize: 13, padding: '4px 8px' }}>{promo}</Tag>
                                </>
                            ) : (
                                <Text strong style={{ fontSize: 14 }}>{preco ?? "—"}</Text>
                            )}
                            {/* Tags com cores */}
                            <Tag color={isActive ? "green" : "red"} style={{ marginLeft: 8 }}>{isActive ? 'ATIVO' : 'INATIVO'}</Tag>
                            {p.PrecoPromocional > 0 && <Tag color="gold">PROMO</Tag>}
                        </Space>
                    </Col>
                    <Col>
                        <Space direction="vertical" size={6} style={{ minWidth: 80 }}>
                            {/* Botão de Ativar/Inativar com cores mais expressivas */}
                            <Button icon={isActive ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                onClick={() => toggleActiveStatus(p, categoriaNome)}
                                loading={Boolean(loadingMap[toggleKey])}
                                size="small"
                                type={isActive ? 'default' : 'primary'}
                                title={isActive ? 'Inativar Produto' : 'Ativar Produto'}
                                style={{ width: '100%', borderColor: isActive ? undefined : '#52c41a', color: isActive ? undefined : '#52c41a' }}>
                                {isActive ? 'Inativar' : 'Ativar'}
                            </Button>
                            {/* Botão de Editar */}
                            <Button icon={<EditOutlined />}
                                onClick={() => abrirModalParaEditar(p, categoriaNome)}
                                disabled={isSaving || Boolean(loadingMap[`removendo_${p.ID}`])} // Desabilita edição enquanto salva/remove outro
                                size="small"
                                style={{ width: '100%' }}>
                                Editar
                            </Button>
                            {/* Botão de Remover */}
                            <Popconfirm
                                title="Tem certeza que deseja remover este produto permanentemente?"
                                onConfirm={() => removerProduto(p.ID, categoriaNome)}
                                okText="Sim"
                                cancelText="Não"
                                placement="leftTop">
                                <Button danger icon={<DeleteOutlined />} loading={Boolean(loadingMap[`removendo_${p.ID}`])} size="small" style={{ width: '100%' }}>
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
        <div style={{ padding: 20, background: '#f0f2f5', minHeight: '100vh' }}>
            <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
                <Col>
                    <Title level={3} style={{ margin: 0, color: '#363', marginBottom:"10px" }}>📦 Gerenciamento de Produtos</Title>
                    <Text type="primary">Edite, ative ou remova produtos por categoria e subcategoria.</Text>
                </Col>
                <Col>
                    <Button icon={<ReloadOutlined />} 
                        onClick={() => {
                            setProdutos({});
                            setCategorias([]);
                            fetch(API_CATEGORIAS)
                                .then((r) => r.json())
                                .then((d) => setCategorias(Array.isArray(d) ? d : []))
                                .catch(() => message.error("Erro ao recarregar categorias"));
                        }} 
                        type="default">
                        Recarregar Tudo
                    </Button>
                </Col>
            </Row>

            <Collapse
                accordion
                expandIconPosition="right"
                style={{ borderRadius: 8, overflow: 'hidden' }}
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
                        <Panel 
                            header={<Text strong style={{ color: '#1890ff' }}>{`${cat.Nome} (${cat.Subcategorias.length} subcategorias)`}</Text>} 
                            key={cat.Nome}
                            style={{ background: '#fff' }}
                        >
                            {temSub ? (
                                <Collapse
                                    accordion
                                    bordered={false}
                                    style={{ background: '#fafafa' }}
                                    onChange={(key) => {
                                        if (!key) return;
                                        const nomeSub = Array.isArray(key) ? key[0] : key;
                                        fetchProdutos(nomeSub);
                                    }}
                                >
                                    {cat.Subcategorias.map((sub) => (
                                        <Panel header={<Text style={{ color: '#595959' }}>{sub.Nome}</Text>} key={sub.Nome}>
                                            {loadingMap[sub.Nome] ? (
                                                <div style={{ textAlign: "center", padding: 32 }}><Spin size="large" /></div>
                                            ) : produtos[sub.Nome] && produtos[sub.Nome].length > 0 ? (
                                                <List
                                                    dataSource={produtos[sub.Nome]}
                                                    renderItem={(item) => (
                                                        <List.Item style={{ padding: 0, border: 'none', marginBottom: 12 }}>
                                                            <ProductCard p={item} categoriaNome={sub.Nome} />
                                                        </List.Item>
                                                    )}
                                                />
                                            ) : produtos[sub.Nome] && produtos[sub.Nome].length === 0 ? (
                                                <Alert message="Nenhum produto encontrado nesta subcategoria." type="warning" showIcon />
                                            ) : (
                                                <Alert message="Clique para carregar os produtos desta subcategoria." type="info" showIcon />
                                            )}
                                        </Panel>
                                    ))}
                                </Collapse>
                            ) : loadingMap[cat.Nome] ? (
                                <div style={{ textAlign: "center", padding: 32 }}><Spin size="large" /></div>
                            ) : produtos[cat.Nome] && produtos[cat.Nome].length > 0 ? (
                                <List
                                    dataSource={produtos[cat.Nome]}
                                    renderItem={(item) => (
                                        <List.Item style={{ padding: 0, border: 'none', marginBottom: 12 }}>
                                            <ProductCard p={item} categoriaNome={cat.Nome} />
                                        </List.Item>
                                    )}
                                />
                            ) : produtos[cat.Nome] && produtos[cat.Nome].length === 0 ? (
                                <Alert message="Nenhum produto encontrado nesta categoria." type="warning" showIcon />
                            ) : (
                                <Alert message="Clique para carregar os produtos desta categoria." type="info" showIcon />
                            )}
                        </Panel>
                    );
                })}
            </Collapse>

            {/* Modal de Edição (Estilo moderno com animação de loading ao salvar) */}
            <Modal
                title={<Title level={4} style={{ margin: 0, color: '#1890ff' }}>✏️ Editar Produto: {editando?.Nome}</Title>}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                // NÃO usamos onOk padrão, pois usamos o footer customizado para controlar o loading
                footer={[
                    <Button key="back" onClick={() => setModalVisible(false)} disabled={isSaving}>
                        Cancelar
                    </Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        loading={isSaving} // Ativa a animação de loading ao salvar
                        icon={isSaving ? null : <SaveOutlined />} // Ícone de salvar se não estiver em loading
                        onClick={() => form.submit()} // Envia o formulário
                        style={{ background: '#52c41a', borderColor: '#52c41a' }} // Cor verde para salvar
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>,
                ]}
            >
                <div style={{ padding: '20px 0' }}>
                    <Form form={form} layout="vertical" onFinish={salvarProduto} disabled={isSaving}>
                        <Form.Item name="Nome" label="Nome do Produto" rules={[{ required: true, message: 'Por favor, insira o nome do produto!' }]}>
                            <Input placeholder="Ex: X-Salada Especial" />
                        </Form.Item>
                        <Form.Item name="Descricao" label="Descrição">
                            <Input.TextArea rows={3} placeholder="Descreva brevemente o produto..." />
                        </Form.Item>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="Preco" label="Preço (R$)" rules={[{ required: true, message: 'Insira o preço' }]}>
                                    <InputNumber
                                        style={{ width: "100%" }}
                                        min={0}
                                        step={0.01}
                                        formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/R\$\s?|(,*)/g, '')}
                                        placeholder="0.00"
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="PrecoPromocional" label="Preço Promocional (R$)">
                                    <InputNumber
                                        style={{ width: "100%" }}
                                        min={0}
                                        step={0.01}
                                        formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/R\$\s?|(,*)/g, '')}
                                        placeholder="0.00 (opcional)"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item name="ImagemURL" label="URL da Imagem">
                            <Input placeholder="Ex: https://seusite.com/imagem.jpg" />
                        </Form.Item>
                        
                        {/* Preview da Imagem */}
                        {form.getFieldValue('ImagemURL') && (
                            <Form.Item>
                                <Text strong>Pré-visualização da Imagem:</Text>
                                <Image 
                                    src={form.getFieldValue('ImagemURL')} 
                                    width={100} 
                                    height={100} 
                                    style={{ ...imageStyle, marginTop: 8 }} 
                                    fallback="https://via.placeholder.com/100" 
                                />
                            </Form.Item>
                        )}

                        <Form.Item
                            name="CategoriaNome"
                            label="Categoria Principal"
                            rules={[{ required: true, message: 'Selecione a categoria' }]}
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
                            rules={[{ required: true, message: 'Selecione a subcategoria' }]}
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
                </div>
            </Modal>
        </div>
    );
}