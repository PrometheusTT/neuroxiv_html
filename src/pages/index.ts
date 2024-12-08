import Vue from 'vue'
import App from './IndexApp.vue'
import '@/registerServiceWorker'
import router from '@/router'
import store from '@/store'
import '@/plugins/element'

import '@/styles/main.less'
import i18n from '@/i18n'
import '@/polyfill'
import '@/pageInitSetup'

Vue.config.productionTip = false

declare global {
  interface Window {
    vm: Vue
  }
}
async function checkVersion () {
  try {
    const response = await fetch('/version.txt', { cache: 'no-cache' })
    const text = await response.text()
    const remoteVersion = text.split(': ')[1].trim()

    const localVersion = localStorage.getItem('app-version')
    if (localVersion !== remoteVersion) {
      if (confirm('A new version is available. Refresh now?')) {
        localStorage.setItem('app-version', remoteVersion)
        window.location.reload()
      }
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
