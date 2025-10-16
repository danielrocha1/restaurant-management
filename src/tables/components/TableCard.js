// tables/components/TableCard.jsx
import React from "react";
import { Card, Spin, Tag } from "antd";

const TableCard = ({ table, onClick, loading }) => (
  <Card
    hoverable={!loading}
    onClick={() => !loading && onClick(table)}
    style={{
      width: 100,
      height: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: table.isOpen ? "#52c41a" : "#d9d9d9",
      color: "#fff",
      fontWeight: 700,
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
        <div style={{ fontSize: 18 }}>Mesa {table.number}</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>
          {table.isOpen ? <Tag color="success">Aberta</Tag> : <Tag>Fechada</Tag>}
        </div>
      </div>
    )}
  </Card>
);

export default TableCard;