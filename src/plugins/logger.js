import log4javascript from 'log4javascript'

let popUpAppender = new log4javascript.PopUpAppender()
let layout = new log4javascript.PatternLayout('%d{HH:mm:ss,SSS} [%p] %c %m')
popUpAppender.setLayout(layout)
popUpAppender.setInitiallyMinimized(true)

let getLogger = function (name) {
  let logger = log4javascript.getLogger(name)
  logger.addAppender(popUpAppender)
  return logger
}

let plugin = {
  install: function (Vue) {
    Object.defineProperty(Vue.prototype, '$popUpAppender', { value: popUpAppender })
    Object.defineProperty(Vue.prototype, '$log4javascript', { value: log4javascript })
    Vue.mixin({
      computed: {
        $logger () { return getLogger(this.module) }
      }
    })
  }
}

export { plugin as default, getLogger }
