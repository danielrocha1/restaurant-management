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

const { Title, Text } = Typography;
const { Option } = Select;

// Lista de métodos de pagamento disponíveis (pode vir de uma API)
const paymentMethods = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "pix", label: "PIX" },
  { value: "vale_refeicao", label: "Vale Refeição" },
];

const DrawerPayment = ({
  visible,
  onClose,
  totalToPay, // Valor total que veio do DrawerTableOrders
  tableNumber,
  onPaymentSuccess, // Função a ser chamada ao fechar a mesa
}) => {
  // Estado para armazenar os pagamentos adicionados
  const [payments, setPayments] = useState([]);
  const [form] = Form.useForm();

  // 1. Cálculo do Total Pago
  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.value, 0);
  }, [payments]);

  // 2. Cálculo do Valor Faltante (ou Troco)
  const remainingValue = useMemo(() => {
    // Garantir precisão, evitando problemas de ponto flutuante, se necessário,
    // mas o InputNumber com precisão 2 já ajuda.
    return totalToPay - totalPaid;
  }, [totalToPay, totalPaid]);

  const isComplete = remainingValue <= 0;
  const isOverpaid = remainingValue < 0; // Se for negativo, significa que há troco ou pagamento em excesso

  // 3. Função para adicionar um novo pagamento
  const handleAddPayment = (values) => {
    const newPayment = {
      id: Date.now(), // ID simples baseado no timestamp
      method: values.method,
      value: values.value,
      methodLabel: paymentMethods.find((m) => m.value === values.method)?.label || values.method,
    };
    setPayments([...payments, newPayment]);
    form.resetFields(); // Limpa o formulário após adicionar
  };

  // 4. Função para remover um pagamento
  const handleRemovePayment = (id) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  // 5. Função para finalizar o pagamento (chamada pelo botão de fechar)
  const handleFinalizePayment = () => {
    if (!isComplete) {
      message.warning("Ainda há um valor pendente para pagamento.");
      return;
    }

    const troco = isOverpaid ? Math.abs(remainingValue) : 0;

    // Objeto com todos os dados relevantes para o fechamento
    const paymentData = {
      tableNumber: tableNumber,
      totalToPay: totalToPay,
      totalPaid: totalPaid,
      payments: payments, // Array detalhado de métodos e valores
      changeDue: troco.toFixed(2), // Troco calculado formatado
    };

    // CAPTURA DOS DADOS FINALIZADOS NO CONSOLE.LOG
    console.log("--- Dados Finais do Pagamento (Mesa Fechada) ---");
    console.log(paymentData);
    console.log("-------------------------------------------------");
    
    // Simula o sucesso e o envio ao servidor
    message.success(
      `Mesa ${tableNumber} fechada com sucesso! Pagamento de R$ ${totalPaid.toFixed(
        2
      )} processado.`
    );
    
    // Resetar o estado e fechar o drawer
    setPayments([]);
    onClose();
    if (onPaymentSuccess) {
        onPaymentSuccess();
    }
  };

  // Renderização do troco
  const renderTroco = () => {
      if (isOverpaid) {
          const troco = Math.abs(remainingValue);
          return (
              <Alert
                  message={`Troco: R$ ${troco.toFixed(2)}`}
                  type="success"
                  showIcon
                  style={{ marginBottom: 12 }}
              />
          );
      }
      return null;
  };

  return (
    <Drawer
      title={<Title level={4}>Pagamento da Mesa {tableNumber}</Title>}
      width={450} // Um pouco mais estreito que o Drawer de pedidos
      placement="right"
      onClose={onClose}
      open={visible}
      footer={
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "8px 0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text>Total a Pagar:</Text>
            <Text strong>R$ {totalToPay.toFixed(2)}</Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text>Total Pago:</Text>
            <Text strong style={{ color: "green" }}>
              R$ {totalPaid.toFixed(2)}
            </Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Text>Faltando/Troco:</Text>
            <Text
              strong
              style={{
                fontSize: 18,
                color: remainingValue > 0 ? "red" : "green",
              }}
            >
              R$ {Math.abs(remainingValue).toFixed(2)}
            </Text>
          </div>

          {renderTroco()}
          
          <Button
            type="primary"
            size="large"
            block
            onClick={handleFinalizePayment}
            disabled={!isComplete} // Habilita somente se o pagamento estiver completo
          >
            Finalizar Pagamento e Fechar Mesa
          </Button>
        </div>
      }
    >
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
            initialValue={remainingValue > 0 ? remainingValue : totalToPay > 0 ? totalToPay : 0.00} // Sugere o valor faltante (ou o total se for o primeiro pagamento)
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
                <Text>R$ {p.value.toFixed(2)}</Text>
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