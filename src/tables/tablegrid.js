// tables/TableGrid.jsx
import React, { useState, useCallback, useEffect } from "react";
 
 import "antd/dist/reset.css";
import {
  Row,
  Col,
  Skeleton,
  Typography,
  Button,
  Space,
  Divider,
} from "antd";
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
import { useNotifications } from "../context/notificationContext";

const { Title, Text } = Typography;

const TableGrid = () => {
  // hooks do contexto
  const { tables = [], loadingTables, errorTables, fetchTables, setTables } = useTables();
  const { messages } = useWS();
  const { notifications } = useNotifications();

  // estados locais
  const [loadingTableId, setLoadingTableId] = useState(null);
  const [drawerTableVisible, setDrawerTableVisible] = useState(false);
  const [drawerOrderVisible, setDrawerOrderVisible] = useState(false);
  const [selectedTableID, setSelectedTableID] = useState(null);
  const [selectedTableNumber, setSelectedTableNumber] = useState(null);
  const [selectedTableOrders, setSelectedTableOrders] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // ========== WS: processar mensagens para adicionar mesas ==========
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    // Pega a última mensagem
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    let parsed = lastMessage;
    if (typeof lastMessage === "string") {
      try {
        parsed = JSON.parse(lastMessage);
      } catch (e) {
        console.warn("Mensagem WS não é JSON:", lastMessage);
        return;
      }
    }

    // Processa apenas mensagens de adição de mesa
    if (parsed && parsed.action === "addTable") {
      const incoming = parsed.table || parsed.tables || parsed.tableData || [];
      const incomingArray = Array.isArray(incoming) ? incoming : [incoming];

      if (incomingArray.length === 0) return;

      // Calcula o que realmente será adicionado (evita duplicatas por id)
      setTables((prev = []) => {
        const existIds = new Set(prev.map((t) => t.id));
        const toAdd = incomingArray.filter((t) => t && typeof t.id !== "undefined" && !existIds.has(t.id));

        if (toAdd.length === 0) {
          return prev;
        }

        const newArr = [...prev, ...toAdd];

        // A notificação agora é tratada pelo contexto de notificações
        // através do wsContext, então não precisamos duplicar aqui

        return newArr;
      });
    }
  }, [messages, setTables]);

  // ===== 1. Carregar Pedidos da Mesa =====
  const handleTableClick = useCallback(
    async (table) => {
      setLoadingTableId(table.id);
      setSelectedTableID(table.id);
      setSelectedTableNumber(table.number);
      setSelectedTableOrders([]); // limpa lista anterior
      setDrawerTableVisible(true); // abre o Drawer mostrando loading

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
        
        // Notificação de sucesso ao carregar pedidos
        notifications.system.success(
          "Pedidos Carregados",
          `Pedidos da Mesa ${table.number} carregados com sucesso.`
        );
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        console.error(err);
        
        // Notificação de erro
        notifications.system.error(
          "Erro ao Carregar Pedidos",
          `Não foi possível carregar os pedidos da Mesa ${table.number}.`
        );
        
        setDrawerTableVisible(false);
        setSelectedTableID(null);
        setSelectedTableNumber(null);
      } finally {
        setLoadingTableId(null);
      }

      return () => controller.abort();
    },
    [notifications]
  );

  // ===== 2. Selecionar Pedido para Detalhes =====
  const handleOrderClick = useCallback((order) => {
    setSelectedOrderDetails(order);
    setDrawerOrderVisible(true);
  }, []);

  // ===== 3. Funções de Fechamento =====
  const closeTableDrawer = useCallback(() => {
    setDrawerTableVisible(false);
    setSelectedTableOrders([]);
    setSelectedTableID(null);
    setSelectedTableNumber(null);
    setLoadingTableId(null);
  }, []);

  const closeOrderDrawer = useCallback(() => {
    setDrawerOrderVisible(false);
    setSelectedOrderDetails(null);
  }, []);

  // Função para recarregar mesas com notificação
  const handleReloadTables = useCallback(() => {
    if (fetchTables) {
      fetchTables();
      notifications.system.info("Recarregando", "Atualizando lista de mesas...");
    }
  }, [fetchTables, notifications]);

  // ==================== Renderização ====================
  if (errorTables) {
    return (
      <div style={{ padding: 50, textAlign: "center", backgroundColor: "#fffbe6", borderRadius: 8, border: "1px solid #ffe58f" }}>
        <AlertOutlined style={{ fontSize: 40, color: "#faad14", marginBottom: 10 }} />
        <Title level={4} style={{ color: "#faad14" }}>Erro ao Conectar com o Servidor</Title>
        <p>Não foi possível carregar a lista de mesas. Verifique sua conexão ou tente novamente.</p>
        <Button type="primary" onClick={handleReloadTables} icon={<ReloadOutlined />}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: "#f0f2f5", minHeight: "100vh" }}>
      {/* Cabeçalho */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
        <Col>
          <Title level={2} style={{ margin: 0, color: "#333", marginBottom: "10px" }}>
            <TableOutlined style={{ marginRight: 10, color: "#1890ff" }} />
            Monitoramento de Mesas Abertas
          </Title>
          <Text type="secondary">
            Clique em uma mesa para visualizar os itens, imprimir a comanda ou fechar a mesa.
          </Text>
        </Col>
        <Col>
          <Space>
            <Button 
              onClick={handleReloadTables} 
              loading={loadingTables} 
              icon={<ReloadOutlined />} 
              type="primary"
            >
              Recarregar Mesas
            </Button>
          </Space>
        </Col>
      </Row>

      <Divider style={{ margin: "15px 0" }} />

      <Row gutter={[20, 20]} justify="start">
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

        {!loadingTables && (tables?.length || 0) === 0 && (
          <Col span={24} style={{ textAlign: "center", padding: 50, background: "#fff", borderRadius: 8 }}>
            <CoffeeOutlined style={{ fontSize: 40, color: "#ccc", marginBottom: 10 }} />
            <Title level={4} style={{ color: "#555" }}>Nenhuma Mesa Aberta Encontrada</Title>
            <p>O restaurante está vazio ou há um problema de dados.</p>
            <Button type="default" onClick={handleReloadTables} icon={<ReloadOutlined />}>
              Verificar Novamente
            </Button>
          </Col>
        )}
      </Row>

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