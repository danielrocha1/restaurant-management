import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { TableProvider } from "./context/tablesContext"; 
import { WSProvider } from "./context/wsContext";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TableProvider>
      <WSProvider>
        <App />
      </WSProvider>
    </TableProvider>
  </React.StrictMode>
);
