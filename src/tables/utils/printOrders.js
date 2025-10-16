// tables/utils/printOrders.js

/**
 * Imprime um recibo consolidado de todos os pedidos de uma mesa em uma única página.
 * O formato é otimizado para um recibo/cupom de restaurante.
 *
 * @param {Array<Object>} orders - Uma lista de objetos de pedido.
 * @param {number|string} tableNumber - O número da mesa.
 */
export const printOrders = (orders, tableNumber) => {
  if (!orders || orders.length === 0) return;

  // 1. Função auxiliar para formatar o preço
  const formatCurrency = (value) => `R$ ${Number(value).toFixed(2)}`;

  // 2. Cálculo do Total Geral
  const grandTotal = orders.reduce((sum, order) => {
    return sum + order.produtos.reduce((itemSum, p) => itemSum + Number(p.total_item), 0);
  }, 0);

  // 3. Estilos CSS (Foco em Recibo Consolidado)
  const styles = `
    body {
      font-family: 'Consolas', monospace; /* Fonte monoespaçada para alinhamento */
      font-size: 10pt;
      margin: 0 auto;
      padding: 10px;
      line-height: 1.3;
      color: #000;
      width: 100%;
      max-width: 80mm; /* Largura típica de impressora de cupom */
    }
    h1, h2, h3 {
      text-align: center;
      margin: 4px 0;
      text-transform: uppercase;
    }
    h1 { font-size: 12pt; }
    h2 { font-size: 10pt; }

    .header-info, .summary-section {
        margin: 8px 0;
        padding: 4px 0;
        border-top: 1px dashed #000;
        border-bottom: 1px dashed #000;
        font-size: 9pt;
    }
    .header-info p { margin: 2px 0; }
    
    .order-group {
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px dashed #DDD;
    }
    .order-group h3 {
        text-align: left;
        font-size: 10pt;
        border-bottom: 1px solid #000;
        padding-bottom: 2px;
        margin-bottom: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }
    th, td {
      padding: 2px 1px;
      text-align: left;
      border: none;
      font-size: 9pt;
      vertical-align: top;
    }
    th {
      font-weight: bold;
      border-bottom: 1px dashed #000;
    }
    .text-right { text-align: right; }

    .item-name {
        padding-right: 5px;
    }
    
    /* Seção de Totais */
    .summary-section {
        border-top: 2px solid #000; /* Linha mais grossa para separar do corpo */
        border-bottom: none;
        padding-top: 8px;
        margin-top: 15px;
    }
    .summary-section table {
        margin: 0;
    }
    .summary-section td {
        padding: 4px 1px;
        font-size: 10pt;
    }
    .grand-total td {
        font-size: 12pt;
        font-weight: bold;
        border-top: 1px dashed #000;
    }

    .footer-message {
        text-align: center;
        margin-top: 15px;
        font-size: 8pt;
        padding: 5px 0;
        border-top: 1px dashed #000;
    }

    @media print {
        body {
            max-width: none;
            width: auto;
            margin: 0;
            padding: 0;
        }
        /* Garantir que não haja quebras de página entre pedidos */
        .order-group {
            page-break-inside: avoid;
        }
    }
  `;

  // 4. HTML dos Itens (Agrupados por Pedido)
  const allOrdersHtml = orders
    .map((order) => {
      return `
        <div class="order-group">
          <h3>[Pedido #${order.order_id}]</h3>
          <table>
            <tbody>
              ${order.produtos
                .map((p) => {
                  const unitPrice = Number(p.preco_unitario);
                  const itemTotal = Number(p.total_item);
                  return `
                    <tr>
                      <td class="item-name" style="width: 40%;">${p.quantidade}x ${p.nome}</td>
                      <td class="text-right" style="width: 20%;">${formatCurrency(unitPrice)}</td>
                      <td class="text-right" style="width: 40%;">${formatCurrency(itemTotal)}</td>
                    </tr>
                    ${p.observacao ? `
                    <tr>
                        <td colspan="3" style="font-size: 8pt; font-style: italic; padding-left: 10px;">Obs: ${p.observacao}</td>
                    </tr>
                    ` : ''}
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      `;
    })
    .join("");

  // 5. Estrutura HTML Final
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Recibo Mesa ${tableNumber}</title>
        <style>${styles}</style>
      </head>
      <body>
        <h1>Restaurante XYZ</h1>
        <h2>COMPROVANTE DE CONSUMO</h2>
        
        <div class="header-info">
            <p><strong>MESA:</strong> ${tableNumber}</p>
            <p><strong>Emissão:</strong> ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p><strong>Nº Pedidos:</strong> ${orders.length}</p>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 40%;">Item</th>
                    <th class="text-right" style="width: 20%;">Unit.</th>
                    <th class="text-right" style="width: 40%;">Subtotal</th>
                </tr>
            </thead>
        </table>

        ${allOrdersHtml}

        <div class="summary-section">
          <table>
            <tbody>
              <tr>
                <td colspan="2">SUBTOTAL GERAL</td>
                <td class="text-right">${formatCurrency(grandTotal)}</td>
              </tr>
              <tr class="grand-total">
                <td colspan="2">TOTAL A PAGAR</td>
                <td class="text-right">${formatCurrency(grandTotal /* + Taxa */)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="footer-message">
            <p>Volte Sempre!</p>
            <p>Não é Documento Fiscal</p>
        </div>
      </body>
    </html>
  `;

  // 6. Lógica de impressão
  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  // printWindow.close(); 
};