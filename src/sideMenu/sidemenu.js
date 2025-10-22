import React from 'react';
import { Menu } from 'antd';
import {
  AppstoreOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  BarsOutlined,
  TableOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import './sidemenu.css';

const SidebarMenu = ({ onSelect }) => {
  return (
    <div className="sidebar-menu">
      <Menu
        mode="vertical"
        defaultSelectedKeys={['categories']}
        style={{ borderRight: 0 }}
      >
        <Menu.Item onClick={() => onSelect("tables")} key="tables" icon={<TableOutlined />}>
          Mesas
        </Menu.Item>

        <Menu.Item onClick={() => onSelect("categories")} key="categories" icon={<AppstoreOutlined />}>
          Categorias
        </Menu.Item>

        <Menu.Item onClick={() => onSelect("products")} key="products" icon={<ShoppingOutlined />}>
          Produtos
        </Menu.Item>

        <Menu.Item onClick={() => onSelect("payments")} key="payments" icon={<WalletOutlined />}>
          Pagamentos
        </Menu.Item>
      </Menu>
    </div>
  );
};

export default SidebarMenu;
