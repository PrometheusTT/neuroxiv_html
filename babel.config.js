module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset',
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: '> 0.25%, not dead'
        }
      }
    ]
  ]
}
