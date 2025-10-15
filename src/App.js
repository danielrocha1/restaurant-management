// src/App.js
import React, { useState } from 'react';
import Sidebar from './sideMenu/sidemenu';
import Category from './Category/category';
import Product from './Product/product';
import TableGrid from './tables/tableGrid/tablegrid';
import Order from './Order/order';

function App() {
  const [selected, setSelected] = useState('Category');

  const renderContent = () => {
    switch (selected) {
      case 'products':
        return <Product />;
      case 'order':
        return <Order />;
        case 'tables':
        return <TableGrid />;
      default:
        return <Category />;
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar onSelect={setSelected} />
      <div style={{ marginLeft: '200px', padding: '20px', flex: 1 }}>
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
