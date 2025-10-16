// tables/components/DrawerTableOrders.jsx
import React from "react";
import { Drawer, Typography, Button, Card, message } from "antd";
// Importar a função de impressão
import { printOrders } from "../utils/printOrders"; 

const { Title, Text } = Typography;

const DrawerTableOrders = ({
  visible,
  onClose,
  orders,
  onSelectOrder,
  tableNumber,
}) => {
  const totalGeral = orders.reduce(
    (sum, order) =>
      sum + order.produtos.reduce((s, p) => s + Number(p.total_item), 0),
    0
  );

  return (
    <Drawer
      title={<Title level={4}>Pedidos da Mesa {tableNumber}</Title>}
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
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="default"
              // Uso da função importada
              onClick={() => printOrders(orders, tableNumber)} 
              disabled={orders.length === 0}
            >
              Imprimir Recibo
            </Button>
            <Button
              type="primary"
              danger
              onClick={() => message.success("Mesa fechada com sucesso!")}
            >
              Fechar Mesa
            </Button>
          </div>
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
            <Card
              key={order.order_id}
              style={{
                marginBottom: 12,
                cursor: "pointer",
                backgroundColor: "#fafafa",
              }}
              onClick={() => onSelectOrder(order)}
              hoverable
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text strong>Pedido #{order.order_id}</Text>
                <Text>Total: R$ {total.toFixed(2)}</Text>
              </div>
              <Text type="secondary">
                {new Date(order.pedido_created_at).toLocaleString()}
              </Text>
            </Card>
          );
        })
      )}
    </Drawer>
  );
};

export default DrawerTableOrders;