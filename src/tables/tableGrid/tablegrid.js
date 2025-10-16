import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Spin,
  message,
  Drawer,
  List,
  Image,
  Typography,
  Tag,
  Button,
} from "antd";

const { Title, Text } = Typography;

// Componente de cada mesa
const TableCard = ({ elementId, number, isOpen, onClick, loading }) => (
  <div id={String(elementId)} style={{ width: 100 }}>
    <Card
      hoverable={!loading}
      onClick={() => !loading && onClick()}
      style={{
        width: "100px",
        height: "100px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isOpen ? "#52c41a" : "#d9d9d9",
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
        borderRadius: 8,
        cursor: loading ? "default" : "pointer",
        textAlign: "center",
        position: "relative",
      }}
    >
      {loading ? (
        <Spin />
      ) : (
        <div>
          <div style={{ fontSize: 18 }}>Mesa {number}</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>
            {isOpen ? <Tag color="success">Aberta</Tag> : <Tag>Fechada</Tag>}
          </div>
        </div>
      )}
    </Card>
  </div>
);

// Drawer secundário — Detalhes do pedido
const DrawerOrderDetails = ({ visible, onClose, order }) => (
  <Drawer
    title={<Title level={4}>Detalhes do Pedido #{order?.order_id}</Title>}
    width={600}
    placement="right"
    onClose={onClose}
    open={visible}
  >
    {order ? (
      <List
        itemLayout="horizontal"
        dataSource={order.produtos || []}
        renderItem={(produto) => (
          <List.Item>
            <List.Item.Meta
              avatar={
                produto.imagem && (
                  <Image
                    src={produto.imagem}
                    alt={produto.nome}
                    width={64}
                    height={64}
                    style={{ objectFit: "cover", borderRadius: 6 }}
                    preview={{ src: produto.imagem }}
                  />
                )
              }
              title={
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Text strong>{produto.nome}</Text>
                  <Text>R$ {Number(produto.total_item).toFixed(2)}</Text>
                </div>
              }
              description={
                <div style={{ display: "flex", gap: 12 }}>
                  <Text>Qtd: {produto.quantidade}</Text>
                  <Text>Unit: R$ {Number(produto.preco_unitario).toFixed(2)}</Text>
                  <Text>Preço (item): R$ {Number(produto.preco).toFixed(2)}</Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    ) : (
      <Text>Nenhum produto encontrado.</Text>
    )}
  </Drawer>
);

// Drawer principal — Pedidos da mesa
const DrawerTableOrders = ({ visible, onClose, orders, onSelectOrder }) => {
  const totalGeral = orders.reduce(
    (sum, order) =>
      sum +
      order.produtos.reduce((s, produto) => s + Number(produto.total_item), 0),
    0
  );

  return (
    <Drawer
      title={<Title level={4}>Pedidos da Mesa</Title>}
      width={720}
      placement="right"
      onClose={onClose}
      open={visible}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 16px",
            background: "#fff",
          }}
        >
          <Text strong style={{ fontSize: 16 }}>
            Total Geral: R$ {totalGeral.toFixed(2)}
          </Text>
          <Button
            type="primary"
            danger
            onClick={() => message.success("Mesa fechada com sucesso!")}
          >
            Fechar Mesa
          </Button>
        </div>
      }
    >
      {orders.length === 0 ? (
        <Text>Nenhum pedido encontrado.</Text>
      ) : (
        orders.map((order) => {
          const total = order.produtos.reduce(
            (sum, p) => sum + Number(p.total_item),
            0
          );
          return (
            <div
              key={order.order_id}
              style={{
                padding: 16,
                marginBottom: 16,
                border: "1px solid #f0f0f0",
                borderRadius: 6,
                cursor: "pointer",
                backgroundColor: "#fafafa",
              }}
              onClick={() => onSelectOrder(order)}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text strong>Pedido #{order.order_id}</Text>
                <Text>Total: R$ {total.toFixed(2)}</Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  {new Date(order.pedido_created_at).toLocaleString()}
                </Text>
              </div>
            </div>
          );
        })
      )}
    </Drawer>
  );
};

// Componente principal
const TableGrid = () => {
  const [tables, setTables] = useState([]);
  const [loadingTable, setLoadingTable] = useState(null);

  const [drawerTableVisible, setDrawerTableVisible] = useState(false);
  const [drawerOrderVisible, setDrawerOrderVisible] = useState(false);

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await fetch("https://restaurant-sw98.onrender.com/tables/isopen");
        const data = await res.json();
        const mapped = data.map((t) => ({
          id: t.id,
          number: t.number,
          isOpen: Boolean(t.is_open),
        }));
        setTables(mapped);
      } catch (err) {
        console.error(err);
        message.error("Falha ao carregar mesas");
      }
    };
    fetchTables();
  }, []);

   useEffect(() => {
    console.log(tables)
    
  }, [tables]);


  const handleTableClick = async (table) => {
    setLoadingTable(table.id);
     const url = "https://restaurant-sw98.onrender.com/tables/view";
    const body = { number: table.id };

    try {
      let res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setSelectedOrders(data);
      setDrawerTableVisible(true);
    } catch (err) {
      message.error("Falha ao carregar pedidos da mesa");
    } finally {
      setLoadingTable(null);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setDrawerOrderVisible(true);
  };

  return (
    <>
      <Row gutter={[16, 16]}>
        {tables.map((table) => (
          <Col key={table.id}>
            <TableCard
              elementId={table.id}
              number={table.number}
              isOpen={table.isOpen}
              loading={loadingTable === table.id}
              onClick={() => handleTableClick(table)}
            />
          </Col>
        ))}
      </Row>

      <DrawerTableOrders
        visible={drawerTableVisible}
        orders={selectedOrders}
        onClose={() => setDrawerTableVisible(false)}
        onSelectOrder={handleOrderClick}
      />

      <DrawerOrderDetails
        visible={drawerOrderVisible}
        order={selectedOrder}
        onClose={() => setDrawerOrderVisible(false)}
      />
    </>
  );
};

export default TableGrid;
