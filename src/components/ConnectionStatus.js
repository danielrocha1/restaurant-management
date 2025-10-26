import React from 'react';
import { Badge, Tooltip, Button, Space } from 'antd';
import { 
  WifiOutlined, 
  DisconnectOutlined, 
  LoadingOutlined, 
  ExclamationCircleOutlined,
  ReloadOutlined 
} from '@ant-design/icons';
import { useWS } from '../context/wsContext';

const ConnectionStatus = ({ showText = false, size = 'default' }) => {
  const { connectionStatus, reconnectAttempts, maxReconnectAttempts, reconnect, isConnected, isConnecting, hasError } = useWS();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          status: 'success',
          icon: <WifiOutlined />,
          text: 'Conectado',
          color: '#52c41a',
          tooltip: 'Conexão WebSocket ativa - Recebendo atualizações em tempo real'
        };
      case 'connecting':
        return {
          status: 'processing',
          icon: <LoadingOutlined spin />,
          text: 'Conectando...',
          color: '#1890ff',
          tooltip: `Estabelecendo conexão... ${reconnectAttempts > 0 ? `(Tentativa ${reconnectAttempts}/${maxReconnectAttempts})` : ''}`
        };
      case 'disconnected':
        return {
          status: 'warning',
          icon: <DisconnectOutlined />,
          text: 'Desconectado',
          color: '#faad14',
          tooltip: 'Conexão perdida - Tentando reconectar automaticamente'
        };
      case 'error':
        return {
          status: 'error',
          icon: <ExclamationCircleOutlined />,
          text: 'Erro',
          color: '#ff4d4f',
          tooltip: 'Falha na conexão - Clique para tentar reconectar manualmente'
        };
      default:
        return {
          status: 'default',
          icon: <DisconnectOutlined />,
          text: 'Desconhecido',
          color: '#d9d9d9',
          tooltip: 'Status da conexão desconhecido'
        };
    }
  };

  const config = getStatusConfig();

  const handleReconnect = () => {
    reconnect();
  };

  if (showText) {
    return (
      <Space size="small">
        <Badge 
          status={config.status} 
          text={
            <span style={{ color: config.color, fontWeight: 500 }}>
              {config.text}
            </span>
          } 
        />
        {(hasError || connectionStatus === 'disconnected') && (
          <Tooltip title="Tentar reconectar">
            <Button 
              type="text" 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={handleReconnect}
              loading={isConnecting}
            />
          </Tooltip>
        )}
      </Space>
    );
  }

  return (
    <Tooltip title={config.tooltip}>
      <div style={{ cursor: hasError ? 'pointer' : 'default' }} onClick={hasError ? handleReconnect : undefined}>
        <Badge 
          status={config.status}
          dot={size === 'small'}
          style={{ 
            fontSize: size === 'large' ? '16px' : size === 'small' ? '8px' : '12px'
          }}
        />
        {size !== 'small' && (
          <span style={{ 
            marginLeft: 8, 
            color: config.color, 
            fontWeight: 500,
            fontSize: size === 'large' ? '14px' : '12px'
          }}>
            {config.icon}
          </span>
        )}
      </div>
    </Tooltip>
  );
};

export default ConnectionStatus;