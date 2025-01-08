const APP_CONFIG = require('./config')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const fs = require('fs')
const path = require('path')

module.exports = {
  lintOnSave: false,
  productionSourceMap: false,
  publicPath: process.env.BASE_URL || '/',
  pwa: {
    name: 'neuroXiv', // 应用名称
    themeColor: '#4DBA87', // 应用的主题色
    msTileColor: '#000000', // 微软 Windows 平台的主题色
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    manifestOptions: {
      background_color: '#ffffff' // 网页加载背景色
    },
    workboxOptions: {
      runtimeCaching: [
        {
          // 默认缓存策略，优先使用缓存
          urlPattern: /\.(?:js|css|html|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
          handler: 'CacheFirst', // 使用缓存优先策略
          options: {
            cacheName: 'assets-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 缓存一周
            }
          }
        },
        {
          urlPattern: /\/version\.txt$/, // 处理版本文件，防止缓存
          handler: 'NetworkFirst', // 始终从网络获取最新版本
          options: {
            cacheName: 'version-cache'
          }
        }
      ],
      skipWaiting: true, // 强制更新 service worker
      clientsClaim: true // 新的 service worker 立即控制页面
    }
  },
  devServer: {
    clientLogLevel: 'warn',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        pathRewrite: { '^/api': '' },
        changeOrigin: true
      },
      '/data': {
        target: 'http://127.0.0.1:5000',
        pathRewrite: { '^/data': '' },
        changeOrigin: true
      },
      '/tmp': {
        target: 'http://127.0.0.1:5000',
        pathRewrite: { '^/tmp': '' },
        changeOrigin: true
      },
      '/socket.io': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  },

  pages: {
    mouse: {
      entry: 'src/pages/mouse.ts',
      template: 'public/mouse.html',
      filename: 'mouse.html',
      title: 'neuroXiv',
      chunks: ['chunk-vendors', 'chunk-common', 'mouse']
    },
    human: {
      entry: 'src/pages/human.ts',
      template: 'public/human.html',
      filename: 'human.html',
      title: 'neuroXiv',
      chunks: ['chunk-vendors', 'chunk-common', 'human']
    },
    index: {
      entry: 'src/pages/index.ts',
      template: 'public/index.html',
      filename: 'index.html',
      title: 'neuroXiv',
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    },
    proxy: {
      entry: 'src/pages/proxy.ts',
      template: 'public/proxy.html',
      filename: 'proxy.html',
      appId: APP_CONFIG.QQ_LOGIN_APP_ID
    },
    CrossSpeciesAtlas: {
      entry: 'src/pages/CrossSpeciesAtlas.ts',
      template: 'public/CrossSpeciesAtlas.html',
      filename: 'CrossSpeciesAtlas.html',
      title: 'neuroXiv',
      chunks: ['chunk-vendors', 'chunk-common', 'CrossSpeciesAtlas']
    }
  },

  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: false
    }
  },
  transpileDependencies: [
    'ml-matrix',
    'ml-cart'
  ],
  chainWebpack: config => {
    // 添加对 .mjs 文件的支持
    config.module
      .rule('mjs')
      .test(/\.mjs$/)
      .type('javascript/auto')
      .include.add(/node_modules/)
      .end()

    // 解析扩展名
    config.resolve
      .extensions
      .merge(['.mjs', '.js', '.jsx', '.vue', '.json', '.wasm'])

    // 兼容 i18n
    config.module
      .rule('i18n')
      .resourceQuery(/blockType=i18n/)
      .type('javascript/auto')
      .use('i18n')
      .loader('@kazupon/vue-i18n-loader')
      .end()
  },
  configureWebpack: {
    output: {
      filename: 'js/[name].[hash:8].js', // 主 JavaScript 文件
      chunkFilename: 'js/[name].[hash:8].js' // 分包文件
    },
    module: {
      rules: [
        {
          test: /\.mjs$/,
          type: 'javascript/auto',
          include: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        }
      ]
    },
    plugins: [
      require('./prerender.config'),
      new CompressionWebpackPlugin({
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8
      }),
      {
        apply: (compiler) => {
          compiler.hooks.done.tap('GenerateVersionFile', (stats) => {
            const version = require('./package.json').version
            const filePath = path.resolve(__dirname, './dist/version.txt')
            fs.writeFileSync(filePath, `version: ${version}\nupdated: ${new Date().toISOString()}`)
            console.log('Version file generated at:', filePath)
          })
        }
      },
      {
        apply: (compiler) => {
          compiler.hooks.done.tap('GenerateAssetManifest', (stats) => {
            const assets = stats.toJson().assetsByChunkName
            const manifest = {}
            Object.keys(assets).forEach((key) => {
              const value = Array.isArray(assets[key]) ? assets[key][0] : assets[key]
              manifest[key] = value
            })
            const filePath = path.resolve(__dirname, './dist/asset-manifest.json')
            fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2))
            console.log('Asset manifest generated at:', filePath)
          })
        }
      }
    ]
  }
}

