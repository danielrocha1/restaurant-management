import React, { createContext, useState, useCallback, useEffect, useContext } from "react";
import { message } from "antd";

// Criando o contexto
export const TableContext = createContext();

// Provider
export const TableProvider = ({ children }) => {
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [errorTables, setErrorTables] = useState(false);

  // Função para buscar mesas
  const fetchTables = useCallback(async () => {
    setLoadingTables(true);
    setErrorTables(false);

    try {
      const res = await fetch("https://restaurant-sw98.onrender.com/tables/isopen");
      if (!res.ok) throw new Error("Falha na resposta da API");

      const data = await res.json();

      const mapped = data.map((t) => ({
        id: t.id,
        number: t.number,
        isOpen: Boolean(t.is_open),
      }));

      setTables(mapped);
    } catch (err) {
      console.error("Erro ao carregar mesas:", err);
      setErrorTables(true);
      message.error("Falha ao carregar mesas. Tente novamente.");
    } finally {
      setLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return (
    <TableContext.Provider
      value={{
        tables,
        loadingTables,
        errorTables,
        fetchTables,
        setTables,
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export const useTables = () => useContext(TableContext);
