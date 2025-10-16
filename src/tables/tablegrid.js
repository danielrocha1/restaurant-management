// tables/TableGrid.jsx
import React, { useState, useEffect } from "react";
import { Row, Col, Spin, message, Skeleton } from "antd";

// Importar os componentes separados
import TableCard from "./components/TableCard";
import DrawerTableOrders from "./components/DrawerTableOrders";
import DrawerOrderDetails from "./components/DrawerOrderDetails"; 

// ==================== Componente Principal ====================
const TableGrid = () => {
  const [tables, setTables] = useState([]);
  const [loadingTableId, setLoadingTableId] = useState(null);
  const [loadingTables, setLoadingTables] = useState(true);

  const [drawerTableVisible, setDrawerTableVisible] = useState(false);
  const [drawerOrderVisible, setDrawerOrderVisible] = useState(false);

  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedTableNumber, setSelectedTableNumber] = useState(null);

  // ===== Carregar mesas =====
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await fetch(
          "https://restaurant-sw98.onrender.com/tables/isopen"
        );
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
      } finally {
        setLoadingTables(false);
      }
    };
    fetchTables();
  }, []);

  const handleTableClick = async (table) => {
    setLoadingTableId(table.id);
    const url = "https://restaurant-sw98.onrender.com/tables/view";
    const body = { number: table.id };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setSelectedOrders(data);
      setSelectedTableNumber(table.number);
      setDrawerTableVisible(true);
    } catch (err) {
      message.error("Falha ao carregar pedidos da mesa");
    } finally {
      setLoadingTableId(null);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setDrawerOrderVisible(true);
  };

  return (
    <>
      <Row gutter={[16, 16]}>
        {loadingTables
          ? Array.from({ length: 10 }).map((_, idx) => (
              <Col key={idx}>
                <Skeleton.Input style={{ width: 100, height: 100 }} active />
              </Col>
            ))
          : tables.map((table) => (
              <Col key={table.id}>
                <TableCard
                  table={table}
                  loading={loadingTableId === table.id}
                  onClick={handleTableClick}
                />
              </Col>
            ))}
      </Row>

      <DrawerTableOrders
        visible={drawerTableVisible}
        orders={selectedOrders}
        tableNumber={selectedTableNumber}
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