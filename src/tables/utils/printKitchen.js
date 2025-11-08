// tables/utils/printKitchenOrder.js

/**
 * Imprime uma comanda de COZINHA consolidada de todos os itens de um pedido.
 * Compatível com o formato retornado pelo backend via WebSocket (order.Items).
 *
 * @param {Array<Object>} items - Lista de itens (cada um tem Produto, Quantidade e PrecoUnitario).
 * @param {number|string} tableNumber - Número da mesa.
 */
export const printKitchenOrder = (items, tableNumber) => {
  if (!items || items.length === 0) return;

  // 1. Consolidação dos Itens (agrupa produtos iguais)
  const consolidatedItems = {};

  items.forEach((item) => {
    const produto = item.Produto || {};
    const nome = produto.Nome?.trim().toUpperCase() || "ITEM DESCONHECIDO";
    const descricao = produto.Descricao?.trim() || "";

    const key = `${nome}|${descricao}`;

    if (!consolidatedItems[key]) {
      consolidatedItems[key] = {
        nome,
        quantidade: 0,
        descricao,
        pedidos: [] // Para rastrear a origem
      };
    }

    consolidatedItems[key].quantidade += Number(item.Quantidade) || 0;
    consolidatedItems[key].pedidos.push(item.OrderID);
  });

  const finalItems = Object.values(consolidatedItems);

  // 2. Estilos CSS (visual limpo e funcional)
  const styles = `
    body {
      font-family: 'Consolas', monospace;
      font-size: 12pt;
      margin: 0 auto;
      padding: 10px 5px;
      line-height: 1.2;
      color: #000;
      width: 100%;
      max-width: 80mm;
      font-weight: bold;
    }
    .title {
      text-align: center;
      font-size: 16pt;
      padding: 5px 0;
      margin: 0;
      text-transform: uppercase;
      border-bottom: 3px solid #000;
    }
    .header-info {
      margin: 8px 0;
      padding: 5px 0;
      border-bottom: 2px dashed #000;
      font-size: 14pt;
      text-align: center;
    }
    .header-info p { margin: 3px 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      padding: 5px 2px;
      text-align: left;
      border: none;
      vertical-align: top;
      line-height: 1.1;
    }
    .qty-cell {
      font-size: 24pt;
      font-weight: 900;
      color: #000;
      width: 15%;
      text-align: center;
      border-right: 2px solid #000;
    }
    .item-name {
      font-size: 14pt;
      width: 65%;
      padding-left: 8px;
    }
    .observacao {
      font-size: 10pt;
      font-style: italic;
      color: #333;
      margin-top: -3px;
      padding: 2px 0 5px 8px;
      border-bottom: 1px dashed #777;
    }
    .footer-message {
      text-align: center;
      margin-top: 20px;
      font-size: 10pt;
      padding: 8px 0;
      border-top: 3px solid #000;
    }
    @media print {
      body {
        max-width: none;
        width: auto;
        margin: 0;
        padding: 0;
      }
    }
  `;

  // 3. Monta o HTML dos itens consolidados
  const itemsHtml = finalItems
    .map((p) => {
      const pedidoList = [...new Set(p.pedidos)].map(id => `P#${id}`).join(', ');
      return `
        <tr>
          <td class="qty-cell">${p.quantidade}</td>
          <td class="item-name">${p.nome}</td>
        </tr>
        ${p.descricao ? `
        <tr>
            <td colspan="2" class="observacao">>> OBS: ${p.descricao}</td>
        </tr>` : ''}
        <tr>
            <td colspan="2" style="font-size: 8pt; text-align: right; padding-bottom: 8px; padding-right: 5px;">
                (Origem: ${pedidoList})
            </td>
        </tr>
      `;
    })
    .join("");

  // 4. Estrutura HTML completa
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Comanda Cozinha Mesa ${tableNumber}</title>
        <style>${styles}</style>
      </head>
      <body>
        <h1 class="title">COZINHA CHECKLIST</h1>
        <div class="header-info">
          <p>MESA: <span style="font-size: 20pt; color: #D9534F;">** ${tableNumber} **</span></p>
          <p>HORA: ${new Date().toLocaleTimeString('pt-BR').substring(0, 5)}</p>
        </div>
        <table><tbody>${itemsHtml}</tbody></table>
        <div class="footer-message">
          <p>PREPARAR ESTE PEDIDO EM CONJUNTO</p>
          <p>BOM TRABALHO! 👨‍🍳</p>
        </div>
      </body>
    </html>
  `;

  // 5. Impressão
  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
