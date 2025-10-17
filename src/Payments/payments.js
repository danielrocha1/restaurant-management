import React, { useState, useEffect } from "react";
import { DatePicker, Table, Card, Button, Tag, Space } from "antd";
import dayjs from "dayjs";

export default function ClosedTablesPage() {
  const [date, setDate] = useState(dayjs());
  const [tables, setTables] = useState([]);
  const [view, setView] = useState("table"); // "table" ou "cards"

  // Busca mesas fechadas do dia selecionado
  useEffect(() => {
    const fetchClosedTables = async () => {
      try {
        const res = await fetch("http://localhost:4000/tables/viewcloseondate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: date.format("YYYY-MM-DD") }),
        });

        const data = await res.json();
        setTables(data);
      } catch (err) {
        console.error("Erro ao buscar mesas fechadas:", err);
      }
    };

    fetchClosedTables();
  }, [date]);

  useEffect(() => {
    console.log(tables);
  }, [tables]);

  // Colunas da tabela
  const columns = [
    { title: "Mesa", dataIndex: "number" },
    { title: "Abertura", dataIndex: "opened_at" },
    { title: "Fechamento", dataIndex: "closed_at" },
    { title: "Total", dataIndex: "total_calculado", render: (v) => `R$ ${v}` },
    { 
  title: "Status", 
  dataIndex: "is_open", 
  render: (v) => (
    <Tag color={v ? "green" : "red"}>
      {v ? "Aberto" : "Fechado"}
    </Tag>
  )
}
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2>Mesas Fechadas</h2>

      <Space style={{ marginBottom: 16 }}>
        <DatePicker value={date} onChange={setDate} />
        <Button type={view === "table" ? "default" : "primary"} onClick={() => setView("table")}>
          Tabela
        </Button>
        <Button type={view === "cards" ? "default" : "primary"} onClick={() => setView("cards")}>
          Cards
        </Button>
      </Space>

      {view === "cards" ? (
  <div style={{ display: "grid", gap: "1rem" }}>
    {tables.map(t => (
      <Card 
        key={t.id} 
        title={`Mesa ${t.number}`}
        //onClick={() => fetchTableDetails(t.id)} // aqui você vai chamar sua requisição futura
        hoverable
      >
        <p><b>Abertura:</b> {dayjs(t.opened_at).format("DD/MM/YYYY HH:mm")}</p>
        <p><b>Fechamento:</b> {t.closed_at ? dayjs(t.closed_at).format("DD/MM/YYYY HH:mm") : "-"}</p>
        <p>
          <b>Status:</b>{" "}
          <Tag color={t.is_open ? "green" : "red"}>
            {t.is_open ? "Aberto" : "Fechado"}
          </Tag>
        </p>
      </Card>
    ))}
  </div>
) : (
  <Table rowKey="id" dataSource={tables} columns={columns} />
)}
    </div>
  );
}
