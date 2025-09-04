import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/', 
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: 'index.html',
          privacy: 'privacy.html',
          about: 'about.html',
          contact: 'contact.html',
        },
      },
    },
    define: {
      'process.env.VITE_PUBLIC_DOMAIN': JSON.stringify(env.VITE_PUBLIC_DOMAIN)
    }
  };
});
