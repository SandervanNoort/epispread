<template>
  <g :clip-path="clipURL">
  <path :style="lineStyle" :d="line" />
  <path :d="lineFuture" :style="lineStyleFuture" />
  <circle v-for="(dot, index) in dots"
    :cx="dot.xpix"
    :cy="dot.ypix"
    :r="index < splitIndex ? circleStyle.dotSize : circleStyleFuture.dotSize"
    :style="index < splitIndex ? circleStyle : circleStyleFuture" />
  <circle v-if="hoverIndex >= 0"
    :cx="dots[hoverIndex].xpix"
    :cy="dots[hoverIndex].ypix"
    :r="circleStyleHover.dotSize"
    :style="circleStyleHover" />
  </g>
</template>

<script>
import { line } from 'd3-shape'
import { extent, min, max } from 'd3-array'
import xyMixin from './xyMixin'
import { addWatch, addComputed } from 'src/storeTools'
import getTimeseries from './getTimeseries'

export default {
  name: 'epi-line',
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
      axColor: 'this.chart/appearance/axColor',
      rawData: 'rawData',
      appearance: 'appearance',
      leftLabel: 'this.chart/_status/leftLabel',
      rightLabel: 'this.chart/_status/rightLabel',
      xyHover: 'this.chart/_status/xyHover',
      xHover: 'this.chart/_status/xHover',
      clipURL: 'this.chart/_status/clipURL'
    }),
    module () { return this.dataset },
    chart () { return this.$vmod(this.dataset, '../..') },
    xMin () {
      if (!this.xyHover) {
        return
      }
      let [xpix, ypix] = this.xyHover
      let minDis = null
      let xMin = null
      for (let dot of this.dots) {
        let xDis = Math.abs(dot.xpix - xpix)
        let xyDis = (dot.xpix - xpix) ** 2 + (dot.ypix - ypix) ** 2
        let dis = Math.min(xDis, xyDis - 25)
        // let dis = xDis
        if (dis < minDis || minDis === null) {
          minDis = dis
          xMin = dot.xpix
        }
      }
      return [xMin, minDis]
    },
    hoverIndex () {
      let xpix = this.xHover
      for (let [index, dot] of this.dots.entries()) {
        if (dot.xpix === xpix) {
          return index
        }
      }
      return -1
    },
    dots () {
      return this.timeseries.map((row) => {
        return {xpix: this.getX(row), ypix: this.getY(row)}
      })
    },
    circleStyle () {
      let style = {}
      for (let [key, value] of Object.entries(this.appearance)) {
        if (key === 'color') {
          style.fill = value
        }
        else {
          style[key] = value
        }
      }
      return style
    },
    circleStyleFuture () {
      let style = {...this.circleStyle}
      style['opacity'] = '0.2'
      return style
    },
    circleStyleHover () {
      let style = {...this.circleStyle}
      style.stroke = this.axColor
      style['stroke-width'] = 3
      style.dotSize = parseInt(Math.max(5, 3 * style.dotSize), 10)
      return style
    },
    lineStyle () {
      let cStyle = {}
      for (let [key, value] of Object.entries(this.appearance)) {
        if (key === 'color') {
          cStyle.stroke = value
        }
        else {
          cStyle[key] = value
        }
      }
      return cStyle
    },
    lineStyleFuture () {
      let style = {...this.lineStyle}
      style['opacity'] = '0.3'
      return style
    },
    line () {
      let series = this.timeseries.slice(0, this.splitIndex)
      return line()
        .x(row => this.getX(row))
        .y(row => this.getY(row))(series)
    },
    lineFuture () {
      return line()
        .x(row => this.getX(row))
        .y(row => this.getY(row))(this.timeseries.slice(Math.max(0, this.splitIndex - 1)))
    },
    splitIndex () {
      if (this.xHover === null) {
        return this.dots.length
      }
      for (let [index, dot] of this.dots.entries()) {
        if (dot.xpix > this.xHover) {
          return index
        }
      }
      return this.dots.length
    },
    timeseries () {
      return getTimeseries(this.rawData)
    },
    xDomain () {
      return extent(this.timeseries, row => row.xval)
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
        return [
          min(show, row => row.yval),
          max(show, row => row.yval)
        ]
      }
    }
  },
  watch: {
    ...addWatch(['xDomain', 'yDomain', 'xMin', 'hoverIndex'])
  }
}
</script>
