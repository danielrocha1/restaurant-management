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
import { TableOutlined, AppstoreOutlined, ShoppingCartOutlined, DollarCircleOutlined, InfoCircleOutlined, QrcodeOutlined, LoadingOutlined } from '@ant-design/icons';
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
  
  // 💡 NOVOS ESTADOS DE LOADING
  const [loadingTables, setLoadingTables] = useState(false); // Loading da tabela/cards
  const [loadingDetails, setLoadingDetails] = useState(false); // Loading do drawer de detalhes

  // Busca mesas fechadas do dia selecionado
  useEffect(() => {
    const fetchClosedTables = async () => {
      setLoadingTables(true); // Inicia loading da tabela
      setTables([]); // Limpa dados anteriores

      try {
        const res = await fetch("http://localhost:4000/tables/viewcloseondate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: date.format("YYYY-MM-DD") }),
        });

        const data = await res.json();
        
        // **IMPORTANTE**: No backend você retorna `total_order_value`. No seu frontend você está
        // usando `total_calculado`. Vou assumir que você **corrigiu o backend** para retornar
        // `total_order_value` ou que a linha de mapeamento está errada.
        // Vou MUDAR para usar `total_order_value` aqui para ser consistente com o código Go anterior.
        
        const formattedData = data.map(t => ({
            ...t,
            // 💡 Correção: Usando `total_order_value` que é o nome do campo no backend
            total_order_value: parseFloat(t.total_order_value || 0)
        }));
        
        setTables(formattedData);
      } catch (err) {
        console.error("Erro ao buscar mesas fechadas:", err);
      } finally {
        setLoadingTables(false); // Finaliza loading da tabela
      }
    };

    fetchClosedTables();
  }, [date]);

  // Função para buscar detalhes de uma mesa
  const fetchTableDetails = async (id) => {
    setLoadingDetails(true); // Inicia loading dos detalhes
    setSelectedTable(null); // Limpa detalhes antigos

    try {
      const res = await fetch(`http://localhost:4000/tables/viewclose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: id }), // envia o id no body
      });

      const data = await res.json();
      setSelectedTable(data[0]);
      setDrawerVisible(true);
    } catch (err) {
      console.error("Erro ao buscar detalhes da mesa:", err);
    } finally {
      setLoadingDetails(false); // Finaliza loading dos detalhes
    }
  };

  // Colunas da tabela
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
      sorter: (a, b) => a.total_order_value - b.total_order_value, // Ordenação correta
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
        // 💡 Desabilita o botão enquanto os detalhes estão carregando
        <Button 
          onClick={() => fetchTableDetails(record.id)} 
          disabled={loadingDetails}
          // 💡 Adiciona ícone de loading no botão se ele for a mesa sendo carregada (opcional)
          icon={loadingDetails && selectedTable?.mesa_id === record.id ? <LoadingOutlined /> : null}
        >
          Ver detalhes
        </Button>
      ),
    },
  ];

  // Renderização do Drawer (Detalhes da Mesa)
  const renderDrawerDetails = () => {
    // 💡 Renderiza um Spin ou um texto enquanto carrega
    if (loadingDetails) {
        return <div style={{ textAlign: 'center', padding: '50px 0' }}><Spin size="large" tip="Carregando detalhes..." /></div>;
    }
    
    if (!selectedTable) return <p>Nenhum detalhe disponível.</p>;

    const table = selectedTable;
    
    // 1. CÁLCULO DO VALOR TOTAL DOS PRODUTOS
    const totalProductsValue = table.produtos ? table.produtos.reduce((sum, item) => {
        const itemTotal = (item.preco_unitario / 100) * item.quantidade;
        return sum + itemTotal;
    }, 0) : 0;


    // Conteúdo colapsável para Produtos
    const productCollapseItems = [
      {
        key: '1',
        // 2. INCLUSÃO DO VALOR NO LABEL DO COLLAPSE
        label: (
            <Space>
                <ShoppingCartOutlined />
                Produtos ({table.produtos?.length || 0})
                <strong style={{ marginLeft: "19vw", color: '#3f8600' }}>
                    Total: {currencyFormatter(totalProductsValue)}
                </strong>
            </Space>
        ),
        children: (
          <List
            itemLayout="horizontal"
            dataSource={table.produtos}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Image width={60} src={item.imagem || 'placeholder.jpg'} fallback="placeholder.jpg" />}
                  title={`${item.produto_nome} (x${item.quantidade})`}
                  description={`${item.descricao} | ${currencyFormatter(item.preco_unitario / 100)} (un.)`}
                />
                <div>
                  <strong>{currencyFormatter((item.preco_unitario / 100) * item.quantidade)}</strong>
                </div>
              </List.Item>
            )}
          />
        ),
      },
    ];

    // Card de Pagamentos
    const paymentsCard = (
      <Card title={<Space><DollarCircleOutlined /> Pagamentos Efetuados</Space>} bordered style={{ marginBottom: 16 }}>
        <List
          dataSource={table.payment_json}
          renderItem={(payment) => (
            <Row justify="space-between">
              <Col><strong>{payment.methodLabel}:</strong></Col>
              <Col>{currencyFormatter(payment.value_reais)}</Col>
            </Row>
          )}
        />
      </Card>
    );

    // Card de Informações da Transação (se disponível)
    const transactionCard = table.transaction_id && (
      <Card title={<Space><InfoCircleOutlined /> Informações da Transação</Space>} bordered style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="ID">{table.transaction_id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={table.transaction_status === 'paid' ? 'green' : 'red'}>
              {table.transaction_status || 'N/A'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Total Transação (R$)">{currencyFormatter(table.total_transaction / 100)}</Descriptions.Item>
          <Descriptions.Item label="Criada em">{dayjs(table.transaction_created_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
          <Descriptions.Item label="Atualizada em">{dayjs(table.transaction_updated_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
        </Descriptions>
      </Card>
    );
    
    // Card de QR Code (se disponível)
    const qrCodeCard = table.qr_code && (
      <Card title={<Space><QrcodeOutlined /> QR Code</Space>} bordered style={{ marginBottom: 16 }}>
        <p style={{ wordBreak: "break-all", fontSize: '0.8em' }}>{table.qr_code}</p>
      </Card>
    );

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Agrupamento de Estatísticas de Valores */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic 
              title="Total do Pedido" 
              value={table.order_total} 
              precision={2} 
              formatter={currencyFormatter} 
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="Valor Pago" 
              value={table.total_transaction / 100} // Assumindo que total_transaction está em centavos
              precision={2} 
              formatter={currencyFormatter}
            />
          </Col>
          <Col span={8}>
            <Statistic 
              title="Troco" 
              value={table.change_due} 
              precision={2} 
              formatter={currencyFormatter} 
              valueStyle={{ color: table.change_due > 0 ? '#faad14' : '#000000d9' }}
            />
          </Col>
        </Row>
        
        <Divider orientation="left" plain>Informações Gerais</Divider>

        {/* Informações da Mesa e Pedido */}
        <Card title={<Space><InfoCircleOutlined /> Informações da Mesa/Pedido</Space>} bordered style={{ marginBottom: 16 }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Mesa ID">{table.mesa_id}</Descriptions.Item>
            <Descriptions.Item label="Loja">{table.nome_loja}</Descriptions.Item>
            <Descriptions.Item label="Criado em">{dayjs(table.order_created_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Collapse items={productCollapseItems} defaultActiveKey={['1']} style={{ marginBottom: 16 }} />

        {paymentsCard}
        {transactionCard}
        {qrCodeCard}
        
      </Space>
    );
  };
  
  return (
    <div style={{ padding: 20 }}>
      <h2>Mesas Fechadas <TableOutlined /></h2>

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
        // 💡 Aplica loading na visão de Cards
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
                {/* 💡 Corrigido para `total_order_value` */}
                <p><b>Total:</b> {currencyFormatter(t.total_order_value)}</p> 
                <p><b>Abertura:</b> {dayjs(t.opened_at).format("DD/MM HH:mm")}</p>
                <p><b>Fechamento:</b> {t.closed_at ? dayjs(t.closed_at).format("DD/MM HH:mm") : "-"}</p>
              </Card>
            ))}
          </div>
        </Spin>
      ) : (
        // 💡 Aplica loading na Tabela
        <Table 
          rowKey="id" 
          dataSource={tables} 
          columns={columns} 
          pagination={{ pageSize: 10 }} 
          loading={loadingTables} // Aplica o loading na tabela
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
        {/* O loading dos detalhes é tratado dentro de renderDrawerDetails() */}
        {renderDrawerDetails()}
      </Drawer>
    </div>
  );
}