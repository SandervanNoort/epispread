// === DEFAULT / CUSTOM STYLE ===
// WARNING! always comment out ONE of the two require() calls below.
// 1. use next line to activate CUSTOM STYLE (./src/themes)
// require(`./themes/app.${__THEME}.styl`)
// 2. or, use next line to activate DEFAULT QUASAR STYLE
require(`quasar/dist/quasar.${__THEME}.css`)
// ==============================

// Uncomment the following lines if you need IE11/Edge support
// require(`quasar/dist/quasar.ie`)
// require(`quasar/dist/quasar.ie.${__THEME}.css`)

import Vue from 'vue'
import logPlugin from 'src/plugins/logger'
import storePlugin from 'src/plugins/store'

import Quasar from 'quasar'
// import router from './router'
import './style.css'

// import * as mdc from 'material-components-web'
// import 'material-components-web/dist/material-components-web.min.css'
import 'normalize.css'
// import 'roboto-fontface/css/roboto/roboto-fontface.css'
// import 'material-design-icons/iconfont/material-icons.css'
// import './css/style.css'
import store from './store'

Vue.config.productionTip = false
Vue.use(Quasar) // Install Quasar Framework
Vue.use(logPlugin)
Vue.use(storePlugin)

if (__THEME === 'mat') {
  require('quasar-extras/roboto-font')
}
import 'quasar-extras/material-icons'
import App from 'src/App'

// import 'quasar-extras/ionicons'
// import 'quasar-extras/fontawesome'
// import 'quasar-extras/animate'

/* eslint-disable no-new */
let vm = new Vue({
  store,
  App,
  render: h => h(App)
}).$mount('#q-app')

window.store = store
window.Vue = Vue
window.vm = vm

import getVue from './getVue'
window.getVue = getVue
import * as d3 from 'd3'
window.d3 = d3

import * as data from 'src/source/data'
window.data = data

import { Parser } from 'expr-eval'
window.Parser = Parser

import { plugins } from 'source/getSource'
window.plugins = plugins

import * as storeTools from 'src/storeTools'
window.storeTools = storeTools
