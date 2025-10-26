import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { TableProvider } from "./context/tablesContext"; 
import { WSProvider } from "./context/wsContext";
import { ConfigProvider } from 'antd';


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
  <ConfigProvider>
    <TableProvider>

      <WSProvider>
        <App />
      </WSProvider>
    </TableProvider>
  </ConfigProvider>
  </React.StrictMode>
);