// const APP_CONFIG = require('./config')
// const CompressionWebpackPlugin = require('compression-webpack-plugin')
//
// module.exports = {
//   lintOnSave: false,
//   productionSourceMap: false,
//
//   devServer: {
//     clientLogLevel: 'warn',
//     proxy: {
//       '/api': {
//         // target: 'http://localhost:8083',
//         target: 'http://127.0.0.1:5000',
//         pathRewrite: { '^/api': '' },
//         changeOrigin: true
//       },
//       '/data': {
//         // target: 'http://localhost:8083',
//         target: 'http://127.0.0.1:5000',
//         pathRewrite: { '^/data': '' },
//         changeOrigin: true
//       },
//       '/tmp': {
//         // target: 'http://localhost:8083',
//         target: 'http://127.0.0.1:5000',
//         pathRewrite: { '^/tmp': '' },
//         changeOrigin: true
//       },
//       '/socket.io': {
//         target: 'ws://localhost:3000',
//         ws: true
//       }
//     }
//   },
//
//   pages: {
//     mouse: {
//       // entry for the page
//       entry: 'src/pages/mouse.ts',
//       // the source template
//       template: 'public/mouse.html',
//       // output as dist/mouse.html
//       filename: 'mouse.html',
//       // when using title option,
//       // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
//       title: 'neuroXiv',
//       // chunks to include on this page, by default includes
//       // extracted common chunks and vendor chunks.
//       chunks: ['chunk-vendors', 'chunk-common', 'mouse']
//     },
//     index: {
//       // entry for the page
//       entry: 'src/pages/index.ts',
//       // the source template
//       template: 'public/index.html',
//       // output as dist/index.html
//       filename: 'index.html',
//       // when using title option,
//       // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
//       title: 'neuroXiv',
//       // chunks to include on this page, by default includes
//       // extracted common chunks and vendor chunks.
//       chunks: ['chunk-vendors', 'chunk-common', 'index']
//     },
//     // when using the entry-only string format,
//     // template is inferred to be `public/subpage.html`
//     // and falls back to `public/index.html` if not found.
//     // Output filename is inferred to be `subpage.html`.
//     proxy: { // QQ 登录成功回调页面
//       // entry for the page
//       entry: 'src/pages/proxy.ts',
//       // the source template
//       template: 'public/proxy.html',
//       // output as dist/index.html
//       filename: 'proxy.html',
//       appId: APP_CONFIG.QQ_LOGIN_APP_ID
//     },
//     CrossSpeciesAtlas: {
//       // entry for the page
//       entry: 'src/pages/CrossSpeciesAtlas.ts',
//       // the source template
//       template: 'public/CrossSpeciesAtlas.html',
//       // output as dist/index.html
//       filename: 'CrossSpeciesAtlas.html',
//       // when using title option,
//       // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
//       title: 'neuroXiv',
//       // chunks to include on this page, by default includes
//       // extracted common chunks and vendor chunks.
//       chunks: ['chunk-vendors', 'chunk-common', 'CrossSpeciesAtlas']
//     }
//   },
//
//   pluginOptions: {
//     i18n: {
//       locale: 'en',
//       fallbackLocale: 'en',
//       localeDir: 'locales',
//       enableInSFC: false
//     }
//   },
//   transpileDependencies: [
//     'ml-matrix',
//     'ml-cart'
//   ],
//   chainWebpack: config => {
//     config.module
//       .rule('i18n')
//       .resourceQuery(/blockType=i18n/)
//       .type('javascript/auto')
//       .use('i18n')
//       .loader('@kazupon/vue-i18n-loader')
//       .end()
//   },
//   configureWebpack: {
//     plugins: [
//       require('./prerender.config'),
//       new CompressionWebpackPlugin({
//         filename: '[path].gz[query]',
//         algorithm: 'gzip',
//         test: /\.(js|css|html|svg)$/,
//         threshold: 10240,
//         minRatio: 0.8
//       })
//     ]
//   }
//   // configureWebpack: {
//   //   plugins: process.env.NODE_ENV === 'production' ? [
//   //     require('./prerender.config'),
//   //     new CompressionWebpackPlugin({
//   //       filename: '[path].gz[query]',
//   //       algorithm: 'gzip',
//   //       test: /\.(js|css|html|svg)$/,
//   //       threshold: 10240,
//   //       minRatio: 0.8
//   //     })
//   //   ] : []
//   // }
// }
