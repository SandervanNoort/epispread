<template>
  <q-layout
    ref="layout"
    :view="view"
    :left-breakpoint="leftBreakpoint"
    :right-breakpoint="rightBreakpoint"
    @resize="resize"
    id='q-app'
  >
    <header-bar ref='header' slot='header' />
    <drawer-left slot='left' />
    <drawer-right slot='right' />
    <main-div v-if="mainWidth > 0" :height="mainHeight" :width="mainWidth" />
    <footer-bar v-if="footer" slot='footer' ref='footer' />
  </q-layout>
</template>

<script>
import HeaderBar from '@/headerBar'
import FooterBar from '@/footerBar'
import drawerLeft from '@/drawerLeft'
import drawerRight from '@/drawerRight'
import mainDiv from '@/mainDiv'
import { QLayout, QResizeObservable } from 'quasar'
import { addComputed } from 'src/storeTools'

export default {
  name: 'Layout',
  components: {
    HeaderBar,
    FooterBar,
    mainDiv,
    drawerLeft,
    drawerRight,
    QLayout,
    QResizeObservable
  },
  computed: {
    ...addComputed({
      leftBreakpoint: '/global/drawer/left/breakpoint',
      rightBreakpoint: '/global/drawer/right/breakpoint',
      view: '/global/layout/view',
      footer: '/global/layout/footer',
      height: '_status/height',
      width: '_status/width',
      leftWidth: '_status/leftWidth',
      rightWidth: '_status/rightWidth',
      footerHeight: '_status/footerHeight',
      headerHeight: '_status/headerHeight'
    }),
    mainHeight () {
      return this.height - this.footerHeight - this.headerHeight
    },
    mainWidth () {
      return this.width - this.leftWidth - this.rightWidth
    }
  },
  methods: {
    resize (size) {
      this.width = size.width
      this.height = size.height
    }
  },
  mounted () {
    window.app = this
    this.$refs.layout.hideRightSmall = (func) => {
      if (this.$refs.layout.rightState.openedSmall) {
        this.$refs.layout.hideRight(func)
      }
      else {
        func()
      }
    }
  }
}
</script>

<style>
body, html {
  overflow-x: hidden;
  overflow-y: hidden;
}

:root {
  --aside-left-width: 200;
  --aside-right-width: 100;
}

.layout-aside-left {
  max-width: calc(var(--aside-left-width) * 1px);
  width: calc(var(--aside-left-width) * 1px);
}

.layout-aside-right {
  max-width: calc(var(--aside-right-width) * 1px);
  width: calc(var(--aside-right-width) * 1px);
}
</style>
