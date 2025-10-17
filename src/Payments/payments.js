import React, { useState, useEffect } from "react";
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
  Spin, // Importação do componente Spin para o loading
} from "antd";
import { 
    TableOutlined, 
    AppstoreOutlined, 
    ShoppingCartOutlined, 
    DollarCircleOutlined, 
    InfoCircleOutlined, 
    LoadingOutlined 
} from '@ant-design/icons';
import dayjs from "dayjs";

// Configuração da formatação de moeda
const currencyFormatter = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function ClosedTablesPage() {
  const [date, setDate] = useState(dayjs());
  const [tables, setTables] = useState([]);
  const [view, setView] = useState("table"); // "table" ou "cards"
  const [selectedTable, setSelectedTable] = useState(null); // Detalhes da mesa selecionada
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  // Estados de Loading
  const [loadingTables, setLoadingTables] = useState(false); // Loading da tabela/cards
  const [loadingDetails, setLoadingDetails] = useState(false); // Loading do drawer de detalhes

  // Busca mesas fechadas do dia selecionado
  useEffect(() => {
    const fetchClosedTables = async () => {
      setLoadingTables(true);
      setTables([]);

      try {
        const res = await fetch("https://restaurant-sw98.onrender.com/tables/viewcloseondate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: date.format("YYYY-MM-DD") }),
        });

        const data = await res.json();
        
        const formattedData = data.map(t => ({
            ...t,
            // Usando `total_order_value` que é o campo que o backend deve retornar
            total_order_value: parseFloat(t.total_order_value || 0)
        }));
        
        setTables(formattedData);
      } catch (err) {
        console.error("Erro ao buscar mesas fechadas:", err);
      } finally {
        setLoadingTables(false);
      }
    };

    fetchClosedTables();
  }, [date]);

  // 💡 FUNÇÃO CORRIGIDA PARA CONSOLIDAR MÚLTIPLOS PEDIDOS
  const fetchTableDetails = async (id) => {
    setLoadingDetails(true);
    setSelectedTable(null);

    try {
      const res = await fetch(`https://restaurant-sw98.onrender.com/tables/viewclose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: id }), // envia o id no body
      });

      const data = await res.json();
      
      if (!data || data.length === 0) {
          setLoadingDetails(false);
          setDrawerVisible(true);
          return;
      }

      // Consolidação dos dados de múltiplos pedidos em um único objeto da Mesa
      const consolidatedData = data.reduce((acc, currentOrder, index) => {
          
          // O primeiro item (index 0) define os dados principais da transação/mesa
          if (index === 0) {
              acc.mesa_id = currentOrder.mesa_id;
              acc.nome_loja = currentOrder.nome_loja;
              acc.transaction_id = currentOrder.transaction_id;
              acc.transaction_status = currentOrder.transaction_status;
              acc.total_transaction = parseFloat(currentOrder.total_transaction || 0); // Total pago (em centavos)
              acc.change_due = parseFloat(currentOrder.change_due || 0); // Troco (em reais)
              acc.payment_json = currentOrder.payment_json; 
              acc.qr_code = currentOrder.qr_code;
              acc.transaction_created_at = currentOrder.transaction_created_at;
              acc.transaction_updated_at = currentOrder.transaction_updated_at;
              acc.first_order_created_at = currentOrder.order_created_at; // Data do 1º pedido
              
              acc.total_orders_sum = 0; // Soma dos totais de todos os pedidos (em reais)
              acc.all_orders = []; // Array para armazenar todos os objetos de pedido (com produtos)
          }

          // Soma o total de cada pedido para o total geral da mesa
          acc.total_orders_sum += parseFloat(currentOrder.order_total || 0);
          
          // Adiciona o pedido completo (incluindo seus produtos) ao array de pedidos da mesa
          acc.all_orders.push({
              order_id: currentOrder.order_id,
              order_total: parseFloat(currentOrder.order_total || 0),
              order_status: currentOrder.order_status,
              order_created_at: currentOrder.order_created_at,
              produtos: currentOrder.produtos || []
          });

          return acc;
      }, {}); // Inicializa com um objeto vazio

      setSelectedTable(consolidatedData);
      setDrawerVisible(true);
    } catch (err) {
      console.error("Erro ao buscar detalhes da mesa:", err);
    } finally {
      setLoadingDetails(false); // Finaliza loading dos detalhes
    }
  };

  // Colunas da tabela (sem alterações relevantes)
  const columns = [
    { title: "Mesa", dataIndex: "number", sorter: (a, b) => a.number - b.number },
    {
      title: "Abertura",
      dataIndex: "opened_at",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-"),
      sorter: (a, b) => dayjs(a.opened_at).unix() - dayjs(b.opened_at).unix(),
    },
    {
      title: "Fechamento",
      dataIndex: "closed_at",
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY HH:mm") : "-"),
      sorter: (a, b) => dayjs(a.closed_at).unix() - dayjs(b.closed_at).unix(),
    },
    {
      title: "Valor Total", 
      dataIndex: "total_order_value", 
      key: "total_order_value",
      render: (v) => currencyFormatter(v),
      sorter: (a, b) => a.total_order_value - b.total_order_value,
    },
    
    {
      title: "Status",
      dataIndex: "is_open",
      render: (v) => (
        <Tag color={v ? "green" : "red"}>{v ? "Aberto" : "Fechado"}</Tag>
      ),
      filters: [{ text: 'Aberto', value: true }, { text: 'Fechado', value: false }],
      onFilter: (value, record) => record.is_open === value,
    },
    {
      title: "Ações",
      render: (_, record) => (
        <Button 
          onClick={() => fetchTableDetails(record.id)} 
          disabled={loadingDetails}
          icon={loadingDetails && selectedTable?.mesa_id === record.id ? <LoadingOutlined /> : null}
        >
          Ver detalhes
        </Button>
      ),
    },
  ];

  // 💡 RENDERIZAÇÃO CORRIGIDA PARA MÚLTIPLOS PEDIDOS
  const renderDrawerDetails = () => {
    
    if (loadingDetails) {
        return <div style={{ textAlign: 'center', padding: '50px 0' }}><Spin size="large" tip="Carregando detalhes..." /></div>;
    }
    
    if (!selectedTable) return <p>Nenhum detalhe disponível.</p>;

    const table = selectedTable;
    
    // Conteúdo colapsável para os Pedidos (agrupando produtos por Order ID)
    const orderCollapseItems = table.all_orders.map((order, index) => {
        
        // O total do pedido individual pode ser calculado aqui ou usado do `order.order_total`
        const orderTotal = parseFloat(order.order_total || 0);

        return {
            key: `order_${order.order_id}`,
            label: (
                <Row justify="space-between" style={{ width: '100%' }}>
                    <Col>
                        <Space>
                            <ShoppingCartOutlined />
                            Pedido #{order.order_id} ({order.produtos?.length || 0} itens)
                        </Space>
                    </Col>
                    <Col>
                        <strong style={{ color: '#3f8600' }}>
                            Total: {currencyFormatter(orderTotal)}
                        </strong>
                    </Col>
                </Row>
            ),
            children: (
                <List
                    itemLayout="horizontal"
                    dataSource={order.produtos}
                    renderItem={(item) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<Image width={60} src={item.imagem || 'placeholder.jpg'} fallback="placeholder.jpg" />}
                                // Preço unitário está em centavos. Deve ser dividido por 100 para exibição
                                title={`${item.produto_nome} (x${item.quantidade})`}
                                description={`${item.descricao} | ${currencyFormatter(parseFloat(item.preco_unitario || 0) / 100)} (un.)`}
                            />
                            <div>
                                <strong>
                                    {/* Cálculo do total do item: (preço unitário / 100) * quantidade */}
                                    {currencyFormatter((parseFloat(item.preco_unitario || 0) / 100) * item.quantidade)}
                                </strong>
                            </div>
                        </List.Item>
                    )}
                />
            ),
        };
    });
    
    // Card de Pagamentos
    const paymentsCard = (
      <Card title={<Space><DollarCircleOutlined /> Pagamentos Efetuados</Space>} bordered style={{ marginBottom: 16 }}>
        <List
          dataSource={table.payment_json}
          renderItem={(payment) => (
            <Row justify="space-between">
              <Col><strong>{payment.methodLabel}:</strong></Col>
              <Col>{currencyFormatter(parseFloat(payment.value_reais || 0))}</Col>
            </Row>
          )}
        />
      </Card>
    );

    // Card de Informações da Transação
    const transactionCard = table.transaction_id && (
      <Card title={<Space><InfoCircleOutlined /> Informações da Transação</Space>} bordered style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="ID">{table.transaction_id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={table.transaction_status === 'completed' ? 'green' : 'red'}>
              {table.transaction_status || 'N/A'}
            </Tag>
          </Descriptions.Item>
          {/* total_transaction está em centavos, por isso a divisão por 100 */}
          <Descriptions.Item label="Total Transação (R$)">{currencyFormatter(parseFloat(table.total_transaction || 0) / 100)}</Descriptions.Item> 
          <Descriptions.Item label="Criada em">{dayjs(table.transaction_created_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
          <Descriptions.Item label="Atualizada em">{dayjs(table.transaction_updated_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
        </Descriptions>
      </Card>
    );
    
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Agrupamento de Estatísticas de Valores - AGORA USA total_orders_sum */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic 
              title="Total Pedidos" 
              value={table.total_orders_sum} // Total GERAL de todos os pedidos somados
              precision={2} 
              formatter={currencyFormatter} 
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="Valor Pago" 
              value={parseFloat(table.total_transaction || 0) / 100} // Total Pago na transação (em reais)
              precision={2} 
              formatter={currencyFormatter}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="Troco" 
              value={table.change_due} // Troco já deve estar em reais
              precision={2} 
              formatter={currencyFormatter} 
              valueStyle={{ color: table.change_due > 0 ? '#faad14' : '#000000d9' }}
            />
          </Col>
        </Row>
        
        <Divider orientation="left" plain>Informações Gerais</Divider>

        {/* Informações da Mesa e Pedido */}
        <Card title={<Space><InfoCircleOutlined /> Informações da Mesa/Loja</Space>} bordered style={{ marginBottom: 16 }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Mesa ID">{table.mesa_id}</Descriptions.Item>
            <Descriptions.Item label="Loja">{table.nome_loja}</Descriptions.Item>
            <Descriptions.Item label="1º Pedido">{dayjs(table.first_order_created_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
            <Descriptions.Item label="Transação ID">{table.transaction_id || 'N/A'}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Collapse para Pedidos (um collapse por order_id) */}
        <Divider orientation="left" plain>Pedidos</Divider>
        <Collapse 
            items={orderCollapseItems} 
            // Abre todos os pedidos por padrão
            defaultActiveKey={orderCollapseItems.map(item => item.key)}
            style={{ marginBottom: 16 }} 
        />

        {paymentsCard}
        {transactionCard}
        
        {/* O QR Code estava usando um ícone que não foi importado, mas vou mantê-lo aqui,
            caso queira importá-lo ou remover o Card se não for usado. */}
        {table.qr_code && (
            <Card title={<Space><InfoCircleOutlined /> QR Code</Space>} bordered style={{ marginBottom: 16 }}>
                <p style={{ wordBreak: "break-all", fontSize: '0.8em' }}>{table.qr_code}</p>
            </Card>
        )}
        
      </Space>
    );
  };
  
  return (
    <div style={{ padding: 20 }}>
      <h2>Pagamentos Realizados <TableOutlined /></h2>

      <Space style={{ marginBottom: 16 }}>
        <DatePicker value={date} onChange={setDate} allowClear={false} />
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

      {view === "cards" ? (
        <Spin spinning={loadingTables} tip="Carregando mesas...">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {tables.map(t => (
              <Card
                key={t.id}
                title={`Mesa ${t.number}`}
                onClick={() => fetchTableDetails(t.id)}
                hoverable
                extra={<Tag color={t.is_open ? "green" : "red"}>{t.is_open ? "Aberto" : "Fechado"}</Tag>}
              >
                <p><b>Total:</b> {currencyFormatter(t.total_order_value)}</p> 
                <p><b>Abertura:</b> {dayjs(t.opened_at).format("DD/MM HH:mm")}</p>
                <p><b>Fechamento:</b> {t.closed_at ? dayjs(t.closed_at).format("DD/MM HH:mm") : "-"}</p>
              </Card>
            ))}
          </div>
        </Spin>
      ) : (
        <Table 
          rowKey="id" 
          dataSource={tables} 
          columns={columns} 
          pagination={{ pageSize: 10 }} 
          loading={loadingTables}
        />
      )}

      {/* Drawer para mostrar detalhes da mesa */}
      <Drawer
        title={<Space><TableOutlined /> Detalhes da Mesa: {selectedTable?.mesa_id}</Space>}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={window.innerWidth > 768 ? 720 : '100%'}
        destroyOnClose={true}
      >
        {renderDrawerDetails()}
      </Drawer>
    </div>
  );
}