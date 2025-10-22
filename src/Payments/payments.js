import React, { useState, useEffect, useMemo } from "react";
import {
  DatePicker,
  Table,
  Card,
  Button,
  Tag,
  Space,
  Drawer,
  List,
  Image,
  Descriptions,
  Statistic,
  Row,
  Col,
  Divider,
  Collapse,
  Spin,
  Layout, 
  Alert, 
  Empty, 
} from "antd";
import {
  TableOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { motion, AnimatePresence } from "framer-motion";

const { Content } = Layout;

// Formatação de moeda (BRL)
const currencyFormatter = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Conversor robusto de valores do backend -> número em reais
const toReais = (raw) => {
  if (raw === null || raw === undefined) return 0;
  
  const s = String(raw).trim();
  if (s === "") return 0;

  // 1. Tratamento de strings que JÁ SÃO Reais (ex: "2.04" ou "369.96000...")
  if (s.includes(".") || s.includes(",")) {
      const f = parseFloat(s.replace(",", "."));
      return Number.isFinite(f) ? f : 0;
  }
  
  // 2. Tratamento de valores em CENTAVOS (inteiros, como 37200 ou "36996")
  let numericValue = Number(raw);

  if (!Number.isFinite(numericValue)) return 0;
  
  if (Number.isInteger(numericValue)) {
       return numericValue / 100;
  }
  
  return numericValue; 
};


// Configuração de animação para os Cards (framer-motion)
const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ClosedTablesPage() {
  const [date, setDate] = useState(dayjs());
  const [tables, setTables] = useState([]);
  const [view, setView] = useState("table");
  const [selectedTable, setSelectedTable] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorTables, setErrorTables] = useState(null);

  // Busca mesas fechadas
  useEffect(() => {
    const fetchClosedTables = async () => {
      setLoadingTables(true);
      setErrorTables(null);
      setTables([]);
      try {
        const res = await fetch(
          "https://restaurant-sw98.onrender.com/tables/viewcloseondate",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: date.format("YYYY-MM-DD") }),
          }
        );

        if (!res.ok) {
           throw new Error(`Erro de rede: ${res.statusText}`);
        }
        
        const data = await res.json();
        
        // Garante que 'data' é um array antes de mapear
        const safeData = Array.isArray(data) ? data : [];

        const formatted = safeData.map((t) => ({
          ...t,
          id: t.id || t.mesa_id + t.closed_at, 
          total_order_value: toReais(t.total_order_value),
        }));

        setTables(formatted);
      } catch (err) {
        console.error("Erro ao buscar mesas fechadas:", err);
        setErrorTables(`Não foi possível carregar as mesas para a data ${date.format("DD/MM/YYYY")}. Tente novamente.`);
      } finally {
        setLoadingTables(false);
      }
    };
    fetchClosedTables();
  }, [date]);

  // Função para buscar detalhes da mesa
  const fetchTableDetails = async (id) => {
    setLoadingDetails(true);
    setSelectedTable(null);
    setDrawerVisible(true); 

    try {
      const res = await fetch(`https://restaurant-sw98.onrender.com/tables/viewclose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: id }),
      });

      if (!res.ok) {
           throw new Error(`Erro de rede: ${res.statusText}`);
        }

      const data = await res.json();
      
      const safeData = Array.isArray(data) ? data : [];

      if (safeData.length === 0) {
        setLoadingDetails(false);
        setSelectedTable({ mesa_id: id, error: "Nenhum detalhe de transação retornado pelo servidor." });
        return;
      }

      // Lógica de consolidação de dados
      const consolidatedData = safeData.reduce((acc, currentOrder, index) => {
        const orderTotal = toReais(currentOrder.order_total);
        const totalTransaction = toReais(currentOrder.total_transaction);
        const changeDue = toReais(currentOrder.change_due);

        if (index === 0) {
          acc.mesa_id = currentOrder.mesa_id;
          acc.nome_loja = currentOrder.nome_loja;
          acc.transaction_id = currentOrder.transaction_id;
          acc.transaction_status = currentOrder.transaction_status;
          acc.total_transaction = totalTransaction;
          acc.change_due = changeDue;
          
          acc.payment_json = (currentOrder.payment_json || []).map(p => ({
              ...p,
              // Prioriza o campo mais confiável (centavos) para conversão
              value_reais: toReais(p.value_centavos ?? p.value ?? p.value_reais)
          })); 
          
          acc.qr_code = currentOrder.qr_code;
          acc.transaction_created_at = currentOrder.transaction_created_at;
          acc.transaction_updated_at = currentOrder.transaction_updated_at;
          acc.first_order_created_at = currentOrder.order_created_at;

          acc.total_orders_sum = 0;
          acc.all_orders = [];
        }

        acc.total_orders_sum += orderTotal;

        acc.all_orders.push({
          order_id: currentOrder.order_id,
          order_total: orderTotal,
          order_status: currentOrder.order_status,
          order_created_at: currentOrder.order_created_at,
          produtos: currentOrder.produtos || [],
        });

        return acc;
      }, {});
      
      setSelectedTable(consolidatedData);

    } catch (err) {
      console.error("Erro ao buscar detalhes da mesa:", err);
      setSelectedTable({ mesa_id: id, error: "Erro ao carregar detalhes da mesa. Verifique a conexão." });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Definição das colunas da tabela (useMemo para otimização)
  const columns = useMemo(() => [
    { title: "Mesa", dataIndex: "number", sorter: (a, b) => a.number - b.number, width: 80, fixed: 'left' },
    {
      title: "Abertura",
      dataIndex: "opened_at",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-"),
      sorter: (a, b) => dayjs(a.opened_at).unix() - dayjs(b.opened_at).unix(),
      width: 150,
    },
    {
      title: "Fechamento",
      dataIndex: "closed_at",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-"),
      sorter: (a, b) => dayjs(a.closed_at).unix() - dayjs(b.closed_at).unix(),
      width: 150,
    },
    {
      title: "Valor Total",
      dataIndex: "total_order_value",
      key: "total_order_value",
      render: (v) => <Tag color="blue" style={{ fontSize: '1em', padding: '4px 8px' }}>{currencyFormatter(v)}</Tag>,
      sorter: (a, b) => a.total_order_value - b.total_order_value,
      width: 120,
      align: 'right',
    },
    {
      title: "Status",
      dataIndex: "is_open",
      render: (v) => <Tag color={v ? "green" : "red"}>{v ? "Aberto" : "Fechado"}</Tag>,
      filters: [
        { text: "Aberto", value: true },
        { text: "Fechado", value: false },
      ],
      onFilter: (value, record) => record.is_open === value,
      width: 100,
    },
    {
      title: "Ações",
      render: (_, record) => (
        <Button
          onClick={() => fetchTableDetails(record.id)}
          loading={loadingDetails && selectedTable?.mesa_id === record.id}
          icon={<InfoCircleOutlined />}
          type="primary"
          ghost
          size="small"
        >
          Detalhes
        </Button>
      ),
      width: 100,
      fixed: 'right',
    },
  ], [loadingDetails, selectedTable?.mesa_id]);

  // Renderização do conteúdo do Drawer (detalhes)
  const renderDrawerDetails = () => {
    // 1. Loading
    if (loadingDetails) {
      return (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin size="large" tip="Buscando detalhes da transação..." indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
        </div>
      );
    }
    
    // 2. Erro ou Detalhes Indisponíveis
    if (!selectedTable || selectedTable.error) {
        return (
            <Alert
                message="Dados Indisponíveis"
                description={selectedTable?.error || "Nenhum detalhe da transação foi encontrado para esta mesa."}
                type="warning"
                showIcon
            />
        );
    }

    const table = selectedTable;
    
    // ********* LÓGICA DE PAGAMENTO REFACTORIZADA *********
    const allPayments = table.payment_json || [];

    // 1. Ordena os pagamentos pelo valor (do maior para o menor)
    const sortedPayments = [...allPayments].sort((a, b) => b.value_reais - a.value_reais);

    // Card de Pagamentos (Versão Simples e Ordenada)
    const paymentsCard = (
      <Card 
        title={<Space><DollarCircleOutlined style={{ color: '#52c41a' }}/> Detalhes dos Pagamentos</Space>} 
        bordered 
        style={{ marginBottom: 24 }} 
        hoverable
      >
        <List
            size="large"
            dataSource={sortedPayments}
            renderItem={(payment, index) => {
                const valueNumber = payment.value_reais;
                const label = payment.methodLabel || payment.method || "Método Não Identificado";
                // Cor e estilo para destacar o maior pagamento (o primeiro na lista ordenada)
                const isLargest = index === 0;

                return (
                    <List.Item style={{ padding: '8px 0', borderBottom: index < sortedPayments.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <Row justify="space-between" style={{ width: '100%' }} align="middle">
                            <Col style={{ fontWeight: isLargest ? 'bold' : 'normal', color: isLargest ? '#3f8600' : 'rgba(0, 0, 0, 0.85)' }}>
                                {isLargest && <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />}
                                {label}
                            </Col>
                            <Col>
                                <Tag 
                                    color={isLargest ? "green" : "blue"}
                                    style={{ 
                                        fontSize: isLargest ? '1.1em' : '1em', 
                                        padding: '4px 8px', 
                                        fontWeight: isLargest ? 'bold' : 'normal'
                                    }}
                                >
                                    {currencyFormatter(valueNumber)}
                                </Tag>
                            </Col>
                        </Row>
                    </List.Item>
                );
            }}
        >
             {/* Adiciona um item para o total de pagamentos */}
            <List.Item style={{ paddingTop: 16, borderTop: '2px solid #0000001a' }}>
                <Row justify="space-between" style={{ width: '100%' }} align="middle">
                    <Col style={{ fontWeight: 'bold', fontSize: '1.1em' }}>
                        Total Recebido
                    </Col>
                    <Col>
                        <Tag color="volcano" style={{ fontSize: '1.2em', padding: '6px 12px', fontWeight: 'bold' }}>
                            {currencyFormatter(table.total_transaction)}
                        </Tag>
                    </Col>
                </Row>
            </List.Item>
        </List>
      </Card>
    );
    // ********* FIM DA LÓGICA DE PAGAMENTO REFACTORIZADA *********

    // Card de Transação (Mantido)
    const transactionCard = table.transaction_id && (
      <Card title={<Space><InfoCircleOutlined style={{ color: '#faad14' }}/> Detalhes da Transação</Space>} bordered style={{ marginBottom: 24 }} hoverable>
        <Descriptions column={1} size="small" bordered layout="vertical">
          <Descriptions.Item label="ID da Transação">{table.transaction_id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={table.transaction_status === "completed" ? "success" : "error"} icon={table.transaction_status === "completed" ? <CheckCircleOutlined /> : <LoadingOutlined />}>
              {table.transaction_status || "N/A"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Criada em">{dayjs(table.transaction_created_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
          <Descriptions.Item label="Atualizada em">{dayjs(table.transaction_updated_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
        </Descriptions>
      </Card>
    );

    // Itens de Collapse para Pedidos (Mantido)
    const orderCollapseItems = table.all_orders.map((order, index) => {
      const orderTotal = parseFloat(order.order_total || 0);

      return {
        key: `order_${order.order_id}`,
        label: (
          <Row justify="space-between" align="middle" style={{ width: "100%" }}>
            <Col>
              <Space>
                <ShoppingCartOutlined style={{ color: '#1890ff' }}/>
                Pedido #{order.order_id} ({order.produtos?.length || 0} itens)
              </Space>
            </Col>
            <Col>
              <Tag color="blue" style={{ fontSize: '1em', padding: '4px 8px' }}>
                {currencyFormatter(orderTotal)}
              </Tag>
            </Col>
          </Row>
        ),
        children: (
          <List
            itemLayout="horizontal"
            dataSource={order.produtos || []}
            renderItem={(item) => {
              const unitReais = toReais(item.preco_unitario);
              const quantidade = item.quantidade || 0;
              const totalItem = unitReais * quantidade;

              return (
                <List.Item
                  style={{ padding: '10px 0' }}
                  actions={[<strong style={{ minWidth: 80, textAlign: 'right', display: 'block' }}>{currencyFormatter(totalItem)}</strong>]}
                >
                  <List.Item.Meta
                    avatar={
                      <Image 
                        width={60} 
                        height={60} 
                        style={{ borderRadius: 4, objectFit: 'cover' }}
                        src={item.imagem || "placeholder.jpg"} 
                        fallback="placeholder.jpg" 
                      />
                    }
                    title={
                      <div style={{ fontWeight: 600 }}>
                        {item.produto_nome} <Tag color="default">x{quantidade}</Tag>
                      </div>
                    }
                    description={`${currencyFormatter(unitReais)} (un.)`}
                  />
                </List.Item>
              );
            }}
          />
        ),
      };
    });
    

    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: "100%" }}
      >
        {/* Usamos Space direction="vertical" para garantir o empilhamento */}
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* Estatísticas de Resumo no topo */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ textAlign: 'center' }}>
                <Statistic
                  title="Total Pedidos"
                  value={table.total_orders_sum}
                  precision={2}
                  formatter={currencyFormatter}
                  valueStyle={{ color: "#3f8600", fontWeight: 'bold' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
               <Card size="small" style={{ textAlign: 'center', marginTop: 16, '@media (min-width: 576px)': { marginTop: 0 } }}>
                <Statistic
                  title="Valor Pago"
                  value={table.total_transaction}
                  precision={2}
                  formatter={currencyFormatter}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card size="small" style={{ textAlign: 'center', marginTop: 16, '@media (min-width: 576px)': { marginTop: 0 } }}>
                <Statistic
                  title="Troco"
                  value={table.change_due}
                  precision={2}
                  formatter={currencyFormatter}
                  valueStyle={{ color: table.change_due > 0.01 ? "#faad14" : "#000000d9", fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          </Row>

          <Divider orientation="left" plain>Informações Básicas</Divider>

          <Card title={<Space><InfoCircleOutlined /> Informações da Mesa</Space>} bordered style={{ marginBottom: 24 }} hoverable>
            <Descriptions column={{ xs: 1, sm: 2, md: 2 }} bordered size="small">
              <Descriptions.Item label="Mesa ID"><strong>{table.mesa_id}</strong></Descriptions.Item>
              <Descriptions.Item label="Loja">{table.nome_loja}</Descriptions.Item>
              <Descriptions.Item label="1º Pedido">{dayjs(table.first_order_created_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
              <Descriptions.Item label="Transação ID">{table.transaction_id || <Tag color="default">N/A</Tag>}</Descriptions.Item>
            </Descriptions>
          </Card>
          
          {/* SEÇÃO PAGAMENTO E TRANSAÇÃO - EMPILHADA */}
          <Divider orientation="left" plain>Pagamento e Transação</Divider>
          
          {/* Card de Pagamento (AGORA SIMPLES E ORDENADO) */}
          {paymentsCard}
          
          {/* Card de Transação */}
          {transactionCard}

          <Divider orientation="left" plain>Detalhamento dos Pedidos</Divider>
          <Collapse
            items={orderCollapseItems}
            defaultActiveKey={orderCollapseItems.map((item) => item.key)}
            style={{ marginBottom: 16 }}
            expandIconPosition="right"
          />

          {table.qr_code && (
            <Card title={<Space><InfoCircleOutlined /> QR Code Completo</Space>} bordered style={{ marginBottom: 16 }}>
              <Alert message="Atenção: Este é o conteúdo completo do QR Code da transação." type="info" style={{ marginBottom: 10 }}/>
              <p style={{ wordBreak: "break-all", fontSize: "0.8em", padding: 10, backgroundColor: '#f0f2f5', borderRadius: 4 }}>{table.qr_code}</p>
            </Card>
          )}
        </Space>
      </motion.div>
    );
  };

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: '#f0f2f5' }}>
      <Content style={{ padding: 20 }}>
        <Card bordered={false} style={{ marginBottom: 20, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col>
              <h2><TableOutlined /> Mesas Fechadas e Pagamentos</h2>
            </Col>
            <Col>
              <Space>
                <DatePicker 
                  value={date} 
                  onChange={setDate} 
                  allowClear={false} 
                  inputReadOnly 
                  suffixIcon={<CalendarOutlined />}
                  style={{ width: 150 }}
                />
                <Button
                  type={view === "table" ? "primary" : "default"}
                  onClick={() => setView("table")}
                  icon={<TableOutlined />}
                >
                  Tabela
                </Button>
                <Button
                  type={view === "cards" ? "primary" : "default"}
                  onClick={() => setView("cards")}
                  icon={<AppstoreOutlined />}
                >
                  Cards
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {errorTables && (
            <Alert
                message="Erro de Carregamento"
                description={errorTables}
                type="error"
                showIcon
                closable
                onClose={() => setErrorTables(null)}
                style={{ marginBottom: 20 }}
            />
        )}
        
        <AnimatePresence mode="wait">
          {view === "cards" ? (
            <motion.div
              key="cardsView"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <Spin spinning={loadingTables} tip="Carregando mesas...">
                {tables.length > 0 ? (
                  <motion.div
                    variants={cardContainerVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}
                  >
                    {tables.map((t) => (
                      <motion.div key={t.id} variants={cardItemVariants}>
                        <Card
                          title={`Mesa ${t.number}`}
                          onClick={() => fetchTableDetails(t.id)}
                          hoverable
                          headStyle={{ backgroundColor: t.is_open ? '#f6ffed' : '#fff1f0', borderBottom: t.is_open ? '1px solid #b7eb8f' : '1px solid #ffa39e' }}
                          extra={<Tag color={t.is_open ? "success" : "error"}>{t.is_open ? "ABERTA" : "FECHADA"}</Tag>}
                          style={{ boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)' }}
                        >
                          <Statistic
                              title="Valor Total"
                              value={t.total_order_value}
                              precision={2}
                              formatter={currencyFormatter}
                              valueStyle={{ color: "#3f8600", fontSize: '1.5em' }}
                          />
                          <Divider style={{ margin: '12px 0' }}/>
                          <Row>
                              <Col span={12}>
                                  <p><b>Abertura:</b></p>
                                  <small>{dayjs(t.opened_at).format("DD/MM HH:mm")}</small>
                              </Col>
                              <Col span={12}>
                                  <p><b>Fechamento:</b></p>
                                  <small>{t.closed_at ? dayjs(t.closed_at).format("DD/MM HH:mm") : "-"}</small>
                              </Col>
                          </Row>
                          
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                    !loadingTables && <Empty description={`Nenhuma mesa fechada em ${date.format('DD/MM/YYYY')}`} />
                )}
              </Spin>
            </motion.div>
          ) : (
            <motion.div
              key="tableView"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Table 
                rowKey="id" 
                dataSource={tables} 
                columns={columns} 
                pagination={{ pageSize: 10, showSizeChanger: true }} 
                loading={loadingTables}
                scroll={{ x: 800 }} 
                bordered
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Drawer
          title={<Space><TableOutlined /> Detalhes da Mesa: <Tag color="blue" style={{ fontSize: '1.2em' }}>Mesa {selectedTable?.mesa_id}</Tag></Space>}
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={window.innerWidth > 768 ? 720 : "100%"}
          destroyOnClose={true} 
          maskClosable={!loadingDetails}
        >
          {renderDrawerDetails()}
        </Drawer>
      </Content>
    </Layout>
  );
}