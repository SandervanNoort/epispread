<template>
<div
    :style="{
      width: legendWidth + 'px',
      padding: '5px 5px 5px 5px',
      backgroundColor: backgroundColor
    }">
  <div
      :style="{
        textAlign: 'right',
        height: (_status.topMargin - 5) + 'px'
      }">
    <q-btn small
      :style="{
        margin: '0px',
        backgroundColor: axColor,
        height: '3px'
      }">
    <q-icon name='more_horiz' />
      <q-popover ref='popover'>
        <q-list link highlight>
          <q-item
               style='white-space: nowrap'
               @mousedown="resize"
               @touchdown="resize">
             Resize legend
          </q-item>
          <q-item>Add dataset
            <q-popover ref='popoverCreate'>
              <div class='padded'>
                <p class='caption'>
                  Add new dataset
                </p>
                <div>
                  <q-btn
                      style='display: block'
                      @click="$refs.popoverCreate.close(), addDataset()">
                    Empty
                  </q-btn>
                  <q-btn v-for="dataset in _status.datasetList" :key="dataset"
                    :style="{
                      display: 'block',
                      backgroundColor: color(dataset),
                      color: axColor,
                      margin: '3px'
                    }"
                    @click="$refs.popoverCreate.close(), addDataset(dataset)"
                    v-text="'Copy of ' + label(dataset)" />
                  <q-btn @click="$refs.popoverCreate.close()">
                    Cancel
                  </q-btn>
                </div>
              </div>
            </q-popover>
          </q-item>
        </q-list>
      </q-popover>
    </q-btn>
  </div>
  <div style='textAlign: center'>
    <q-chip v-for="dataset in _status.datasetList" :key="dataset"
        class='full-width'
        :style="{
          textAlign: 'center',
          margin: '3px 0px',
          backgroundColor: color(dataset),
          color: axColor
        }"
        @click.stop="leftMenu = $vmod(chart, 'datasets', dataset); layout.showLeft()">
      {{ label(dataset) }}
    </q-chip>
  </div>
</div>
</template>

<script>
import { QList, QItem, QItemMain, QItemTile, QListHeader, QChip, QBtn,
  QIcon, QPopover } from 'quasar'
import { addComputed } from 'src/storeTools'
import _ from 'lodash'
import getXY from 'src/tools/xy'

export default {
  name: 'chart-legend',
  props: ['chart'],
  data   () {
    return {
      chip: true,
      list: false
    }
  },
  components: {
    QList,
    QItem,
    QItemMain,
    QItemTile,
    QListHeader,
    QChip,
    QBtn,
    QIcon,
    QPopover
  },
  inject: ['layout'],
  computed: {
    ...addComputed({
      leftMenu: '/_status/leftMenu',
      legendWidth: 'appearance/legendWidth',
      axColor: 'appearance/axColor',
      backgroundColor: 'appearance/backgroundColor',
      datasets: 'datasets',
      _status: '_status'
    }),
    module () { return this.chart }
  },
  methods: {
    color (datasetKey) {
      return this.$vget(this.chart, `datasets/${datasetKey}/appearance/color`)
    },
    resize (event) {
      // this.$refs.popover.close()
      event.preventDefault()
      event.stopPropagation()
      this.start = getXY(event)
      this.origStart = getXY(event)
      let doc = document.documentElement
      doc.addEventListener('mousemove', this.handleMove, true)
      doc.addEventListener('touchmove', this.handleMove, true)
      doc.addEventListener('mouseup', this.handleUp, true)
      doc.addEventListener('touchend', this.handleUp, true)
    },
    handleMove (event) {
      event.preventDefault()
      event.stopPropagation()
      let end = getXY(event)
      let xDiff = end.x - this.start.x
      this.legendWidth -= xDiff
      this.start = end
    },
    handleUp (event) {
      event.preventDefault()
      event.stopPropagation()
      let doc = document.documentElement
      doc.removeEventListener('mousemove', this.handleMove, true)
      doc.removeEventListener('touchmove', this.handleMove, true)
      doc.removeEventListener('mouseup', this.handleUp, true)
      doc.removeEventListener('touchend', this.handleUp, true)
      if (Math.abs(this.start.x - this.origStart.x) < 5) {
        alert('please drag')
      }
    },
    label (datasetKey) {
      return this.$vget(this.chart, `datasets/${datasetKey}/label`)
    },
    addDataset (datasetKey) {
      let orig = {}
      if (datasetKey) {
        orig = _.cloneDeep(this.$vget(this.chart, 'datasets', datasetKey))
        orig.appearance.color = 'auto'
      }
      this.$vcreate(this.chart, 'datasets', '_default', orig)
        .then((val) => {
          this.leftMenu = val
          this.layout.showLeft()
        })
    }
  }
}
</script>
