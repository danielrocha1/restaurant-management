// components/DrawerPayment.jsx

import React, { useState, useMemo } from "react";
import {
  Drawer,
  Typography,
  Button,
  Card,
  InputNumber,
  Select,
  Form,
  Space,
  Alert,
  message,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTables } from "../../context/tablesContext";

const { Title, Text } = Typography;
const { Option } = Select;

// --- FUNÇÕES DE CONVERSÃO (Mantidas) ---
const totalToCentavos = (value) => Math.round(value * 100);
const totalToReais = (value) => value / 100;

// --- MÉTODOS DE PAGAMENTO (Mantidos) ---
const paymentMethods = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "pix", label: "PIX" },
  { value: "vale_refeicao", label: "Vale Refeição" },
];

const API_ENDPOINT = "https://restaurant-sw98.onrender.com/payment/"; // <<< NOVO: URL do seu endpoint Go

const DrawerPayment = ({
  tableID,
  visible,
  onClose,
  totalToPay,
  tableNumber,
  onPaymentSuccess,
}) => {
  const totalToPayCentavos = useMemo(() => totalToCentavos(totalToPay), [totalToPay]);
  
  const { setTables } = useTables()

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false); // NOVO: Estado para controle de loading
  const [form] = Form.useForm();

  // --- CÁLCULOS (Mantidos) ---
  const totalPaidCentavos = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.value, 0);
  }, [payments]);

  const remainingValueCentavos = useMemo(() => {
    return totalToPayCentavos - totalPaidCentavos;
  }, [totalToPayCentavos, totalPaidCentavos]);

  const isComplete = remainingValueCentavos <= 0;
  const isOverpaid = remainingValueCentavos < 0;
  // ... (handleRemovePayment e handleAddPayment são mantidos) ...

  const handleAddPayment = (values) => {
    const valueCentavos = totalToCentavos(values.value);

    const newPayment = {
      id: Date.now(),
      method: values.method,
      value: valueCentavos,
      methodLabel: paymentMethods.find((m) => m.value === values.method)?.label || values.method,
    };
    setPayments([...payments, newPayment]);
    form.resetFields();
  };

  const handleRemovePayment = (id) => {
    setPayments(payments.filter((p) => p.id !== id));
  };
  
  // 5. Função para finalizar o pagamento (AGORA COM FETCH)
  const handleFinalizePayment = async () => {
  if (!isComplete) {
    message.warning("Ainda há um valor pendente para pagamento.");
    return;
  }

  setLoading(true);

  const trocoCentavos = isOverpaid ? Math.abs(remainingValueCentavos) : 0;
  const trocoReais = totalToReais(trocoCentavos);

  const paymentsForAPI = payments.map(p => ({
    id: p.id,
    method: p.method,
    methodLabel: p.methodLabel,
    value: p.value,
    value_centavos: p.value,
    value_reais: totalToReais(p.value),
  }));

  const paymentData = {
    tableID,
    tableNumber,
    totalPaid: totalPaidCentavos,
    payments: paymentsForAPI,
    changeDue: trocoReais.toFixed(2),
    totalTransaction: totalToPayCentavos,
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    console.log(paymentData);

    if (!response.ok) {
      throw new Error(result.message || result.error || "Erro ao processar pagamento no servidor.");
    }

    // ✅ Sucesso
    message.success(
      result.message ||
        `Mesa ${tableNumber} fechada! Pago: R$ ${totalToReais(totalPaidCentavos).toFixed(2)}.`
    );

    // 🔥 REMOVE a mesa paga do contexto global
    setTables(prevTables => prevTables.filter(t => t.id !== tableID));

    // Resetar e fechar
    setPayments([]);
    onClose();
    if (onPaymentSuccess) onPaymentSuccess();

  } catch (error) {
    console.error("Erro na transação de pagamento:", error);
    message.error(`Falha ao fechar mesa: ${error.message}`);
  } finally {
    setLoading(false);
  }
};


  // Renderização do troco (mantida)
  const renderTroco = () => {
      if (isOverpaid) {
          const trocoReais = totalToReais(Math.abs(remainingValueCentavos));
          return (
              <Alert
                  message={`Troco: R$ ${trocoReais.toFixed(2)}`}
                  type="success"
                  showIcon
                  style={{ marginBottom: 12 }}
              />
          );
      }
      return null;
  };
  
  // Sugere o valor restante (em Reais)
  const suggestedRemainingReais = remainingValueCentavos > 0
    ? totalToReais(remainingValueCentavos)
    : 0.00; // Se já pagou o suficiente, sugere 0.00

  return (
    <Drawer
      title={<Title level={4}>Pagamento da Mesa {tableNumber}</Title>}
      width={450}
      placement="right"
      onClose={onClose}
      open={visible}
      footer={
        // ... (Footer com cálculos e botões)
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "8px 0",
          }}
        >
          {/* ... Display de Totais (Mantido) ... */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text>Total a Pagar:</Text>
            <Text strong>R$ {totalToReais(totalToPayCentavos).toFixed(2)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text>Total Pago:</Text>
            <Text strong style={{ color: "green" }}>
              R$ {totalToReais(totalPaidCentavos).toFixed(2)}
            </Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text>Faltando/Troco:</Text>
            <Text
              strong
              style={{
                fontSize: 18,
                color: remainingValueCentavos > 0 ? "red" : "green",
              }}
            >
              R$ {totalToReais(Math.abs(remainingValueCentavos)).toFixed(2)}
            </Text>
          </div>

          {renderTroco()}
          
          <Button
            type="primary"
            size="large"
            block
            onClick={handleFinalizePayment}
            disabled={!isComplete || loading} // Desabilita se não estiver completo ou estiver carregando
            loading={loading} // Exibe o spinner de loading
          >
            Finalizar Pagamento e Fechar Mesa
          </Button>
        </div>
      }
    >
      {/* ... (Corpo do Drawer: Adicionar Pagamento e Pagamentos Lançados - Mantido) ... */}
      <Title level={5}>Adicionar Pagamento</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleAddPayment}
        style={{ marginBottom: 24, border: '1px solid #f0f0f0', padding: 16, borderRadius: 6 }}
      >
        <Space direction="horizontal" style={{ width: "100%", justifyContent: "space-between" }}>
          <Form.Item
            name="method"
            label="Método"
            rules={[{ required: true, message: "Selecione o método!" }]}
            style={{ flex: 1, marginRight: 8 }}
          >
            <Select placeholder="Método de Pagamento">
              {paymentMethods.map((m) => (
                <Option key={m.value} value={m.value}>
                  {m.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="value"
            label="Valor (R$)"
            rules={[{ required: true, message: "Digite o valor!" }]}
            initialValue={suggestedRemainingReais}
            style={{ flex: 1, marginRight: 8 }}
          >
            <InputNumber
              min={0.01}
              precision={2}
              formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/R\$\s?|(,*)/g, '')}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label=" " colon={false} style={{ alignSelf: 'flex-end', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} />
          </Form.Item>
        </Space>
      </Form>

      <Title level={5}>Pagamentos Lançados</Title>
      {payments.length === 0 ? (
        <Text type="secondary">Nenhum pagamento lançado ainda.</Text>
      ) : (
        payments.map((p) => (
          <Card
            key={p.id}
            size="small"
            style={{ marginBottom: 8, backgroundColor: "#e6f7ff" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong>{p.methodLabel}</Text>
              <Space>
                <Text>R$ {totalToReais(p.value).toFixed(2)}</Text>
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemovePayment(p.id)}
                  size="small"
                />
              </Space>
            </div>
          </Card>
        ))
      )}
    </Drawer>
  );
};

export default DrawerPayment;