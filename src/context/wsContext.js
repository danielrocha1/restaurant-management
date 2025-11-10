import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNotifications } from "./notificationContext";
import { printKitchenOrder } from "../tables/utils/printKitchen";
// --- Contexto WS ---
const WSContext = createContext();

export const WSProvider = ({ children }) => {
  // --- estado visível para UI ---
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // connecting, connected, disconnected, error
  const [reconnectAttempts, setReconnectAttempts] = useState(0); // apenas para UI

  // --- refs para controlar sem re-render ---
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const attemptsRef = useRef(0); // controla tentativas sem re-render
  const mountedRef = useRef(false);
  const manualCloseRef = useRef(false);

  console.log("WSProvider: render — connectionStatus:", connectionStatus, "reconnectAttempts:", reconnectAttempts);

  // pegar as funções de notification e manter em ref para evitar stale closures
  // <-- CORREÇÃO APLICADA: desestruturamos para pegar somente `notifications`
  const { notifications } = useNotifications();
  const notificationsRef = useRef(notifications);

  useEffect(() => {
    // atualiza ref sempre que muda
    console.log("notifications updated", { notifications });
    notificationsRef.current = notifications;
  }, [notifications]);

  // ref para status atual (evita dependências em callbacks do WS)
  const connectionStatusRef = useRef(connectionStatus);
  useEffect(() => {
    console.log("connectionStatus mudou ->", connectionStatus);
    connectionStatusRef.current = connectionStatus;
  }, [connectionStatus]);

  // --- configs de reconnect ---
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 3000; // ms

  const calcDelay = (attempt) =>
    Math.min(baseReconnectDelay * Math.pow(1.5, attempt - 1), 30000);

  // --- função de conectar ---
  const connect = useCallback(() => {
    console.log("connect() chamado — mounted:", mountedRef.current);
    if (!mountedRef.current) {
      console.log("connect: provider não montado, abortando");
      return;
    }

    const existing = wsRef.current;
    console.log("connect: estado wsRef.current ->", existing && existing.readyState);

    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      console.log("WS: já existe conexão ativa/connecting — ignorando connect()");
      return;
    }

    try {
      console.log("WS: criando nova conexão...");
      const ws = new WebSocket("wss://restaurant-2dfg.onrender.com/ws");
      wsRef.current = ws;
      manualCloseRef.current = false;

      // --- onopen ---
      ws.onopen = () => {
        console.log("WebSocket onopen fired");

        // Guarda estado antes de resetar
        const prevAttempts = attemptsRef.current;
        const prevStatus = connectionStatusRef.current;
        console.log("onopen: prevAttempts =", prevAttempts, "prevStatus =", prevStatus);

        // reset de tentativas
        attemptsRef.current = 0;
        setReconnectAttempts(0);
        setConnectionStatus("connected");
        connectionStatusRef.current = "connected";

        // limpa timeout de reconexão pendente
        if (reconnectTimeoutRef.current) {
          console.log("onopen: limpando timeout de reconnect pendente");
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Dispara notificação de restauração se:
        const shouldNotifyRestore = prevAttempts > 0 || prevStatus === "error";

        if (shouldNotifyRestore) {
          console.log("onopen: disparando connectionRestored");
          notificationsRef.current?.connectionRestored &&
            notificationsRef.current.connectionRestored();
        } else {
          console.log("onopen: conexão estabelecida sem necessidade de 'restaurar' (primeira conexão)");
        }
      };

      // --- onmessage ---
      ws.onmessage = (event) => {
        console.log("WebSocket onmessage recebido ->", event.data);
        try {
          const data = JSON.parse(event.data);
          console.log("onmessage: data parsed ->", data);
          setMessages((prev) => {
            const next = [...prev, data];
            console.log("onmessage: adicionando mensagem — total agora:", next.length);
            return next;
          });
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Erro ao processar mensagem WebSocket:", error);
        }
      };

      // --- onclose ---
      ws.onclose = (event) => {
        console.log("WebSocket onclose:", { code: event.code, reason: event.reason, wasClean: event.wasClean });

        if (manualCloseRef.current) {
          console.log("onclose: fechamento manual solicitado, setando disconnected");
          setConnectionStatus("disconnected");
          connectionStatusRef.current = "disconnected";
          return;
        }

        console.log("onclose: fechamento não manual — iniciando fluxo de reconexão");
        setConnectionStatus("disconnected");
        connectionStatusRef.current = "disconnected";

        if (!mountedRef.current) {
          console.log("onclose: provider desmontado, abortando reconexão");
          return;
        }

        if (attemptsRef.current < maxReconnectAttempts) {
          attemptsRef.current += 1;
          setReconnectAttempts(attemptsRef.current);
          console.log("onclose: incrementando attemptsRef ->", attemptsRef.current);
          scheduleReconnect();
        } else {
          console.log("onclose: atingiu maxReconnectAttempts", attemptsRef.current);
          if (connectionStatusRef.current !== "error") {
            setConnectionStatus("error");
            connectionStatusRef.current = "error";
            notificationsRef.current?.connectionError &&
              notificationsRef.current.connectionError(
                "Não foi possível restabelecer a conexão após várias tentativas."
              );
          }
        }
      };

      // --- onerror ---
      ws.onerror = (error) => {
        console.error("WebSocket erro:", error);

        if (manualCloseRef.current) {
          console.log("onerror: fechamento manual, ignorando erro");
          return;
        }

        // marca erro (mas evita duplicar notificações)
        if (connectionStatusRef.current !== "error") {
          console.log("onerror: setando status error e notificar");
          setConnectionStatus("error");
          connectionStatusRef.current = "error";
          notificationsRef.current?.connectionError &&
            notificationsRef.current.connectionError("Erro na conexão WebSocket.");
        }

        // deixamos o onclose cuidar do retry (o browser normalmente chama onclose depois)
      };

      console.log("connect: event handlers set");
    } catch (err) {
      console.error("Erro ao criar conexão WebSocket:", err);
      if (connectionStatusRef.current !== "error") {
        setConnectionStatus("error");
        connectionStatusRef.current = "error";
        notificationsRef.current?.connectionError &&
          notificationsRef.current.connectionError("Falha ao estabelecer conexão WebSocket.");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- scheduleReconnect ---
  const scheduleReconnect = useCallback(() => {
    console.log("scheduleReconnect chamado — attemptsRef:", attemptsRef.current);
    if (reconnectTimeoutRef.current) {
      console.log("scheduleReconnect: já existe timeout pendente, limpando");
      clearTimeout(reconnectTimeoutRef.current);
    }

    const attempt = attemptsRef.current || 1;
    const delay = calcDelay(attempt);

    console.log(`WS: agendando reconexão em ${delay}ms (tentativa ${attempt}/${maxReconnectAttempts})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log("timeout de reconnect disparou — mounted:", mountedRef.current);
      if (!mountedRef.current) {
        console.log("timeout: provider desmontado, abortando connect");
        return;
      }
      setConnectionStatus("connecting");
      connectionStatusRef.current = "connecting";
      connect();
    }, delay);
  }, [connect]);

  // --- handler de mensagens WS (interpretação/dispatch para notifications) ---
  const handleWebSocketMessage = useCallback((data) => {
    console.log("handleWebSocketMessage ->", data);
    if (!data || !data.action) {
      console.log("handleWebSocketMessage: sem action — ignorando");
      return;
    }
    const n = notificationsRef.current;

    switch (data.action) {
      case "addTable": {
        console.log("action addTable recebida");
        const tableData = data.table || data.tables || data.tableData;
        console.log("addTable: tableData ->", tableData);
        if (tableData) n?.newTable && n.newTable(tableData);
        break;
      }
      case "newOrder": {
        console.log("action newOrder recebida");
        const orderData = {
          tableNumber: data.tableNumber || data.table_number || data.mesaid,
          orderTotal: data.order.Total,
          itemCount:  data.order.Items?.length,
        };
        console.log("newOrder: orderData ->", orderData);
        n?.newOrder && n.newOrder(orderData);
        printKitchenOrder(data.order.Items, data.mesaid)
        break;
      }
      case "closeTable":{
        console.log("action tableClosed recebida");
        const tableData = {
          tableNumber: data.table || data.table_number || data.mesa,
        };
        console.log("tableClosed: tableData ->", tableData);
        n?.tableClosed && n.tableClosed(tableData);
        break;
      }

      case "paymentCompleted": {
        console.log("action tableClosed/paymentCompleted recebida");
        const paymentData = {
          tableNumber: data.tableNumber || data.table_number || data.mesa,
          totalAmount: data.totalAmount || data.total || data.valor,
          paymentMethod: data.paymentMethod || data.payment_method || data.metodo_pagamento,
        };
        console.log("paymentData ->", paymentData);
        n?.tableClosed && n.tableClosed(paymentData);
        break;
      }
      case "lowStock": {
        console.log("action lowStock recebida");
        const productData = {
          productName: data.productName || data.produto || data.nome,
          currentStock: data.currentStock || data.estoque || data.quantidade,
        };
        console.log("lowStock: productData ->", productData);
        n?.lowStock && n.lowStock(productData);
        break;
      }
      case "systemMessage": {
        console.log("action systemMessage recebida");
        n?.custom &&
          n.custom({
            message: data.title || data.titulo || "Mensagem do Sistema",
            description: data.message || data.mensagem || data.description,
            duration: data.duration || 5,
          });
        break;
      }
      default: {
        console.log("action desconhecida ->", data.action);
        if (data.message || data.mensagem) {
          console.log("default: tratando message/mensagem ->", data.message || data.mensagem);
          n?.system &&
            n.system.info(
              data.title || data.titulo || "Notificação",
              data.message || data.mensagem
            );
        }
        break;
      }
    }
  }, []);

  // --- reconnect manual (forçar reconexão limpa) ---
  const reconnect = useCallback(() => {
    console.log("reconnect() chamado — forçando restart da conexão");
    manualCloseRef.current = true;
    if (wsRef.current) {
      try {
        console.log("reconnect: fechando wsRef atual");
        wsRef.current.close();
      } catch (e) {
        console.warn("reconnect: erro ao fechar wsRef ->", e);
      }
      wsRef.current = null;
    }

    attemptsRef.current = 0;
    setReconnectAttempts(0);
    setConnectionStatus("connecting");
    connectionStatusRef.current = "connecting";

    manualCloseRef.current = false;
    connect();
  }, [connect]);

  // --- enviar mensagem via WS ---
  const sendMessage = useCallback((message) => {
    console.log("sendMessage chamado ->", message);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
        console.log("sendMessage: mensagem enviada com sucesso");
        return true;
      } catch (err) {
        console.error("Erro ao enviar via WebSocket:", err);
        notificationsRef.current?.system &&
          notificationsRef.current.system.error(
            "Erro de Envio",
            "Falha ao enviar mensagem pelo WebSocket."
          );
        return false;
      }
    } else {
      console.warn("sendMessage: WebSocket não está aberto. readyState:", ws && ws.readyState);
      notificationsRef.current?.system &&
        notificationsRef.current.system.error(
          "Erro de Conexão",
          "WebSocket não está conectado."
        );
      return false;
    }
  }, []);

  // --- montar / desmontar provider ---
  useEffect(() => {
    console.log("WSProvider mounted: iniciando conexão");
    mountedRef.current = true;
    connect();

    return () => {
      console.log("WSProvider unmount: limpando recursos");
      mountedRef.current = false;
      manualCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        console.log("unmount: limpando reconnect timeout");
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        try {
          console.log("unmount: fechando wsRef");
          wsRef.current.close();
        } catch (e) {
          console.warn("unmount: erro ao fechar wsRef ->", e);
        }
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connect]);
  
  //use effect para utilizar printkitchenorder
   useEffect(() => {
   console.log("Novas mensagens WS recebidas:", messages);
   messages.forEach(msg => {
      if (msg.action === "newOrder" && msg.order && msg.mesaid) {
        console.log("Processando nova ordem para impressão na cozinha:", msg);
        printKitchenOrder(msg.order.Items, msg.mesaid);
      }
    });

  }, [messages]);


  useEffect(() => {
    console.log("Status da conexão WebSocket (effect):", connectionStatus);
  }, [connectionStatus]);

  // --- valor do contexto exposto ---
  const contextValue = {
    messages,
    connectionStatus,
    reconnectAttempts,
    maxReconnectAttempts,
    reconnect,
    sendMessage,
    isConnected: connectionStatus === "connected",
    isConnecting: connectionStatus === "connecting",
    hasError: connectionStatus === "error",
  };

  console.log("WSProvider: returns context", { isConnected: contextValue.isConnected, isConnecting: contextValue.isConnecting, hasError: contextValue.hasError });

  return <WSContext.Provider value={contextValue}>{children}</WSContext.Provider>;
};

export const useWS = () => {
  const context = useContext(WSContext);
  if (!context) {
    throw new Error("useWS deve ser usado dentro de um WSProvider");
  }
  return context;
};
