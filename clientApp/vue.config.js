const {defineConfig} = require('@vue/cli-service')

const serverUrl = process.env.VUE_APP_REMOTE_DEV_SERVER_HOST;

module.exports = defineConfig({
  transpileDependencies: true,
  // outputDir: path.resolve(__dirname, "../public/app"),
  indexPath: 'index.ejs',
  // devServer: {
  //   proxy: serverUrl
  // }
  devServer: {
    hot: true,
    liveReload: false,
    allowedHosts: 'all',
    proxy: {
      // '^/login': {
      //   target: serverUrl+'/auth',
      //   changeOrigin: true,
      //   ws: true
      // },

      // '^/logout': {
      //   target: serverUrl,
      //   changeOrigin: true,
      //   ws: true
      // },

      '^/auth': {
        target: serverUrl,
        changeOrigin: false,
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

      // '/': {
      //   target: serverUrl,
      //   changeOrigin: true,
      //   ws: true
      // }
    }
  }
})
