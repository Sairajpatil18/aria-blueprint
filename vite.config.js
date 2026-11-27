import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vercel runs everything in /api as serverless functions. `vercel dev` can't be
 * used without logging in, so in local dev we mount the exact same handler as
 * Vite middleware. Same code path locally and in production, zero extra tools.
 */
function apiDevServer(env) {
  return {
    name: 'aria-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/blueprint', async (req, res) => {
        // Make the loaded .env.local values visible to the handler.
        for (const [key, value] of Object.entries(env)) {
          if (key.startsWith('GEMINI_') && process.env[key] === undefined) {
            process.env[key] = value;
          }
        }
        try {
          const { default: handler } = await server.ssrLoadModule('/api/blueprint.js');
          await handler(req, res);
        } catch (error) {
          server.config.logger.error(`[api] ${error.stack || error}`);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Blueprint service failed to start.' }));
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  return {
    plugins: [react(), apiDevServer(env)],
    build: { outDir: 'dist', sourcemap: false },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
