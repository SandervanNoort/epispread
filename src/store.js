import Vue from 'vue'
import Vuex from 'vuex'
import { newStore } from './storeTools'
import state from './storeDefault'

Vue.use(Vuex)

let settings = {
  global: {
    tooltip: {
      xgap: {
        default: 50,
        type: 'int'
      },
      ygap: {
        default: 30,
        type: 'int'
      }
    },
    zoom: {
      step: {
        default: 1.1,
        type: 'float',
        min: 1
      },
      duration: {
        type: 'int',
        default: 500
      }
    },
    layout: {
      title: {
        default: 'TITLE',
        type: 'text'
      },
      subtitle: {
        default: 'Interactive epidemiological maps and graphs',
        type: 'text',
        optional: true
      },
      footer: {
        default: false,
        type: 'bool'
      },
      view: {
        default: 'hHh LpR fFf',
        type: 'text'
      },
      containerSM: {
        default: 250,
        type: 'int'
      },
      advanced: {
        default: false,
        type: 'bool'
      }
    },
    drawer: {
      gap: {
        default: 50,
        type: 'int'
      },
      left: {
        width: {
          default: 400,
          type: 'int',
          min: 200
        },
        breakpoint: {
          default: 800,
          type: 'int'
        }
      },
      right: {
        width: {
          default: 300,
          type: 'int',
          min: 100
        },
        breakpoint: {
          default: 1500,
          type: 'int'
        }
      }
    }
  },
  _status: {
    leftWidth: {type: 'int', default: 0},
    rightWidth: {type: 'int', default: 0},
    headerHeight: {type: 'int', default: 0},
    footerHeight: {type: 'int', default: 0},
    height: {type: 'int', default: 0},
    width: {type: 'int', default: 0},
    leftMenu: {
      default () { return '/' },
      type: 'text'
    }
  }
}

let store = newStore({
  state: state,
  settings: settings
})

store = new Vuex.Store(store)

export default store
