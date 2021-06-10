if (process.env.NODE_ENV !== 'development') window.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')

import Vue from 'vue'
import axios from 'axios'

import App from './App'
import store from './store'
import vuetify from './plugins/vuetify'

import { start } from './services';
import Shell from './shell'

start().then(() => {
  Shell.doWork()
})

if (!process.env.IS_WEB) Vue.use(require('vue-electron'))
Vue.http = Vue.prototype.$http = axios
Vue.config.productionTip = false


new Vue({
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')