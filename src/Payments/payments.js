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
  Spin,
} from "antd";
import {
  TableOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  DollarCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

// Formatação de moeda
const currencyFormatter = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Conversor robusto de valores do backend -> número em reais
const toReais = (raw) => {
  if (raw === null || raw === undefined) return 0;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw > 1000 ? raw / 100 : raw; // valores grandes assumem centavos
  }

  const s = String(raw).trim();
  if (s === "") return 0;

  if (s.includes(".") || s.includes(",")) {
    const f = parseFloat(s.replace(",", "."));
    return Number.isFinite(f) ? f : 0;
  }

  const cents = parseInt(s, 10);
  return Number.isNaN(cents) ? 0 : cents / 100;
};

export default function ClosedTablesPage() {
  const [date, setDate] = useState(dayjs());
  const [tables, setTables] = useState([]);
  const [view, setView] = useState("table");
  const [selectedTable, setSelectedTable] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Busca mesas fechadas
  useEffect(() => {
    const fetchClosedTables = async () => {
      setLoadingTables(true);
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
        const data = await res.json();

        const formatted = (data || []).map((t) => ({
          ...t,
          total_order_value: toReais(t.total_order_value),
        }));

        setTables(formatted);
      } catch (err) {
        console.error("Erro ao buscar mesas fechadas:", err);
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

    try {
      const res = await fetch(`https://restaurant-sw98.onrender.com/tables/viewclose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ID: id }),
      });

      const data = await res.json();

      if (!data || data.length === 0) {
        setLoadingDetails(false);
        setDrawerVisible(true);
        return;
      }

      const consolidatedData = data.reduce((acc, currentOrder, index) => {
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
          acc.payment_json = currentOrder.payment_json || [];
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
      setDrawerVisible(true);
    } catch (err) {
      console.error("Erro ao buscar detalhes da mesa:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

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
      render: (v) => <Tag color={v ? "green" : "red"}>{v ? "Aberto" : "Fechado"}</Tag>,
      filters: [
        { text: "Aberto", value: true },
        { text: "Fechado", value: false },
      ],
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

  const renderDrawerDetails = () => {
    if (loadingDetails) {
      return (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin size="large" tip="Carregando detalhes..." />
        </div>
      );
    }

    if (!selectedTable) return <p>Nenhum detalhe disponível.</p>;

    const table = selectedTable;

    const orderCollapseItems = table.all_orders.map((order) => {
      const orderTotal = parseFloat(order.order_total || 0);

      return {
        key: `order_${order.order_id}`,
        label: (
          <Row justify="space-between" style={{ width: "100%" }}>
            <Col>
              <Space>
                <ShoppingCartOutlined />
                Pedido #{order.order_id} ({order.produtos?.length || 0} itens)
              </Space>
            </Col>
            <Col>
              <strong style={{ color: "#3f8600" }}>Total: {currencyFormatter(orderTotal)}</strong>
            </Col>
          </Row>
        ),
        children: (
          <List
            itemLayout="horizontal"
            dataSource={order.produtos}
            renderItem={(item) => {
              const unitReais = toReais(item.preco_unitario);
              const quantidade = item.quantidade || 0;
              const totalItem = unitReais * quantidade;

              return (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Image width={60} src={item.imagem || "placeholder.jpg"} fallback="placeholder.jpg" />}
                    title={`${item.produto_nome} (x${quantidade})`}
                    description={`${item.descricao} | ${currencyFormatter(unitReais)} (un.)`}
                  />
                  <div>
                    <strong>{currencyFormatter(totalItem)}</strong>
                  </div>
                </List.Item>
              );
            }}
          />
        ),
      };
    });

    const paymentsCard = (
      <Card title={<Space><DollarCircleOutlined /> Pagamentos Efetuados</Space>} bordered style={{ marginBottom: 16 }}>
        <List
          dataSource={Array.isArray(table.payment_json) ? table.payment_json : []}
          renderItem={(payment) => {
            const rawValue = payment.value ?? payment.value_reais ?? 0;
            const valueNumber = toReais(rawValue);
            const label = payment.methodLabel || payment.method || "Pagamento";
            return (
              <Row justify="space-between">
                <Col><strong>{label}:</strong></Col>
                <Col>{currencyFormatter(valueNumber)}</Col>
              </Row>
            );
          }}
        />
      </Card>
    );

    const transactionCard = table.transaction_id && (
      <Card title={<Space><InfoCircleOutlined /> Informações da Transação</Space>} bordered style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="ID">{table.transaction_id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={table.transaction_status === "completed" ? "green" : "red"}>
              {table.transaction_status || "N/A"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Total Transação (R$)">{currencyFormatter(toReais(table.total_transaction))}</Descriptions.Item>
          <Descriptions.Item label="Criada em">{dayjs(table.transaction_created_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
          <Descriptions.Item label="Atualizada em">{dayjs(table.transaction_updated_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
        </Descriptions>
      </Card>
    );

    return (
      <Space direction="vertical" style={{ width: "100%" }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title="Total Pedidos"
              value={table.total_orders_sum}
              precision={2}
              formatter={currencyFormatter}
              valueStyle={{ color: "#3f8600" }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Valor Pago"
              value={toReais(table.total_transaction)}
              precision={2}
              formatter={currencyFormatter}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Troco"
              value={toReais(table.change_due)}
              precision={2}
              formatter={currencyFormatter}
              valueStyle={{ color: table.change_due > 0 ? "#faad14" : "#000000d9" }}
            />
          </Col>
        </Row>

        <Divider orientation="left" plain>Informações Gerais</Divider>

        <Card title={<Space><InfoCircleOutlined /> Informações da Mesa/Loja</Space>} bordered style={{ marginBottom: 16 }}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Mesa ID">{table.mesa_id}</Descriptions.Item>
            <Descriptions.Item label="Loja">{table.nome_loja}</Descriptions.Item>
            <Descriptions.Item label="1º Pedido">{dayjs(table.first_order_created_at).format("DD/MM/YYYY HH:mm")}</Descriptions.Item>
            <Descriptions.Item label="Transação ID">{table.transaction_id || "N/A"}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Divider orientation="left" plain>Pedidos</Divider>
        <Collapse
          items={orderCollapseItems}
          defaultActiveKey={orderCollapseItems.map((item) => item.key)}
          style={{ marginBottom: 16 }}
        />

        {paymentsCard}
        {transactionCard}

        {table.qr_code && (
          <Card title={<Space><InfoCircleOutlined /> QR Code</Space>} bordered style={{ marginBottom: 16 }}>
            <p style={{ wordBreak: "break-all", fontSize: "0.8em" }}>{table.qr_code}</p>
          </Card>
        )}
      </Space>
    );
  };

  return (
    <div style={{ padding: 20 }}>
      <h2><TableOutlined /> Pagamentos Realizados </h2>

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
            {tables.map((t) => (
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
        <Table rowKey="id" dataSource={tables} columns={columns} pagination={{ pageSize: 10 }} loading={loadingTables} />
      )}

      <Drawer
        title={<Space><TableOutlined /> Detalhes da Mesa: {selectedTable?.mesa_id}</Space>}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={window.innerWidth > 768 ? 720 : "100%"}
        destroyOnClose={true}
      >
        {renderDrawerDetails()}
      </Drawer>
    </div>
  );
}
