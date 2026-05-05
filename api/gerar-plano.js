import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// Definição do Schema com Zod para consistência total
const RefeicoesSchema = z.object({
  cafe_da_manha: z.array(z.string()).length(5),
  lanche_manha: z.array(z.string()).length(5),
  almoco: z.array(z.string()).length(5),
  lanche_tarde: z.array(z.string()).length(5),
  jantar: z.array(z.string()).length(5),
});

const DiaSchema = z.object({
  dia: z.string(),
  refeicoes: RefeicoesSchema,
});

const PlanoAlimentarSchema = z.object({
  plano_semanal: z.array(DiaSchema).length(7),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { GOOGLE_API_KEY } = process.env;
  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'API Key do Google não configurada.' });
  }

  const { dados_do_paciente } = req.body;
  if (!dados_do_paciente) {
    return res.status(400).json({ error: 'Dados do paciente são obrigatórios.' });
  }

  const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
Você é um nutricionista clínico de alta performance, especializado em nutrição personalizada e esportiva.
Gere um plano alimentar semanal (7 dias: Segunda a Domingo) para o paciente abaixo, com foco em seus objetivos e respeitando RIGOROSAMENTE suas restrições e alergias.

DADOS DO PACIENTE:
${JSON.stringify(dados_do_paciente, null, 2)}

DIRETRIZES TÉCNICAS:
1. Variedade: Evite repetições excessivas. Alterne fontes de proteína, carboidratos e gorduras boas.
2. Contexto Brasileiro: Use alimentos acessíveis e comuns na culinária do Brasil (ex: feijão, arroz, tapioca, frutas tropicais).
3. Estrutura: Para cada uma das 5 refeições do dia, você deve fornecer exatamente 5 OPÇÕES distintas e saudáveis.
4. Clareza: Cada opção deve ser descritiva e incluir medidas caseiras (ex: "1 colher de servir", "2 fatias", "200ml").

⚠️ REGRAS DE SAÍDA:
- Responda APENAS em JSON válido.
- Não inclua explicações fora do JSON.
- Respeite o formato exato abaixo.

FORMATO JSON OBRIGATÓRIO:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1 com medidas", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}
`;

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const rawJson = JSON.parse(text);

      // VALIDAÇÃO COM ZOD
      const validation = PlanoAlimentarSchema.safeParse(rawJson);

      if (validation.success) {
        return res.status(200).json(validation.data);
      }

      console.warn(`Tentativa ${attempts + 1} falhou na validação Zod:`, validation.error.format());
      attempts++;
    } catch (error) {
      console.error(`Erro na tentativa ${attempts + 1}:`, error);
      attempts++;
      if (attempts === maxAttempts) {
        return res.status(500).json({ error: 'Erro persistente na geração do plano.', details: error.message });
      }
    }
  }

  return res.status(500).json({ 
    error: 'A IA gerou um plano com estrutura inválida após múltiplas tentativas.',
    details: 'A estrutura JSON não condiz com o esperado pelo sistema.'
  });
}
