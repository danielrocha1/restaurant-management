// tables/components/DrawerOrderDetails.jsx
import React from "react";
import { Drawer, List, Image, Typography } from "antd";

const { Title, Text } = Typography;

const DrawerOrderDetails = ({ visible, onClose, order }) => (
  <Drawer
    title={<Title level={4}>Detalhes do Pedido #{order?.order_id}</Title>}
    width={600}
    placement="right"
    onClose={onClose}
    open={visible}
  >
    {!order ? (
      <Text>Nenhum produto encontrado.</Text>
    ) : order.produtos.length === 0 ? (
      <Text>Nenhum produto neste pedido.</Text>
    ) : (
      <List
        itemLayout="horizontal"
        dataSource={order.produtos}
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
    )}
  </Drawer>
);

export default DrawerOrderDetails;