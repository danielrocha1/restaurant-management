import { createContext, useContext, useEffect, useState } from "react";

const WSContext = createContext();

export const WSProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("wss://restaurant-sw98.onrender.com/ws");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    console.log("Mensagem Recebida:", messages)
  }, [messages]);

  return (
    <WSContext.Provider value={{ messages }}>
      {children}
    </WSContext.Provider>
  );
};

export const useWS = () => useContext(WSContext);
