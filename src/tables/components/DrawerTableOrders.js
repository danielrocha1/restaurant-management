// tables/components/DrawerTableOrders.jsx
import React, { useState } from "react"; // useState está importado corretamente
import { Drawer, Typography, Button, Card, message } from "antd";
import { printOrders } from "../utils/printOrders";
import DrawerPayment from "./DrawerPayments"; // Importação renomeada de volta para DrawerPayment, se necessário.

const { Title, Text } = Typography;

const DrawerTableOrders = ({
  visible,
  onClose,
  orders,
  tableID,
  onSelectOrder, //TEM QUE PEGAR TABLE.ID PARA SALVAR NO PAGAMENTO
  tableNumber,
  onTableClosed,  
}) => {
  // CORREÇÃO 2: Declaração do estado para o Drawer de Pagamento
  const [paymentDrawerVisible, setPaymentDrawerVisible] = useState(false);

  const totalGeral = orders.reduce(
    (sum, order) =>
      sum + order.produtos.reduce((s, p) => s + Number(p.total_item), 0),
    0
  );

  // Função para fechar o Drawer de Pagamento
  const handlePaymentDrawerClose = () => {
    setPaymentDrawerVisible(false);
  };

  // Função chamada quando a mesa é fechada com sucesso
  const handlePaymentSuccess = () => {
    onClose(); // Fecha o Drawer de Pedidos
    if (onTableClosed) {
      onTableClosed(tableNumber); // Notifica o componente pai para atualizar a lista de mesas
    }
  };

  return (
    <>
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
                onClick={() => printOrders(orders, tableNumber)}
                disabled={orders.length === 0}
              >
                Imprimir Recibo
              </Button>
              <Button
                type="primary"
                danger
                onClick={() => {
                  if (orders.length > 0) {
                    setPaymentDrawerVisible(true);
                  } else {
                    message.warning("Adicione pedidos antes de fechar a mesa.");
                  }
                }}
                disabled={orders.length === 0}
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

      {/* DRAWER DE PAGAMENTO */}
      <DrawerPayment
        tableID={tableID}
        visible={paymentDrawerVisible}
        onClose={handlePaymentDrawerClose}
        totalToPay={totalGeral}
        tableNumber={tableNumber}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default DrawerTableOrders;