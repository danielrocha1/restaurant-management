// tables/TableGrid.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, message, Skeleton, Typography, Button, Space, Divider } from "antd"; // Importando Space e Divider
import { 
    CoffeeOutlined, 
    AlertOutlined, 
    ReloadOutlined, 
    TableOutlined,
    PrinterOutlined, // Ícone para Imprimir
    CloseCircleOutlined // Ícone para Fechar Pedido
} from "@ant-design/icons"; 
import TableCard from "./components/TableCard";
import DrawerTableOrders from "./components/DrawerTableOrders";
import DrawerOrderDetails from "./components/DrawerOrderDetails"; 

const { Title, Text } = Typography;

// ==================== Componente Principal ====================
const TableGrid = () => {
  // Estado para a lista de mesas
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingTableId, setLoadingTableId] = useState(null);
  const [errorTables, setErrorTables] = useState(false);

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


  // ===== 1. Carregar Mesas (Refatorado) =====
  const fetchTables = useCallback(async () => {
    setLoadingTables(true);
    setErrorTables(false);
    try {
      const res = await fetch("https://restaurant-sw98.onrender.com/tables/isopen");
      
      if (!res.ok) {
        throw new Error("Falha na resposta da API");
      }
      
      const data = await res.json();
      
      const mapped = data.map((t) => ({
        id: t.id,
        number: t.number,
        isOpen: Boolean(t.is_open),
      }));
      
      setTables(mapped);
      
    } catch (err) {
      console.error(err);
      setErrorTables(true);
      message.error("Falha ao carregar mesas. Tente recarregar.");
    } finally {
      setLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

 

  // ===== 2. Carregar Pedidos da Mesa (Refatorado com useCallback) =====
  const handleTableClick = useCallback(async (table) => {
    // 1. Setar estados
    setLoadingTableId(table.id);
    setSelectedTableID(table.id);
    setSelectedTableNumber(table.number);
    setSelectedTableOrders([]); // Limpa a lista anterior
    setDrawerTableVisible(true); // Abre o Drawer imediatamente, mostrando o loading

    const url = "https://restaurant-sw98.onrender.com/tables/view";
    const body = { number: table.id }; 

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Erro ao buscar pedidos");
      }

      const data = await res.json();
      setSelectedTableOrders(data);
      
    } catch (err) {
      message.error(`Falha ao carregar pedidos da Mesa ${table.number}.`);
      setDrawerTableVisible(false); 
      setSelectedTableID(null);
      setSelectedTableNumber(null);
      
    } finally {
      setLoadingTableId(null);
    }
  }, []);

  // ===== 3. Selecionar Pedido para Detalhes (Otimizado) =====
  const handleOrderClick = useCallback((order) => {
    setSelectedOrderDetails(order);
    setDrawerOrderVisible(true);
  }, []);

  // ===== 4. Funções de Fechamento (Otimizado) =====
  const closeTableDrawer = useCallback(() => {
    setDrawerTableVisible(false);
    setSelectedTableOrders([]); // Limpa os dados ao fechar
  }, []);

  const closeOrderDrawer = useCallback(() => {
    setDrawerOrderVisible(false);
    setSelectedOrderDetails(null); // Limpa os dados ao fechar
  }, []);
  
  
  // ==================== Renderização ====================
  
  // Feedback de Erro
  if (errorTables) {
      return (
          <div style={{ padding: 50, textAlign: 'center', backgroundColor: '#fffbe6', borderRadius: 8, border: '1px solid #ffe58f' }}>
              <AlertOutlined style={{ fontSize: 40, color: '#faad14', marginBottom: 10 }} />
              <Title level={4} style={{ color: '#faad14' }}>Erro ao Conectar com o Servidor</Title>
              <p>Não foi possível carregar a lista de mesas. Verifique sua conexão ou tente novamente.</p>
              <Button type="primary" onClick={fetchTables} icon={<ReloadOutlined />}>
                  Tentar Novamente
              </Button>
          </div>
      );
  }

  return (
    <div style={{ padding: 24, background: '#f0f2f5', minHeight: '100vh' }}>
        
        {/* Cabeçalho no Estilo dos Outros Modelos */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
            <Col>
                <Title level={2} style={{ margin: 0, color: '#333', marginBottom:"10px" }}>
                    <TableOutlined style={{ marginRight: 10, color: '#1890ff' }} />
                    Monitoramento de Mesas Abertas
                </Title>
                <Text type="primary">
                    Clique em uma mesa para visualizar os itens, imprimir a comanda ou fechar a mesa.
                </Text>
            </Col>
            <Col>
                <Space>
                    <Button onClick={fetchTables} loading={loadingTables} icon={<ReloadOutlined />} type="primary">
                        Recarregar Mesas
                    </Button>
                </Space>
            </Col>
        </Row>
        <Divider style={{ margin: '15px 0' }} />
        
        <Row gutter={[20, 20]} justify="start"> 
            
            {/* Usando Skeleton para Carregamento Inicial */}
            {loadingTables
            ? Array.from({ length: 15 }).map((_, idx) => ( 
                <Col 
                    key={idx}
                    xs={12} sm={8} md={6} lg={4} xl={3}
                >
                    <Skeleton.Input 
                        style={{ 
                            width: '100%', 
                            height: 120, 
                            borderRadius: 12, 
                            minWidth: 100 
                        }} 
                        active 
                    />
                </Col>
                ))
            : tables.map((table) => (
                <Col 
                    key={table.id}
                    xs={12} sm={8} md={6} lg={4} xl={3}
                >
                    <TableCard
                        table={table}
                        loading={loadingTableId === table.id} 
                        onClick={handleTableClick}
                    />
                </Col>
                ))}
                
            {/* Se não houver mesas */}
            {!loadingTables && tables.length === 0 && (
                <Col span={24} style={{ textAlign: 'center', padding: 50, background: '#fff', borderRadius: 8 }}>
                    <CoffeeOutlined style={{ fontSize: 40, color: '#ccc', marginBottom: 10 }} />
                    <Title level={4} style={{ color: '#555' }}>Nenhuma Mesa Aberta Encontrada</Title>
                    <p>O restaurante está vazio ou há um problema de dados.</p>
                    <Button type="default" onClick={fetchTables} icon={<ReloadOutlined />}>
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
            loadingOrders={loadingTableId === selectedTableID && selectedTableOrders.length === 0} 
            onClose={closeTableDrawer} 
            onSelectOrder={handleOrderClick} 
        />

        <DrawerOrderDetails
            visible={drawerOrderVisible}
            order={selectedOrderDetails}
            onClose={closeOrderDrawer} 
        />
    </div>
  );
};

export default TableGrid;