
/**
 * Imprime uma comanda de COZINHA consolidada de todos os itens de um pedido.
 * Compatível com o formato retornado pelo backend via WebSocket (order.Items).
 *
 * @param {Array<Object>} items - Lista de itens (cada um tem Produto, Quantidade e PrecoUnitario).
 * @param {number|string} tableNumber - Número da mesa.
 */
export const printKitchenOrder = (items, tableNumber) => {
  console.log("=== INÍCIO DA FUNÇÃO printKitchenOrder ===");
  console.log("Items recebidos:", items);
  console.log("Número da mesa:", tableNumber);
  
  if (!items || items.length === 0) {
    console.log("❌ Nenhum item encontrado para impressão");
    alert("Erro: Nenhum item encontrado para impressão");
    return;
  }

  // 1. Consolidação dos Itens (agrupa produtos iguais)
  const consolidatedItems = {};

  items.forEach((item, index) => {
    console.log(`📦 Processando item ${index + 1}:`, item);
    
    const produto = item.Produto || {};
    console.log("Produto extraído:", produto);
    
    const nome = produto.Nome?.trim().toUpperCase() || "ITEM DESCONHECIDO";
    const descricao = produto.Descricao?.trim() || "";
    
    console.log(`Nome: "${nome}", Descrição: "${descricao}"`);

    const key = `${nome}|${descricao}`;

    if (!consolidatedItems[key]) {
      consolidatedItems[key] = {
        nome,
        quantidade: 0,
        descricao,
        pedidos: []
      };
    }

    consolidatedItems[key].quantidade += Number(item.Quantidade) || 0;
    consolidatedItems[key].pedidos.push(item.OrderID || item.ID);
    
    console.log(`✅ Item consolidado: ${nome} - Qtd: ${consolidatedItems[key].quantidade}`);
  });

  const finalItems = Object.values(consolidatedItems);
  console.log("🎯 Itens finais consolidados:", finalItems);

  if (finalItems.length === 0) {
    console.log("❌ Nenhum item final para imprimir");
    alert("Erro: Nenhum item consolidado encontrado");
    return;
  }

  // 2. Monta o HTML dos itens consolidados
  const itemsHtml = finalItems
    .map((p, index) => {
      console.log(`🏗️ Gerando HTML para item ${index + 1}:`, p);
      const pedidoList = [...new Set(p.pedidos)].map(id => `P#${id}`).join(', ');
      const html = `
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
      console.log(`HTML gerado para ${p.nome}:`, html);
      return html;
    })
    .join("");

  console.log("📄 HTML completo dos itens:", itemsHtml);

  // 3. Estrutura HTML completa para impressão
  const printContent = `
    <div style="font-family: 'Consolas', monospace; font-size: 12pt; margin: 0 auto; padding: 10px 5px; line-height: 1.2; color: #000; width: 100%; max-width: 80mm; font-weight: bold; background: white;">
      <h1 style="text-align: center; font-size: 16pt; padding: 5px 0; margin: 0; text-transform: uppercase; border-bottom: 3px solid #000;">COZINHA CHECKLIST</h1>
      <div style="margin: 8px 0; padding: 5px 0; border-bottom: 2px dashed #000; font-size: 14pt; text-align: center;">
        <p style="margin: 3px 0;">MESA: <span style="font-size: 20pt; color: #D9534F;">** ${tableNumber} **</span></p>
        <p style="margin: 3px 0;">HORA: ${new Date().toLocaleTimeString('pt-BR').substring(0, 5)}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="text-align: center; margin-top: 20px; font-size: 10pt; padding: 8px 0; border-top: 3px solid #000;">
        <p>PREPARAR ESTE PEDIDO EM CONJUNTO</p>
        <p>BOM TRABALHO! 👨‍🍳</p>
      </div>
    </div>
  `;

  console.log("🖨️ Conteúdo completo da impressão:", printContent);

  // 4. Método alternativo - usando nova janela com conteúdo inline
  try {
    console.log("🚀 Iniciando processo de impressão...");
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      console.error("❌ Não foi possível abrir janela de impressão - popup bloqueado?");
      alert("Erro: Não foi possível abrir janela de impressão. Verifique se popups estão bloqueados.");
      return;
    }

    console.log("✅ Janela de impressão aberta com sucesso");

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comanda Cozinha Mesa ${tableNumber}</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Consolas', monospace;
              font-size: 12pt;
              margin: 0;
              padding: 10px;
              line-height: 1.2;
              color: #000;
              background: white;
            }
            .qty-cell {
              font-size: 24pt;
              font-weight: 900;
              color: #000;
              width: 15%;
              text-align: center;
              border-right: 2px solid #000;
              padding: 5px 2px;
            }
            .item-name {
              font-size: 14pt;
              width: 65%;
              padding-left: 8px;
              padding: 5px 2px;
            }
            .observacao {
              font-size: 10pt;
              font-style: italic;
              color: #333;
              margin-top: -3px;
              padding: 2px 0 5px 8px;
              border-bottom: 1px dashed #777;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            td {
              padding: 5px 2px;
              text-align: left;
              border: none;
              vertical-align: top;
              line-height: 1.1;
            }
            @media print {
              body { margin: 0; padding: 5px; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `;

    console.log("📝 HTML completo da janela:", fullHtml);

    printWindow.document.write(fullHtml);
    printWindow.document.close();

    console.log("✅ Conteúdo escrito na janela");

    // Aguarda carregamento e imprime
    printWindow.onload = function() {
      console.log("✅ Janela carregada, iniciando impressão...");
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        console.log("🖨️ Comando de impressão executado");
        
        // Fecha a janela após impressão
        setTimeout(() => {
          printWindow.close();
          console.log("✅ Janela fechada");
        }, 1000);
      }, 500);
    };

    // Fallback se onload não funcionar
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        console.log("🔄 Executando fallback de impressão...");
        try {
          printWindow.focus();
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        } catch (e) {
          console.error("❌ Erro no fallback:", e);
        }
      }
    }, 2000);

  } catch (error) {
    console.error("❌ Erro ao executar a impressão da cozinha:", error);
    alert(`Erro na impressão: ${error.message}`);
  }

  console.log("=== FIM DA FUNÇÃO printKitchenOrder ===");
};

 