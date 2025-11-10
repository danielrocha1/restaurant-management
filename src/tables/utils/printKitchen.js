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
    @media print {
      body * {
        visibility: hidden;
      }
      .kitchen-print-content, .kitchen-print-content * {
        visibility: visible;
      }
      .kitchen-print-content {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
    }
    
    .kitchen-print-content {
      font-family: 'Consolas', monospace;
      font-size: 12pt;
      margin: 0 auto;
      padding: 10px 5px;
      line-height: 1.2;
      color: #000;
      width: 100%;
      max-width: 80mm;
      font-weight: bold;
      background: white;
    }
    .kitchen-print-content .title {
      text-align: center;
      font-size: 16pt;
      padding: 5px 0;
      margin: 0;
      text-transform: uppercase;
      border-bottom: 3px solid #000;
    }
    .kitchen-print-content .header-info {
      margin: 8px 0;
      padding: 5px 0;
      border-bottom: 2px dashed #000;
      font-size: 14pt;
      text-align: center;
    }
    .kitchen-print-content .header-info p { margin: 3px 0; }
    .kitchen-print-content table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .kitchen-print-content th, .kitchen-print-content td {
      padding: 5px 2px;
      text-align: left;
      border: none;
      vertical-align: top;
      line-height: 1.1;
    }
    .kitchen-print-content .qty-cell {
      font-size: 24pt;
      font-weight: 900;
      color: #000;
      width: 15%;
      text-align: center;
      border-right: 2px solid #000;
    }
    .kitchen-print-content .item-name {
      font-size: 14pt;
      width: 65%;
      padding-left: 8px;
    }
    .kitchen-print-content .observacao {
      font-size: 10pt;
      font-style: italic;
      color: #333;
      margin-top: -3px;
      padding: 2px 0 5px 8px;
      border-bottom: 1px dashed #777;
    }
    .kitchen-print-content .footer-message {
      text-align: center;
      margin-top: 20px;
      font-size: 10pt;
      padding: 8px 0;
      border-top: 3px solid #000;
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

  // 4. Estrutura HTML completa para impressão
  const printContent = `
    <div class="kitchen-print-content">
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
    </div>
  `;

  // 5. Impressão sem abrir nova janela
  try {
    // Verifica se já existe um elemento de impressão, se sim, remove
    const existingPrintElement = document.getElementById('kitchen-print-element');
    if (existingPrintElement) {
      existingPrintElement.remove();
    }

    // Verifica se já existe o estilo, se não, adiciona
    let styleElement = document.getElementById('kitchen-print-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'kitchen-print-styles';
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    }

    // Cria elemento temporário para impressão
    const printElement = document.createElement('div');
    printElement.id = 'kitchen-print-element';
    printElement.innerHTML = printContent;
    printElement.style.position = 'fixed';
    printElement.style.top = '-9999px';
    printElement.style.left = '-9999px';
    
    // Adiciona ao DOM
    document.body.appendChild(printElement);

    // Executa a impressão
    console.log("Executando impressão da cozinha para mesa:", tableNumber);
    window.print();

    // Remove o elemento após um pequeno delay (para garantir que a impressão foi processada)
    setTimeout(() => {
      try {
        if (document.getElementById('kitchen-print-element')) {
          document.getElementById('kitchen-print-element').remove();
        }
      } catch (e) {
        console.warn("Erro ao remover elemento de impressão:", e);
      }
    }, 1000);

  } catch (error) {
    console.error("Erro ao executar a impressão da cozinha:", error);
  }
};