import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import {fileURLToPath, URL} from 'node:url'

// https://vitejs.dev/config/

export default ({mode}) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};
  const serverUrl = process.env.VITE_REMOTE_DEV_SERVER_HOST;

  return defineConfig({
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      // indexPath: "index.ejs"   // May not be possible with Vite
    },
    server: {
      // port: 8080,
      watch: {
        usePolling: true      // Required for Windows Subsystem for Linux (WSL)
      },
      proxy: {
        '^/auth': {
          target: serverUrl,
          changeOrigin: true,
          ws: true
        },
        '^/q': {
          target: serverUrl,
          changeOrigin: true,
          ws: true
        },
        '^/io': {
          target: serverUrl,
          changeOrigin: true,
          ws: true
        },
        '^/m': {
          target: serverUrl,
          changeOrigin: true,
          ws: true
        },
      }
    }
  }
)}
