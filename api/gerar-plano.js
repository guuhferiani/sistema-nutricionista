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
    model: "gemini-flash-latest",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
Você é um nutricionista profissional.
Gere um plano alimentar semanal com base nos dados abaixo.

⚠️ Regras:
- Responda APENAS em JSON válido
- Não use markdown
- Respeite restrições e alergias

Dados do paciente:
${JSON.stringify(dados_do_paciente, null, 2)}

Formato obrigatório:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"],
        "lanche_manha": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"],
        "almoco": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"],
        "lanche_tarde": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"],
        "jantar": ["opção 1", "opção 2", "opção 3", "opção 4", "opção 5"]
      }
    }
  ]
}

Regras:
- gerar 7 dias (Segunda a Domingo)
- 5 opções por refeição
- evitar repetição
- usar alimentos comuns no Brasil
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
