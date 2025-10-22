// tables/components/TableCard.jsx
import React from "react";
import { Card, Spin, Tag, Typography } from "antd";
import { TableOutlined, HourglassOutlined } from "@ant-design/icons"; // Novos ícones

const { Title, Text } = Typography;

const TableCard = ({ table, onClick, loading }) => {
  
  // Cores de status aprimoradas e baseadas no Ant Design
  const statusColor = table.isOpen ? "#52c41a" : "#faad14"; // Verde para Aberta, Laranja para Fechada/Disponível
  const cardShadow = table.isOpen ? "0 4px 12px rgba(82, 196, 26, 0.3)" : "0 4px 12px rgba(250, 173, 20, 0.2)";
  
  return (
    <Card
      hoverable={!loading}
      onClick={() => !loading && onClick(table)}
      // Aumentamos o tamanho para melhor usabilidade em touch/mobile
      style={{
        width: '100%',
        maxWidth: 150, 
        height: 150,
        borderRadius: 12,
        boxShadow: loading ? "none" : cardShadow, // Sombra para efeito moderno
        border: loading ? '2px dashed #1890ff' : `1px solid ${statusColor}`,
        transition: 'all 0.3s',
        cursor: loading ? "wait" : "pointer",
        overflow: 'hidden',
        padding: 0
      }}
      bodyStyle={{
        display: "flex",
        flexDirection: 'column',
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        height: '100%',
      }}
    >
      {loading ? (
        // Loading suave e informativo
        <div style={{ textAlign: 'center' }}>
          <Spin indicator={<HourglassOutlined style={{ fontSize: 28, color: '#1890ff' }} spin />} />
          <Text style={{ marginTop: 8, display: 'block', color: '#1890ff' }}>Carregando...</Text>
        </div>
      ) : (
        <>
          {/* Ícone da Mesa */}
          <TableOutlined style={{ 
              fontSize: 32, 
              color: statusColor, 
              marginBottom: 4 
          }} />
          
          
          <Text type="secondary" style={{
                fontWeight: 800,
                fontSize: 18, marginBottom: 2 }}>
            Mesa
          </Text>
          {/* Número da Mesa em destaque */}
          <Title 
            level={3} 
            style={{ 
                margin: 0, 
                color: '#333', 
                fontWeight: 800,
                fontSize: 28 
            }}
          >
            {table.number}
          </Title>
          
          {/* Tag de Status com cor consistente */}
          <Tag 
            color={table.isOpen ? "success" : "warning"}
            style={{ fontWeight: 800, fontSize: 19, padding: '4px 8px' }}
          >
          </Tag>
        </>
      )}
    </Card>
  );
};

export default TableCard;