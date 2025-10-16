import React, { useState, useEffect } from "react";
import "./order.css";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({
    nomeLoja: "",
    mesa: "",
    qrCode: "",
    idProdutos: "",
    total: "",
    status: "pendente",
  });
  const [editingId, setEditingId] = useState(null);

  const statusOptions = ["Pendente", "Finalizado", "Cancelado"];

  const fetchOrders = async () => {
    try {
      const res = await fetch("https://restaurant-sw98.onrender.com/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.nomeLoja.trim() ||
      !formData.mesa.trim() ||
      !formData.qrCode.trim() ||
      !formData.idProdutos.trim() ||
      !formData.total.trim()
    ) {
      alert("Preencha todos os campos!");
      return;
    }

    const payload = {
      nomeLoja: formData.nomeLoja,
      mesa: formData.mesa,
      qrCode: formData.qrCode,
      idProdutos: formData.idProdutos,
      total: parseFloat(formData.total),
      status: formData.status,
    };

    try {
      if (editingId === null) {
        await fetch("https://restaurant-sw98.onrender.com/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`https://restaurant-sw98.onrender.com/orders/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setFormData({
        nomeLoja: "",
        mesa: "",
        qrCode: "",
        idProdutos: "",
        total: "",
        status: "pendente",
      });
      setEditingId(null);
      fetchOrders();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = async (order) => {
    const orderPayload = {
      nomeLoja: order.NomeLoja,
      mesa: order.Mesa,
      qrCode: order.QRCode,
      idProdutos: `{${order.Produtos.map((p) => p.ID).join(",")}}`,
      total: order.Total,
      status: order.Status,
    };

    try {
      await fetch(`https://restaurant-sw98.onrender.com/orders/${order.ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.ID === order.ID ? { ...o, Status: order.Status } : o
        )
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirma exclusão do pedido?")) return;

    try {
      await fetch(`https://restaurant-sw98.onrender.com/orders/${id}`, {
        method: "DELETE",
      });
      fetchOrders();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
    
      <h3 className="text-xl font-semibold mt-8 mb-4">Pedidos</h3>

      {orders.length === 0 ? (
        <p>Nenhum pedido cadastrado.</p>
      ) : (
        <ul className="order-list">
          {orders.map((order, index) => (
            <li key={order.ID} className="order-card">
              <div className="order-header">
                <h4 className="order-title">Pedido #{index + 1}</h4>
                <span className={`badge badge-${order.Status}`}>
                  {order.Status.charAt(0).toUpperCase() + order.Status.slice(1)}
                </span>
              </div>

              <div className="order-info">
                <p>
                  <strong>Mesa {order.Mesa} </strong>
                </p>
                <p>
                  <strong>Loja - {order.NomeLoja}</strong> 
                </p>
              </div>

             {order.Produtos?.length > 0 && (
              <div className="order-products">
                <p><strong>Itens:</strong></p>
                <ul>
                  {order.Produtos.map((p) => (
                    <li key={p.ID}>
                      {p.Nome} — <span className="product-price">{p.Preco}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

              <p className="order-total">R$ {parseFloat(order.Total).toFixed(2)}</p>
              <p className="order-date">
                {new Date(order.Timestamp).toLocaleString()}
              </p>

              <select
                className="order-select"
                value={order.Status}
                onChange={(e) =>
                  handleEdit({ ...order, Status: e.target.value })
                }
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>

              <div className="order-buttons">
                <button
                  className="btn view-btn"
                  onClick={() => {
                    setFormData({
                      nomeLoja: order.NomeLoja,
                      mesa: order.Mesa,
                      qrCode: order.QRCode,
                      idProdutos: order.Produtos.map((p) => p.ID).join(","),
                      total: order.Total,
                      status: order.Status,
                    });
                    setEditingId(order.ID);
                  }}
                >
                  👁️
                </button>
                <button
                  className="btn delete-btn"
                  onClick={() => handleDelete(order.ID)}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Order;
