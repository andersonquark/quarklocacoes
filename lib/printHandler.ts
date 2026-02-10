import { Order, Equipment } from '../types';

export const printOrder = (order: Order, equipmentList: Equipment[]) => {
  // Cláusulas padrão de contrato de locação
  const contractTerms = `
    1. OBJETO: O presente contrato tem como objeto a locação dos bens móveis descritos neste documento.
    2. PRAZO: O prazo de locação é o estipulado neste pedido, podendo ser prorrogado mediante acordo entre as partes.
    3. VALOR E PAGAMENTO: O locatário pagará à locadora o valor total estipulado, na forma de pagamento selecionada.
    4. CONSERVAÇÃO: O locatário declara receber os bens em perfeito estado de conservação e funcionamento, obrigando-se a devolvê-los nas mesmas condições, salvo o desgaste natural pelo uso.
    5. DANOS E EXTRAVIO: Em caso de dano, perda, roubo ou furto dos equipamentos, o locatário será responsável pelo pagamento do valor de reposição do bem a preço de mercado atual.
    6. USO: Os equipamentos devem ser utilizados exclusivamente para o fim a que se destinam, sendo vedada a sublocação ou empréstimo a terceiros sem autorização expressa.
    7. DEVOLUÇÃO: A não devolução dos equipamentos na data estipulada sujeitará o locatário ao pagamento das diárias excedentes até a efetiva devolução, acrescido de multa de 10%.
    8. FORO: Fica eleito o foro da comarca local para dirimir quaisquer dúvidas oriundas deste contrato.
  `;

  const itemsHtml = order.items.map(item => {
    const eqName = equipmentList.find(e => e.id === item.equipmentId)?.name || item.equipmentName || 'Item';
    const total = item.quantity * item.priceSnapshot;
    return `
      <tr class="border-b">
        <td class="py-2">${item.quantity}</td>
        <td class="py-2">${eqName}</td>
        <td class="py-2 text-right">R$ ${item.priceSnapshot.toFixed(2)}</td>
        <td class="py-2 text-right">R$ ${total.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pedido #${order.id}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        body { font-family: sans-serif; -webkit-print-color-adjust: exact; }
        @media print {
            .no-print { display: none; }
            body { padding: 0; margin: 0; }
        }
      </style>
    </head>
    <body class="p-8 max-w-4xl mx-auto bg-white">
      
      <!-- Cabeçalho -->
      <div class="flex justify-between items-center border-b-2 border-gray-800 pb-6 mb-6">
        <div>
           <h1 class="text-3xl font-bold text-gray-900">QUARK LOCAÇÕES</h1>
           <p class="text-sm text-gray-500">Locação de Andaimes e Equipamentos</p>
           <p class="text-sm text-gray-500">CNPJ: 00.000.000/0001-00</p>
           <p class="text-sm text-gray-500">Rua da Sede, 123 - Centro</p>
        </div>
        <div class="text-right">
           <h2 class="text-xl font-bold text-gray-800">${order.type === 'ORCAMENTO' ? 'ORÇAMENTO' : 'CONTRATO DE LOCAÇÃO'}</h2>
           <p class="text-lg text-red-600 font-bold">#${order.id.slice(0, 8)}</p>
           <p class="text-sm text-gray-500">Emissão: ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <!-- Dados do Cliente e Entrega -->
      <div class="grid grid-cols-2 gap-8 mb-8">
         <div>
            <h3 class="font-bold border-b border-gray-300 mb-2 uppercase text-xs text-gray-500">Locatário / Cliente</h3>
            <p class="font-bold">${order.clientName}</p>
            <p class="text-sm">CPF/CNPJ: (Conforme cadastro)</p>
         </div>
         <div>
            <h3 class="font-bold border-b border-gray-300 mb-2 uppercase text-xs text-gray-500">Local de Entrega</h3>
            <p class="text-sm">${order.street}, ${order.number}</p>
            <p class="text-sm">${order.neighborhood} - ${order.city}/${order.state}</p>
            <p class="text-sm">CEP: ${order.zipCode}</p>
            ${order.reference ? `<p class="text-xs italic mt-1">Ref: ${order.reference}</p>` : ''}
         </div>
      </div>

      <!-- Detalhes do Pedido -->
      <div class="bg-gray-50 p-4 rounded-lg mb-8 border border-gray-200">
         <div class="grid grid-cols-4 gap-4 text-sm text-center">
            <div>
               <span class="block font-bold text-xs uppercase text-gray-500">Data Entrega</span>
               <span class="font-bold">${new Date(order.deliveryDate).toLocaleDateString()}</span>
            </div>
            <div>
               <span class="block font-bold text-xs uppercase text-gray-500">Data Devolução</span>
               <span class="font-bold">${new Date(order.returnDate).toLocaleDateString()}</span>
            </div>
             <div>
               <span class="block font-bold text-xs uppercase text-gray-500">Período</span>
               <span class="font-bold">${order.billingPeriod}</span>
            </div>
             <div>
               <span class="block font-bold text-xs uppercase text-gray-500">Pagamento</span>
               <span class="font-bold">${order.paymentMethod}</span>
            </div>
         </div>
      </div>

      <!-- Itens -->
      <div class="mb-8">
        <h3 class="font-bold border-b-2 border-gray-800 mb-4 uppercase text-sm">Equipamentos Locados</h3>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left border-b border-gray-300">
               <th class="py-2 w-16">Qtd</th>
               <th class="py-2">Descrição</th>
               <th class="py-2 text-right">Valor Unit.</th>
               <th class="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
             <tr class="border-t border-gray-300 font-bold">
                <td colspan="3" class="py-2 text-right pt-4">Subtotal:</td>
                <td class="py-2 text-right pt-4">R$ ${(order.totalAmount - order.shippingCost).toFixed(2)}</td>
             </tr>
             <tr class="font-bold text-gray-600">
                <td colspan="3" class="py-1 text-right">Frete:</td>
                <td class="py-1 text-right">R$ ${order.shippingCost.toFixed(2)}</td>
             </tr>
             <tr class="text-lg font-bold">
                <td colspan="3" class="py-2 text-right">TOTAL GERAL:</td>
                <td class="py-2 text-right">R$ ${order.totalAmount.toFixed(2)}</td>
             </tr>
          </tfoot>
        </table>
      </div>

      <!-- Cláusulas -->
      <div class="mb-12">
         <h3 class="font-bold border-b border-gray-300 mb-2 uppercase text-xs text-gray-500">Termos e Condições</h3>
         <div class="text-[10px] text-justify text-gray-600 leading-relaxed border border-gray-200 p-4 rounded bg-gray-50">
            ${contractTerms.replace(/\n/g, '<br>')}
         </div>
      </div>

      <!-- Assinaturas -->
      <div class="grid grid-cols-2 gap-12 mt-16 break-inside-avoid">
         <div class="text-center">
             <div class="border-b border-black mb-2 h-16 flex items-end justify-center">
                ${order.signatureUrl ? `<img src="${order.signatureUrl}" class="h-14 mb-1" />` : ''}
             </div>
             <p class="font-bold text-sm uppercase">${order.clientName}</p>
             <p class="text-xs text-gray-500">Locatário</p>
         </div>
         <div class="text-center">
             <div class="border-b border-black mb-2 h-16"></div>
             <p class="font-bold text-sm uppercase">Quark Locações</p>
             <p class="text-xs text-gray-500">Locador</p>
         </div>
      </div>

      <div class="mt-8 text-center text-xs text-gray-400 no-print">
         <button onclick="window.print()" class="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg">Imprimir / Salvar PDF</button>
      </div>

    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};