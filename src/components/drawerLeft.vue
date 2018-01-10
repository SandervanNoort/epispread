<template>
<div style='width: 100%; height: 100%'>
  <q-resize-observable @resize="totalResize" />
  <div style='display: flex' ref='header'>
    <q-resize-observable @resize="headerResize" />
    <q-btn style='flex-grow: 1; display: block' class='full-width'>
      <q-icon name='keyboard_arrow_left' v-if="links.length > 1" />
      {{links[0].label}}
      <q-popover v-if="links.length > 1"
          ref='leftMenuSelect'
          anchor='bottom right'
          self='top right'
          :fit="true" >
        <q-list link highlight>
          <q-item v-for="link, index in links.slice(1)" :key="index"
              @click="$refs.leftMenuSelect.close(() => {
                leftMenu = link.leftMenu
              })" >
            {{link.label}}
          </q-item>
        </q-list>
      </q-popover>
    </q-btn>
    <div>
      <q-btn>
        <q-icon name='more_vert' />
        <q-popover ref='popover'>
          <q-list link highlight>
            <q-item  @mousedown="resize" @touchdown="resize">Resize</q-item>
            <q-item @click="autoHide()">Auto hide</q-item>
            <q-item @click="fixedLayout()">Fix</q-item>
          </q-list>
        </q-popover>
      </q-btn>
    </div>
  </div>
  <q-scroll-area ref='scroll'
      :style="{
        height: (totalHeight - headerHeight) + 'px',
        width: '100%'
      }"
      :class="containerClass" >
    <p class='padded'>
      <var-list :keys="[]" />
    </p>
    <div v-if="$q.platform.is.mobile" style='height: 300px' />
  </q-scroll-area>
</div>
</template>

<script>
import { QScrollArea, QListHeader, QBtn, QIcon, QPopover, QItem, QList,
  QResizeObservable } from 'quasar'
import { addComputed, addWatch } from 'src/storeTools'
import varList from './varList'
import resizeButton from './resizeButton'
import getXY from 'src/tools/xy'
import Vue from 'vue'
import _ from 'lodash'

var defaultProps = {
  hex: '#194d33',
  a: 0.5
}

export default {
  name: 'drawer-left',
  inject: ['layout'],
  data () {
    return {
      colors: defaultProps,
      headerHeight: 50,
      totalHeight: 500
    }
  },
  computed: {
    ...addComputed({
      leftMenu: '/_status/leftMenu',
      gap: '/global/drawer/gap',
      windowWidth: '/_status/width',
      breakpoint: '/global/drawer/left/breakpoint',
      width: '/global/drawer/left/width',
      containerSM: '/global/layout/containerSM'
    }),
    links () {
      let leftMenu = this.leftMenu
      let links = []
      while (leftMenu !== '/') {
        let label = this.$vget(leftMenu, 'label') || this.$vkey(leftMenu)
        links.push({label: label, leftMenu: leftMenu})
        leftMenu = this.$vmod(leftMenu, '..')
      }
      links.push({label: 'Home', leftMenu: leftMenu})
      return links
    },
    maxWidth () {
      if (this.windowWidth > 0) {
        return this.windowWidth - this.gap
      }
    },
    correctedWidth () {
      if (this.maxWidth) {
        return Math.min(this.maxWidth, this.width)
      }
      return this.width
    },
    leftWidth () {
      if (this.layout.leftOverBreakpoint && this.layout.leftState.openedBig) {
        return this.correctedWidth
      }
      return 0
    },
    label () {
      if (this.leftMenu.length === 0) {
        return ''
      }
      return '&rarr;' + this.leftMenu.join('&rarr;')
    },
    containerClass () {
      return 'container' + (this.width >= this.containerSM ? 'SM' : 'XS')
    }
  },
  methods: {
    autoHide () {
      this.$refs.popover.close()
      this.breakpoint = 9999
      this.layout.hideLeft(() => {
        this.$nextTick(() => {
          this.layout.showLeft()
        })
      })
    },
    fixedLayout () {
      this.$refs.popover.close()
      this.breakpoint = 800
      this.layout.hideLeft(() => {
        this.$nextTick(() => {
          this.layout.showLeft()
        })
      })
    },
    totalResize (size) {
      this.totalHeight = size.height
    },
    headerResize (size) {
      this.headerHeight = size.height
    },
    resizeButton (resize) {
      this.width += resize.x
    },
    resize (event) {
      // this.$refs.popover.close()
      event.preventDefault()
      event.stopPropagation()
      this.start = getXY(event)
      this.origStart = getXY(event)
      document.documentElement.addEventListener('mousemove', this.handleMove, true)
      document.documentElement.addEventListener('touchmove', this.handleMove, true)
      document.documentElement.addEventListener('mouseup', this.handleUp, true)
      document.documentElement.addEventListener('touchend', this.handleUp, true)
    },
    handleMove (event) {
      event.preventDefault()
      event.stopPropagation()
      let end = getXY(event)
      let xDiff = end.x - this.start.x
      this.width += xDiff
      this.$refs.popover.$el.style.left = parseInt(
        this.$refs.popover.$el.style.left, 10) + xDiff + 'px'
      this.start = end
    },
    handleUp (event) {
      event.preventDefault()
      event.stopPropagation()
      document.documentElement.removeEventListener('mousemove', this.handleMove, true)
      document.documentElement.removeEventListener('touchmove', this.handleMove, true)
      document.documentElement.removeEventListener('mouseup', this.handleUp, true)
      document.documentElement.removeEventListener('touchend', this.handleUp, true)
      this.$refs.popover.close()
      if (Math.abs(this.start.x - this.origStart.x) < 5) {
        alert('please drag')
      }
    }
  },
  watch: {
    ...addWatch(['leftWidth']),
    correctedWidth: {
      immediate: true,
      handler (width) {
        document.documentElement.style.setProperty(
          '--aside-left-width',
          width)
      }
    },
    leftMenu () {
      this.layout.showLeft()
      if (this.$refs.scroll) {
        this.$refs.scroll.setScrollPosition(0)
      }
      Vue.nextTick(() => {
        if (this.$refs.header) {
          this.headerHeight = this.$refs.header.clientHeight
        }
      })
    }
  },
  components: {
    QScrollArea,
    QListHeader,
    varList,
    resizeButton,
    QBtn,
    QItem,
    QList,
    QIcon,
    QPopover,
    QResizeObservable
  }
}
</script>
