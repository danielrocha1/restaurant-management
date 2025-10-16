import React from 'react';
import { Menu } from 'antd';
import {
  AppstoreOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  BarsOutlined,
} from '@ant-design/icons';
import './sidemenu.css';

const SidebarMenu = ({onSelect}) => {
  return (
    <div className="sidebar-menu">
      <Menu
        mode="vertical"
        defaultSelectedKeys={['categorias']}
        style={{ borderRight: 0 }}
      >
        <Menu.Item onClick={() => onSelect("tables")} key="mesas" icon={<BarsOutlined />}>
          Mesas
        </Menu.Item>
        <Menu.Item onClick={() => onSelect("Category")} key="categorias" icon={<AppstoreOutlined />}>
          Categorias
        </Menu.Item>
        <Menu.Item onClick={() => onSelect("products")} key="produtos" icon={<ShoppingOutlined />}>
          Produtos
        </Menu.Item>
      </Menu>
    </div>
  );
};

export default SidebarMenu;
