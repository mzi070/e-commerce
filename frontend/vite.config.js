import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'require-api-url',
        buildStart() {
          if (mode === 'production' && !env.VITE_API_URL) {
            this.error(
              'VITE_API_URL is not set. ' +
              'Set it to the deployed API URL before running a production build.'
            );
          }
        },
      },
    ],
  };
})
