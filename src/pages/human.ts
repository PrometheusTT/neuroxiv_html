import Vue from 'vue'
import App from './HumanApp.vue'
import '@/registerServiceWorker'
import router from '@/router/human'
import store from '@/store/human'
import '@/plugins/element'

import '@/styles/main.less'
import i18n from '@/i18n/human'
import '@/polyfill'
import '@/pageInitSetup'

Vue.config.productionTip = false

declare global {
  interface Window {
    vm: Vue
  }
}
// 版本检查逻辑
async function checkVersion () {
  try {
    const response = await fetch('/version.txt', { cache: 'no-cache' })
    const text = await response.text()
    const remoteVersion = text.split(': ')[1].trim()
    console.log('current remote version: ' + remoteVersion)
    const localVersion = localStorage.getItem('app-version')
    console.log('current local version: ' + localVersion)
    if (localVersion !== remoteVersion) {
      localStorage.setItem('app-version', remoteVersion)
      window.location.reload()
    }
  } catch (error) {
    console.error('Failed to check version:', error)
  }
}

checkVersion()

window.vm = new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')
