<template>
<g :clip-path="clipURL">
<rect v-for="(rect, index) in rectPoints"
  :x="rect.xpix"
  :y="rect.ypix"
  :height="rect.height"
  :width="rect.width"
  :style="index < splitIndex ? barStyle : barStyleFuture" />
<rect v-if="hoverIndex >= 0"
  :x="rectPoints[hoverIndex].xpix"
  :y="rectPoints[hoverIndex].ypix"
  :height="rectPoints[hoverIndex].height"
  :width="rectPoints[hoverIndex].width"
  :style="barStyleHover" />
</g>
</template>

<script>
import { addWatch, addComputed } from 'src/storeTools'
import getTimeseries from './getTimeseries'
import xyMixin from './xyMixin'
import { min, max } from 'd3-array'

export default {
  name: 'epi-bar',
  mixins: [xyMixin],
  props: ['dataset'],
  data () {
    return {
      isTimeseries: true
    }
  },
  computed: {
    ...addComputed({
      scales: 'this.chart/scales',
      label: 'label',
      rawData: 'rawData',
      barWidth: 'rawData/barWidth',
      appearance: 'appearance',
      leftLabel: 'this.chart/_status/leftLabel',
      rightLabel: 'this.chart/_status/rightLabel',
      hatch: 'this.chart/_status/hatch',
      xyHover: 'this.chart/_status/xyHover',
      xHover: 'this.chart/_status/xHover',
      clipURL: 'this.chart/_status/clipURL'
    }),
    module () { return this.dataset },
    chart () { return this.$vmod(this.dataset, '../..') },
    timeseries () {
      return getTimeseries(this.rawData)
    },
    barseries () {
      let barseries = this.timeseries.map((row) => ({
        ...row,
        xleft: this.borderLeft(row),
        xright: this.borderRight(row)
      }))
      return barseries
    },
    rectPoints () {
      return this.barseries.map((row) => this.getRect(row))
    },
    barStyle () {
      let barStyle = {}
      for (let [key, value] of Object.entries(this.appearance)) {
        if (key === 'color') {
          barStyle.fill = value
        }
        else {
          barStyle[key] = value
        }
      }
      return barStyle
    },
    barStyleFuture () {
      let style = {...this.barStyle}
      style['opacity'] = '0.2'
      return style
    },
    barStyleHover () {
      let style = {...this.barStyle}
      style.fill = `url(#${this.hatch})`
      style.stroke = 'black'
      return style
    },
    xDomain () {
      return [
        min(this.barseries, row => row.xleft),
        max(this.barseries, row => row.xright)
      ]
    },
    yDomain () {
      if (!this.showDomain) {
        return
      }
      let show = this.timeseries.filter(
        (row) => (row.xval >= this.showDomain[0] &&
           row.xval <= this.showDomain[1])
      )
      if (show.length > 0) {
        return [0, max(show, row => row.yval)]
      }
    },
    xMin () {
      if (this.xyHover === null) {
        return
      }
      let minDis = null
      let xMin
      let [xpix, ypix] = this.xyHover
      for (let [_index, rect] of this.rectPoints.entries()) {
        let dis = [
          rect.xpix - xpix,
          xpix - (rect.xpix + rect.width)
        ].find((val) => val > 0) || 0

        if (!this.isTimeseries) {
          let yDis = [
            rect.ypix - ypix,
            ypix - (rect.ypix + rect.height)
          ].find((val) => val > 0) || 0
          dis = dis ** 2 + yDis ** 2
        }

        if (dis < minDis || minDis === null) {
          minDis = dis
          xMin = rect.xdot
        }
      }
      return [xMin, minDis]
    },
    splitIndex () {
      if (this.xHover === null) {
        return this.rectPoints.length
      }
      for (let [index, rect] of this.rectPoints.entries()) {
        if (rect.xdot > this.xHover) {
          return index
        }
      }
      return this.rectPoints.length
    },
    hoverIndex () {
      let xpix = this.xHover
      for (let [index, rect] of this.rectPoints.entries()) {
        if (rect.xdot === xpix) {
          return index
        }
      }
      return -1
    }
  },
  methods: {
    getRect (row) {
      let xpix1 = this.getX({xval: row.xleft})
      let xpix2 = this.getX({xval: row.xright})
      let ypix1 = this.getY({yval: 0})
      let ypix2 = this.getY(row)
      return {
        xpix: xpix1,
        ypix: ypix2,
        xdot: this.getX(row),
        height: ypix1 - ypix2,
        width: xpix2 - xpix1
      }
    },
    borderRight (row) {
      if (row.date) {
        if (this.barWidth === 'month') {
          let date = new Date(row.xval)
          return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
        }
        else if (this.barWidth === 'year') {
          let date = new Date(row.xval)
          return Date.UTC(date.getUTCFullYear() + 1, 0, 0)
        }
        else if (this.barWidth === 'week') {
          let date = new Date(row.xval)
          let day = date.getUTCDay() // sun = 0
          return date.setDate(date.getDate() + ((7 - day) % 7))
        }
        return row.xval + (this.barWidth / 2) * 1000 * 60 * 60 * 24
      }
      return row.xval + 0.4
    },
    borderLeft (row) {
      if (row.date) {
        if (this.barWidth === 'month') {
          let date = new Date(row.xval)
          return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
        }
        else if (this.barWidth === 'year') {
          let date = new Date(row.xval)
          return Date.UTC(date.getUTCFullYear(), 0, 1)
        }
        else if (this.barWidth === 'week') {
          let date = new Date(row.xval)
          let day = date.getUTCDay() // sun = 0
          return date.setDate(date.getDate() - ((day + 6) % 7))
        }
        return row.xval - (this.barWidth / 2) * 1000 * 60 * 60 * 24
      }
      return row.xval - 0.4
    }
  },
  watch: {
    ...addWatch(['xDomain', 'yDomain', 'xMin', 'hoverIndex'])
  }
}
</script>
