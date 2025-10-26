// tables/TableGrid.jsx
import React, { useState, useCallback, useEffect } from "react";
import { Row, Col, notification, Skeleton, Typography, Button, Space, Divider } from "antd";
import {
  CoffeeOutlined,
  AlertOutlined,
  ReloadOutlined,
  TableOutlined,
} from "@ant-design/icons";
import TableCard from "./components/TableCard";
import DrawerTableOrders from "./components/DrawerTableOrders";
import DrawerOrderDetails from "./components/DrawerOrderDetails";
import { useTables } from "../context/tablesContext";
import { useWS } from "../context/wsContext";

const { Title, Text } = Typography;

const TableGrid = () => {
  // --- FIX: chamar o hook corretamente e incluir setTables
  const { tables = [], loadingTables, errorTables, fetchTables, setTables } = useTables();
  const { messages } = useWS();

  // Estados locais
  const [loadingTableId, setLoadingTableId] = useState(null);

  // Estados dos Drawers e Dados Selecionados
  const [drawerTableVisible, setDrawerTableVisible] = useState(false);
  const [drawerOrderVisible, setDrawerOrderVisible] = useState(false);

  // Dados da Mesa selecionada
  const [selectedTableID, setSelectedTableID] = useState(null);
  const [selectedTableNumber, setSelectedTableNumber] = useState(null);

  // Pedidos da Mesa selecionada
  const [selectedTableOrders, setSelectedTableOrders] = useState([]);
  // Pedido Detalhe selecionado
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // ==================  Extra: processar mensagens WS para adicionar mesas ==================
  useEffect(() => {
    if (!messages) return;

    // messages pode ser array ou objeto — pegamos a última se for array
    const raw = Array.isArray(messages) ? messages[messages.length - 1] : messages;
    if (!raw) return;

    let parsed = raw;
    if (typeof raw === "string") {
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        console.warn("Mensagem WS não é JSON:", raw);
        return;
      }
    }

    // Só seguimos se action === 'addTable'
    if (parsed && parsed.action === "addTable") {
      const incoming = parsed.table || parsed.tables || parsed.tableData || [];
      // garantir que seja array
      const incomingArray = Array.isArray(incoming) ? incoming : [incoming];

      if (incomingArray.length === 0) return;

      // Adiciona as mesas novas evitando duplicatas por id
      setTables((prev = []) => {
        const existIds = new Set(prev.map((t) => t.id));
        const toAdd = incomingArray.filter((t) => t && typeof t.id !== "undefined" && !existIds.has(t.id));
        if (toAdd.length < 0) return prev;
        const newArr = [...prev, ...toAdd];
        notification.open({
      message: "Nova(s) Mesa(s) Adicionada(s)",
      description: `1 mesa(s) adicionada(s) via WebSocket.`,
      icon: <TableOutlined style={{ color: "#1890ff" }} />,
      duration: 4, // Duração em segundos (0 = infinito)
      placement: "topRight", // Posição da notificação
    });
        return newArr;
      });
    }
  }, [messages, setTables]);

  // ===== 1. Carregar Pedidos da Mesa (Refatorado com useCallback) =====
  const handleTableClick = useCallback(
    async (table) => {
      setLoadingTableId(table.id);
      setSelectedTableID(table.id);
      setSelectedTableNumber(table.number);
      setSelectedTableOrders([]); // limpa lista anterior
      setDrawerTableVisible(true); // abre o Drawer imediatamente (mostrando loading)

      const controller = new AbortController();
      const url = "https://restaurant-sw98.onrender.com/tables/view";
      const body = { number: table.id };

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Erro ao buscar pedidos");
        }

        const data = await res.json();
        setSelectedTableOrders(data);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        console.error(err);
        setDrawerTableVisible(false);
        setSelectedTableID(null);
        setSelectedTableNumber(null);
      } finally {
        setLoadingTableId(null);
      }

      // OBS: este return não é usado quando handleTableClick é chamado diretamente.
      // Se quiser abortar fetch ao desmontar, gerencie o controller com useEffect.
      return () => controller.abort();
    },
    []
  );

  // ===== 2. Selecionar Pedido para Detalhes =====
  const handleOrderClick = useCallback((order) => {
    setSelectedOrderDetails(order);
    setDrawerOrderVisible(true);
  }, []);

  // ===== 3. Funções de Fechamento =====
  const closeTableDrawer = useCallback(() => {
    setDrawerTableVisible(false);
    setSelectedTableOrders([]); // Limpa os dados ao fechar
    setSelectedTableID(null);
    setSelectedTableNumber(null);
    setLoadingTableId(null);
  }, []);

  const closeOrderDrawer = useCallback(() => {
    setDrawerOrderVisible(false);
    setSelectedOrderDetails(null); // Limpa os dados ao fechar
  }, []);

  // ==================== Renderização ====================
  if (errorTables) {
    return (
      <div style={{ padding: 50, textAlign: "center", backgroundColor: "#fffbe6", borderRadius: 8, border: "1px solid #ffe58f" }}>
        <AlertOutlined style={{ fontSize: 40, color: "#faad14", marginBottom: 10 }} />
        <Title level={4} style={{ color: "#faad14" }}>Erro ao Conectar com o Servidor</Title>
        <p>Não foi possível carregar a lista de mesas. Verifique sua conexão ou tente novamente.</p>
        <Button type="primary" onClick={() => fetchTables && fetchTables()} icon={<ReloadOutlined />}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Cabeçalho no Estilo dos Outros Modelos */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: "#333", marginBottom: "10px" }}>
            <TableOutlined style={{ marginRight: 10, color: "#1890ff" }} />
            Monitoramento de Mesas Abertas
          </Title>
          <Text type="primary">
            Clique em uma mesa para visualizar os itens, imprimir a comanda ou fechar a mesa.
          </Text>
        </Col>
        <Col>
          <Space>
            <Button onClick={() => fetchTables && fetchTables()} loading={loadingTables} icon={<ReloadOutlined />} type="primary">
              Recarregar Mesas
            </Button>
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: "15px 0" }} />

      <Row gutter={[20, 20]} justify="start">
        {/* Skeleton */}
        {loadingTables
          ? Array.from({ length: 15 }).map((_, idx) => (
              <Col key={idx} xs={12} sm={8} md={6} lg={4} xl={3}>
                <Skeleton.Input style={{ width: "100%", height: 120, borderRadius: 12, minWidth: 100 }} active />
              </Col>
            ))
          : tables.map((table) => (
              <Col key={table.id} xs={12} sm={8} md={6} lg={4} xl={3}>
                <TableCard table={table} loading={loadingTableId === table.id} onClick={handleTableClick} />
              </Col>
            ))}

        {/* Se não houver mesas */}
        {!loadingTables && (tables?.length || 0) === 0 && (
          <Col span={24} style={{ textAlign: "center", padding: 50, background: "#fff", borderRadius: 8 }}>
            <CoffeeOutlined style={{ fontSize: 40, color: "#ccc", marginBottom: 10 }} />
            <Title level={4} style={{ color: "#555" }}>Nenhuma Mesa Aberta Encontrada</Title>
            <p>O restaurante está vazio ou há um problema de dados.</p>
            <Button type="default" onClick={() => fetchTables && fetchTables()} icon={<ReloadOutlined />}>
              Verificar Novamente
            </Button>
          </Col>
        )}
      </Row>

      {/* Drawers */}
      <DrawerTableOrders
        visible={drawerTableVisible}
        tableID={selectedTableID}
        orders={selectedTableOrders}
        tableNumber={selectedTableNumber}
        loadingOrders={loadingTableId === selectedTableID && (selectedTableOrders?.length || 0) === 0}
        onClose={closeTableDrawer}
        onSelectOrder={handleOrderClick}
      />

      <DrawerOrderDetails visible={drawerOrderVisible} order={selectedOrderDetails} onClose={closeOrderDrawer} />
    </div>
  );
};

export default TableGrid;
