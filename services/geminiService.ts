
import { GoogleGenAI } from "@google/genai";
import { RentalOrder, Customer, Equipment, RentalStatus } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateBirthdayMessage = async (customerName: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return `Parabéns ${customerName}! A Quark Locações deseja muitas felicidades!`;

  const prompt = `
    Crie uma mensagem curta e profissional de Feliz Aniversário para um cliente chamado ${customerName}.
    A empresa é a "Quark Locações" (aluguel de equipamentos).
    Tom: Amigável, profissional, agradecendo a parceria.
    Formato: Pronto para WhatsApp (pode usar emojis).
    Máximo: 2 frases.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || `Parabéns ${customerName}! Felicidades!`;
  } catch (error) {
    return `Parabéns ${customerName}! Sucesso e felicidades!`;
  }
};

export const generateLatePaymentMessage = async (
  rental: RentalOrder,
  customer: Customer
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Erro: Chave de API não configurada.";

  const prompt = `
    Você é um assistente administrativo de uma empresa de aluguel de andaimes chamada 'AndaimesPro'.
    Escreva uma mensagem educada, profissional e curta para o cliente cobrando a devolução ou renovação de equipamentos atrasados.
    Use tom amigável mas firme. Formato para WhatsApp.
    
    Dados do Cliente: ${customer.name}
    Data Prevista de Devolução: ${rental.endDate}
    Valor Total do Contrato Original: R$ ${rental.totalValue.toFixed(2)}
    ID do Pedido: ${rental.id}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a mensagem.";
  } catch (error) {
    console.error("Error generating message:", error);
    return "Erro ao conectar com a IA.";
  }
};

export const analyzeBusinessHealth = async (
  rentals: RentalOrder[],
  equipment: Equipment[]
): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Análise indisponível.";

  const activeRentals = rentals.filter(r => r.status === RentalStatus.ACTIVE).length;
  const lateRentals = rentals.filter(r => r.status === RentalStatus.LATE).length;
  const totalRevenue = rentals.reduce((acc, curr) => acc + curr.totalValue, 0);
  const lowStockItems = equipment.filter(e => (e.stockTotal - e.stockRented) < 10).map(e => e.name);

  const prompt = `
    Analise os seguintes dados operacionais da empresa de andaimes e forneça um resumo executivo de 3 pontos (HTML bullet points) sobre a saúde do negócio e recomendações.
    Seja breve e direto.
    
    - Aluguéis Ativos: ${activeRentals}
    - Aluguéis Atrasados: ${lateRentals}
    - Receita Total (Histórico): R$ ${totalRevenue.toFixed(2)}
    - Itens com estoque crítico (menos de 10 disponíveis): ${lowStockItems.join(', ')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Sem dados suficientes.";
  } catch (error) {
    console.error("Error analyzing health:", error);
    return "Erro na análise de IA.";
  }
};
