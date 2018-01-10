import { vset, vget, config, vpush, vdelete, vcreate, vnext, vkey,
  vdefault, getModule } from 'src/storeTools'

export default {
  install: function (Vue) {
    Object.defineProperty(Vue.prototype, '$vset', { value: vset })
    Object.defineProperty(Vue.prototype, '$vget', { value: vget })
    Object.defineProperty(Vue.prototype, '$vnext', { value: vnext })
    Object.defineProperty(Vue.prototype, '$vpush', { value: vpush })
    Object.defineProperty(Vue.prototype, '$vcreate', { value: vcreate })
    Object.defineProperty(Vue.prototype, '$vdelete', { value: vdelete })
    Object.defineProperty(Vue.prototype, '$vdefault', { value: vdefault })
    Object.defineProperty(Vue.prototype, '$vmod', { value: getModule })
    Object.defineProperty(Vue.prototype, '$vkey', { value: vkey })
    Object.defineProperty(Vue.prototype, '$config', { value: config })
    /*
    Vue.mixin({
      computed: {
        $logger () {
          let logger = log4javascript.getLogger(this.module)
          logger.addAppender(popUpAppender)
          return logger
        }
      }
    })
    */
  }
}
