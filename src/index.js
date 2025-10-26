import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

 

import "antd/dist/reset.css";
import { notification } from "antd";  // <- importante

notification.config({
  getContainer: () => document.body,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
 
          <App />
 
  </React.StrictMode>
);
