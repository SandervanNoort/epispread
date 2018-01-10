<template>
  <span class="q-tooltip animate-scale" :style="transformCSS">
    <slot></slot>
  </span>
</template>

<script>
import { debounce, Platform, scroll } from 'quasar'
const { getScrollTarget } = scroll
import { positionValidator,
  offsetValidator,
  parsePosition,
  getTransformProperties,
  setPosition } from './utils/popup'

export default {
  name: 'q-tooltip',
  props: {
    anchor: {
      type: String,
      default: 'top middle',
      validator: positionValidator
    },
    self: {
      type: String,
      default: 'bottom middle',
      validator: positionValidator
    },
    offset: {
      type: Array,
      validator: offsetValidator
    },
    delay: {
      type: Number,
      default: 0
    },
    maxHeight: String,
    disable: Boolean,
    xgap: Number,
    ygap: Number,
    xyHover: Array
  },
  data () {
    return {
      opened: false
    }
  },
  computed: {
    anchorOrigin () {
      return parsePosition(this.anchor)
    },
    selfOrigin () {
      return parsePosition(this.self)
    },
    transformCSS () {
      return getTransformProperties({
        selfOrigin: this.selfOrigin
      })
    }
  },
  methods: {
    toggle () {
      if (this.opened) {
        this.close()
      }
      else {
        this.open()
      }
    },
    open (event) {
      if (this.disable) {
        return
      }
      clearTimeout(this.timer)
      this.opened = true
      document.body.appendChild(this.$el)
      this.scrollTarget = getScrollTarget(this.anchorEl)
      this.scrollTarget.addEventListener('scroll', this.close)
      window.addEventListener('resize', this.__debouncedUpdatePosition)
      if (Platform.is.mobile) {
        document.body.addEventListener('click', this.close, true)
      }
      this.__updatePosition(event)
    },
    close (event) {
      if (event) {
        event.stopPropagation()
      }
      clearTimeout(this.timer)
      this.$emit('mouse', null)
      if (this.opened) {
        this.opened = false
        this.scrollTarget.removeEventListener('scroll', this.close)
        window.removeEventListener('resize', this.__debouncedUpdatePosition)
        document.body.removeChild(this.$el)
        if (Platform.is.mobile) {
          document.body.removeEventListener('click', this.close, true)
        }
      }
    },
    dynamicPosition (event) {
      if (!event) {
        return
      }
      this.$emit('mouse', event)

      this.xpixClient = event.clientX
      this.ypixClient = event.clientY
      this.setPosition()
    },
    setPosition () {
      this.$nextTick(this.setPosition2)
    },
    setPosition2 () {
      let left = this.xpixClient + this.xgap
      if (left + this.$el.offsetWidth > window.innerWidth) {
        left = Math.max(0, this.xpixClient - this.xgap - this.$el.offsetWidth)
      }
      let top = this.ypixClient + this.ygap
      if (top + this.$el.offsetHeight > window.innerHeight) {
        top = Math.max(0, this.ypixClient - this.ygap - this.$el.offsetHeight)
      }
      this.$el.style.left = left + 'px'
      this.$el.style.top = top + 'px'
    },
    __updatePosition (event) {
      if (this.xgap !== undefined && this.ygap !== undefined) {
        this.dynamicPosition(event)
        return
      }
      setPosition({
        el: this.$el,
        offset: this.offset,
        anchorEl: this.anchorEl,
        anchorOrigin: this.anchorOrigin,
        selfOrigin: this.selfOrigin,
        maxHeight: this.maxHeight
      })
    },
    __delayOpen () {
      clearTimeout(this.timer)
      this.timer = setTimeout(this.open, this.delay)
    }
  },
  created () {
    this.__debouncedUpdatePosition = debounce(() => {
      this.__updatePosition()
    }, 70)
  },
  mounted () {
    this.$nextTick(() => {
      /*
        The following is intentional.
        Fixes a bug in Chrome regarding offsetHeight by requiring browser
        to calculate this before removing from DOM and using it for first time.
      */
      this.$el.offsetHeight // eslint-disable-line

      this.anchorEl = this.$el.parentNode
      this.anchorEl.removeChild(this.$el)
      if (this.anchorEl.classList.contains('q-btn-inner')) {
        this.anchorEl = this.anchorEl.parentNode
      }
      if (Platform.is.mobile) {
        this.anchorEl.addEventListener('click', this.open)
      }
      else {
        this.anchorEl.addEventListener('mouseenter', this.__delayOpen)
        // this.anchorEl.addEventListener('focus', this.__delayOpen)
        this.anchorEl.addEventListener('mouseleave', this.close)
        // this.anchorEl.addEventListener('blur', this.close)
        this.anchorEl.addEventListener('mousemove', this.__updatePosition)
      }
    })
  },
  beforeDestroy () {
    if (Platform.is.mobile) {
      this.anchorEl.removeEventListener('click', this.open)
    }
    else {
      this.anchorEl.removeEventListener('mouseenter', this.__delayOpen)
      this.anchorEl.removeEventListener('focus', this.__delayOpen)
      this.anchorEl.removeEventListener('mouseleave', this.close)
      this.anchorEl.removeEventListener('blur', this.close)
      this.anchorEl.removeEventListener('mousemove', this.__updatePosition)
    }
    this.close()
  }
}
</script>
