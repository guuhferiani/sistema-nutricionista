import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente do .env.local para o processo do servidor
dotenv.config({ path: '.env.local' })

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-handler',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url.startsWith('/api/gerar-plano')) {
            try {
              // Importar o handler dinamicamente
              const { default: handler } = await server.ssrLoadModule('./api/gerar-plano.js');
              
              // Mock do body parser (lendo o stream da requisição)
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                const mockReq = {
                  method: req.method,
                  body: body ? JSON.parse(body) : {},
                  headers: req.headers
                };

                const mockRes = {
                  status(code) {
                    res.statusCode = code;
                    return this;
                  },
                  json(data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  }
                };

                await handler(mockReq, mockRes);
              });
              return;
            } catch (error) {
              console.error('Erro no proxy da API:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Erro interno no servidor de API local' }));
              return;
            }
          }
          next();
        });
      }
    }
  ],
})
