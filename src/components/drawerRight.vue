<template>
<q-scroll-area style="width: 100%; height: 99%">
  <component :is="action" />
  <q-list highlight link>
    <q-item @click="click($q.events.$emit('resetZoom'))">
      Reset zoom
    </q-item>
    <q-item @click="click(fullscreen())">
      {{ fullscreenText }}
    </q-item>
    <q-item @click="$popUpAppender.show">
      Debug
    </q-item>
  </q-list>
</q-scroll-area>
</template>

<script>
import { QScrollArea, QListHeader, QItem, QList, AppFullscreen, QSideLink, QItemSide, QItemMain } from 'quasar'
import { addComputed, addWatch } from 'src/storeTools'
import geoPlay from '@/chart/geoPlay'

// let ACTIONS = ['geo-play']

export default {
  name: 'drawer-right',
  components: {
    QScrollArea,
    QListHeader,
    QItem,
    QList,
    QSideLink,
    QItemSide,
    QItemMain,
    geoPlay
  },
  inject: ['layout'],
  computed: {
    ...addComputed({
      gap: '/global/drawer/gap',
      windowWidth: '/_status/width',
      breakpoint: '/global/drawer/right/breakpoint',
      width: '/global/drawer/right/width',
      containerSM: '/global/layout/containerSM',
      action: '/_status/action'
    }),
    fullscreenText () {
      return (AppFullscreen.isActive() ? 'Exit ' : ' ') + 'Fullscreen'
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
    rightWidth () {
      if (this.layout.rightOverBreakpoint && this.layout.rightState.openedBig) {
        return this.correctedWidth
      }
      return 0
    }
  },
  watch: {
    ...addWatch(['rightWidth']),
    correctedWidth: {
      immediate: true,
      handler (width) {
        document.documentElement.style.setProperty(
          '--aside-right-width',
          width)
      }
    }
  },
  methods: {
    fullscreen () { AppFullscreen.toggle() },
    click (func) {
      this.layout.hideCurrentSide(func)
    }
  }
}
</script>
