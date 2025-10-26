// src/App.js
import React, { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from './sideMenu/sidemenu';
import Category from './Category/category';
import Product from './Product/product';
import TableGrid from './tables/tablegrid';
import TransactionsPage from './Payments/payments';
import { NotificationProvider } from './context/notificationContext';
import { WSProvider } from './context/wsContext';
import { TableProvider } from './context/tablesContext';
import ConnectionStatus from './components/ConnectionStatus';
import 'antd/dist/reset.css'
const { Header, Content } = Layout;

function App() {
  const [selected, setSelected] = useState('Category');

  const renderContent = () => {
    switch (selected) {
      case 'products':
        return <Product />;
      case 'tables':
        return <TableGrid />;
      case 'payments':
        return <TransactionsPage />;
      default:
        return <Category />;
    }
  };

  return (
    <NotificationProvider>
      <WSProvider>
        <TableProvider>
          <Layout style={{ minHeight: '100vh' }}>
            {/* Header com status de conexão */}
            <Header style={{ 
              position: 'fixed', 
              zIndex: 1000, 
              width: '100%', 
              background: '#001529',
              padding: '0 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                🍽️ Restaurant Management
              </div>
              <ConnectionStatus showText size="default" />
            </Header>

            <Layout style={{ marginTop: 64 }}>
              <Sidebar onSelect={setSelected} />
              <Content style={{ marginLeft: '200px', padding: '20px', minHeight: 'calc(100vh - 64px)' }}>
                {renderContent()}
              </Content>
            </Layout>
          </Layout>
        </TableProvider>
      </WSProvider>
    </NotificationProvider>
  );
}

export default App;