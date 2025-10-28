// tables/utils/printKitchenOrder.js

/**
 * Imprime uma comanda de COZINHA consolidada de todos os pedidos de uma mesa em uma única página.
 * O formato é otimizado para CLAREZA e impresso em impressora térmica (tipo Bematech).
 * Estilo: Diner Americano dos Anos 70 (Foco em funcionalidade e blocos).
 *
 * @param {Array<Object>} orders - Uma lista de objetos de pedido.
 * @param {number|string} tableNumber - O número da mesa.
 */
export const printKitchenOrder = (orders, tableNumber) => {
  if (!orders || orders.length === 0) return;

  // 1. Consolidação dos Itens (Agrupando produtos iguais de pedidos diferentes)
  const consolidatedItems = {};

  orders.forEach(order => {
    const orderId = order.order_id;
    order.produtos.forEach(p => {
      // Chave única para o produto (nome + observações)
      const key = `${p.nome.trim().toUpperCase()}|${p.descricao.trim().toUpperCase()}`;
      
      if (!consolidatedItems[key]) {
        consolidatedItems[key] = {
          nome: p.nome.trim().toUpperCase(),
          quantidade: 0,
          descricao: p.descricao.trim(),
          pedidos: [] // Para rastrear de qual pedido veio
        };
      }
      
      consolidatedItems[key].quantidade += Number(p.quantidade);
      consolidatedItems[key].pedidos.push(orderId);
    });
  });

  const finalItems = Object.values(consolidatedItems);


  // 2. Estilos CSS (Foco em COZINHA: negrito, caixa alta, quantidade grande)
  const styles = `
    body {
      font-family: 'Consolas', monospace; /* Fonte monoespaçada é a alma da comanda */
      font-size: 12pt;
      margin: 0 auto;
      padding: 10px 5px;
      line-height: 1.2;
      color: #000;
      width: 100%;
      max-width: 80mm; /* Largura típica de impressora de bobina */
      font-weight: bold; /* Tudo em negrito para melhor leitura */
    }
    
    /* Título em CAPS LOCK e centralizado para o estilo retrô */
    .title {
      text-align: center;
      font-size: 16pt;
      padding: 5px 0;
      margin: 0;
      text-transform: uppercase;
      border-bottom: 3px solid #000; /* Linha grossa tipo "quadro" do Diner */
    }

    /* Informações da mesa/pedido */
    .header-info {
        margin: 8px 0;
        padding: 5px 0;
        border-bottom: 2px dashed #000; /* Linha tracejada funcional */
        font-size: 14pt;
        text-align: center;
    }
    .header-info p { margin: 3px 0; }
    
    /* Layout dos itens: Tabela com foco em Quantidade e Nome */
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
    
    /* --- QUANTIDADE EM DESTAQUE --- */
    .qty-cell {
        font-size: 24pt; /* QUANTIDADE GIGANTE */
        font-weight: 900; /* Ultra-Negrito */
        color: #000;
        width: 15%; /* Espaço para o número */
        text-align: center;
        border-right: 2px solid #000; /* Linha de separação estilo "comanda" */
    }
    
    /* Nome do Item */
    .item-name {
        font-size: 14pt; /* Nome do item grande */
        width: 65%;
        padding-left: 8px;
    }
    
    /* Seção de OBSERVAÇÃO */
    .descricao {
        font-size: 10pt;
        font-style: italic;
        color: #333;
        margin-top: -3px; /* Aproxima da linha do item */
        padding: 2px 0 5px 8px;
        border-bottom: 1px dashed #777;
    }
    
    /* Rodapé para observações gerais */
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

  // 3. HTML dos Itens Consolidados
  const itemsHtml = finalItems
    .map((p) => {
      // Lista de IDs de pedidos (ex: P#1, P#3)
      const pedidoList = [...new Set(p.pedidos)].map(id => `P#${id}`).join(', ');
      
      return `
        <tr>
          <td class="qty-cell">${p.quantidade}</td>
          <td class="item-name">${p.nome}</td>
        </tr>
        ${p.descricao ? `
        <tr>
            <td colspan="2" class="observacao">>> OBS: ${p.descricao}</td>
        </tr>
        ` : ''}
        <tr>
            <td colspan="2" style="font-size: 8pt; text-align: right; padding-bottom: 8px; padding-right: 5px;">
                (Origem: ${pedidoList})
            </td>
        </tr>
      `;
    })
    .join("");


  // 4. Estrutura HTML Final
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

        <table>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div class="footer-message">
            <p>PREPARAR ESTE PEDIDO EM CONJUNTO</p>
            <p>BOM TRABALHO! 👨‍🍳</p>
        </div>
      </body>
    </html>
  `;

  // 5. Lógica de impressão
  const printWindow = window.open("", "_blank");
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  // printWindow.close(); 
};