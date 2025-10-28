import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { notification } from 'antd';
import {
  TableOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
  BellOutlined,
  DollarCircleOutlined,
  UserOutlined,
  FireOutlined
} from '@ant-design/icons';
import { printKitchenOrder } from "../tables/utils/printKitchen";




const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [api, contextHolder] = notification.useNotification();

  // Configuração global
  React.useEffect(() => {
    notification.config({
      placement: 'bottomRight', // 👈 canto inferior direito
      bottom: 50,
      duration: 4.5,
      maxCount: 5,
    });
  }, []);

  const showNotification = useCallback((type = 'open', config = {}) => {
    const allowed = ['open', 'success', 'info', 'warning', 'error'];
    const method = allowed.includes(type) ? type : 'open';

    const payload = {
      ...config,
      style: {
        zIndex: 10000, // 👈 garante que fica por cima de tudo
        ...(config.style || {}),
      },
    };

    if (method === 'open') api.open(payload);
    else api[method](payload);
  }, [api]);

  const notifications = useMemo(() => ({
    newTable: (tableData) => {
      console.log("NOTIFICAÇÃO");
      const tableCount = Array.isArray(tableData) ? tableData.length : 1;
      const tableNumbers = Array.isArray(tableData)
        ? tableData.map(t => t.number ?? t.id).join(', ')
        : (tableData?.number ?? tableData?.id ?? '—');

      showNotification('success', {
        message: '🍽️ Nova Mesa Aberta',
        description: `Mesa${tableCount > 1 ? 's' : ''} ${tableNumbers} foi${tableCount > 1 ? 'ram' : ''} aberta${tableCount > 1 ? 's' : ''} e está${tableCount > 1 ? 'ão' : ''} disponível${tableCount > 1 ? 'eis' : ''} para atendimento.`,
        icon: <TableOutlined style={{ color: '#52c41a' }} />,
        duration: 6,
        style: {
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f'
        }
      });
    },

    newOrder: (orderData = {}) => {
      const { tableNumber = '—', orderTotal = 0, itemCount = 1 } = orderData;
      showNotification('info', {
        message: '🛒 Novo Pedido Recebido',
        description: `Mesa ${tableNumber} fez um pedido com ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}. Total: R$ ${Number(orderTotal || 0).toFixed(2)}`,
        icon: <ShoppingCartOutlined style={{ color: '#1890ff' }} />,
        duration: 5,
        style: { backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }
      });
      printKitchenOrder(orderData, tableNumber)
    },

    tableClosed: (paymentData = {}) => {
      const { tableNumber = '—', totalAmount = 0, paymentMethod = null } = paymentData;
      showNotification('success', {
        message: '💰 Pagamento Confirmado',
        description: `Mesa ${tableNumber} finalizou o pagamento de R$ ${Number(totalAmount || 0).toFixed(2)}}.`,
        icon: <DollarCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 5,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }
      });
    },

    lowStock: (p = {}) => {
      const { productName = 'Produto', currentStock = 0 } = p;
      showNotification('warning', {
        message: '⚠️ Estoque Baixo',
        description: `O produto "${productName}" está com estoque baixo (${currentStock} unidades restantes).`,
        icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        duration: 8,
        style: { backgroundColor: '#fffbe6', border: '1px solid #ffe58f' }
      });
    },

    connectionError: (msg) => {
      showNotification('error', {
        message: '🔌 Erro de Conexão',
        description: msg || 'Falha na conexão com o servidor. Tentando reconectar...',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        duration: 6,
        style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' }
      });
    },

    connectionRestored: () => {
      showNotification('success', {
        message: '✅ Conexão Restabelecida',
        description: 'A conexão com o servidor foi restabelecida com sucesso.',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        duration: 3,
        style: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }
      });
    },

    // urgentOrder: (orderData = {}) => {
    //   const { tableNumber = '—', waitTime = 'muitos' } = orderData;
    //   showNotification('error', {
    //     message: '🚨 Pedido Urgente',
    //     description: `Mesa ${tableNumber} está aguardando há ${waitTime} minutos. Atenção necessária!`,
    //     icon: <FireOutlined style={{ color: '#ff4d4f' }} />,
    //     duration: 10,
    //     style: { backgroundColor: '#fff2f0', border: '1px solid #ffccc7' }
    //   });
    // },

    // customerArrived: (c = {}) => {
    //   const { tableNumber = '—', customerCount = 1 } = c;
    //   showNotification('info', {
    //     message: '👥 Cliente Chegou',
    //     description: `${customerCount} ${customerCount === 1 ? 'cliente chegou' : 'clientes chegaram'} na Mesa ${tableNumber}.`,
    //     icon: <UserOutlined style={{ color: '#1890ff' }} />,
    //     duration: 4,
    //     style: { backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }
    //   });
    // },

    custom: (config = {}) => {
      showNotification('open', {
        icon: <BellOutlined style={{ color: '#1890ff' }} />,
        ...config
      });
    },

    system: {
      success: (message, description) =>
        showNotification('success', {
          message,
          description,
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        }),
      error: (message, description) =>
        showNotification('error', {
          message,
          description,
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        }),
      info: (message, description) =>
        showNotification('info', {
          message,
          description,
          icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
        }),
      warning: (message, description) =>
        showNotification('warning', {
          message,
          description,
          icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        }),
    },
  }), [showNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification }}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationProvider');
  }
  return context;
};
