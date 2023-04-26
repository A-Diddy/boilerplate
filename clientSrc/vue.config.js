const {defineConfig} = require('@vue/cli-service')
// const path = require("path");

module.exports = defineConfig({
  transpileDependencies: true,
  // outputDir: path.resolve(__dirname, "../public/app"),
  indexPath: 'index.ejs',
  // devServer: {
  //   proxy: 'https://localhost'
  // }
  devServer: {
    proxy: {
      '^/login': {
        target: 'https://localhost',
        changeOrigin: true,
        ws: true
      },

      '^/logout': {
        target: 'https://localhost',
        changeOrigin: true,
        ws: true
      },

      '^/q': {
        target: 'https://localhost',
        changeOrigin: true,
        ws: true
      },

      '^/io': {
        target: 'https://localhost',
        changeOrigin: true,
        ws: true
      },

      '^/m': {
        target: 'https://localhost',
        changeOrigin: true,
        ws: true
      },

      // '/': {
      //   target: 'https://localhost',
      //   changeOrigin: true,
      //   ws: true
      // }
    }
  }
})
