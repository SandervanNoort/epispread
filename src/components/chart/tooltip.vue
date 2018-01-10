<template>
<q-tooltip
    :xyHover="xyHover"
    :delay="0"
    ref='tooltip'
    :xgap="xgap"
    :ygap="ygap"
    :style="{display: display}"
    @mouse="$emit('mouse', $event)">
  <table class='chartTable'>
    <caption>{{caption}}</caption>
    <tr v-for="row in rows">
      <th>
        <template v-if="row[0]">{{row[0]}}:</template>
      </th>
      <td>
        <div v-for="value in row[1]" v-text="value" />
      </td>
    </tr>
  </table>
</q-tooltip>
</template>

<script>
import QTooltip from '@/tooltip/QTooltip'
import getDatelabel from 'src/tools/getDatelabel'
import getFormat from 'src/tools/getFormat'
import numberFormat from 'src/tools/numberFormat'
import { addComputed } from 'src/storeTools'

export default {
  name: 'tooltip',
  props: ['module', 'hoverKey'],
  components: { QTooltip },
  computed: {
    ...addComputed({
      xgap: '/global/tooltip/xgap',
      ygap: '/global/tooltip/ygap',
      xyHover: '_status/xyHover',
      datasetList: '_status/datasetList'
    }),
    display () { return this.rows.length > 0 ? 'block' : 'none' },
    captionRows () {
      let caption
      let rows = []
      for (let datasetKey of this.datasetList) {
        let hoverIndex = this.$vget('datasets', datasetKey, '_status', 'hoverIndex')
        let xvals = this.$vget('datasets', datasetKey, 'rawData', 'x')
        if (xvals && this.hoverKey) {
          hoverIndex = xvals.indexOf(this.hoverKey)
        }
        if (!Number.isFinite(hoverIndex) || hoverIndex === -1) {
          continue
        }
        let yFormat = this.$vget('datasets', datasetKey, 'labels', 'yFormat')
        let unit = this.$vget('datasets', datasetKey, 'labels', 'unit')
        let yLabel = this.$vget('datasets', datasetKey, 'labels', 'yLabel')
        let label = this.$vget('datasets', datasetKey, 'label')
        let locations = this.$vget('datasets', datasetKey, 'global', 'locations')
        let extras = this.$vget('datasets', datasetKey, 'rawData', 'extra', 'vars') || []
        let yvals = this.$vget('datasets', datasetKey, 'rawData', 'y')
        let [factor, func] = getFormat(yFormat)
        if (caption === undefined) {
          let xval = xvals[hoverIndex]
          if (locations) {
            caption = locations[xval]
          }
          else {
            caption = getDatelabel(xval)
          }
        }
        let value = yvals[hoverIndex]
        let values = []
        if (value !== '') {
          if (typeof func === 'function') {
            value = func(value)
          }
          value = numberFormat(value)
          values.push(`${value} ${unit} ${factor}`)
        }
        else {
          values.push(`No data on ${yLabel}`)
        }
        for (let key of extras) {
          let value = this.$vget('datasets', datasetKey, 'rawData', 'extra', key)[hoverIndex]
          if (value === '') {
            continue
          }
          let text = numberFormat(value)
          let unit = this.$vget('datasets', datasetKey, 'rawData', 'extra', key + 'Unit')
          if (unit) {
            text += ' ' + unit
          }
          values.push(text)
        }
        rows.push([label, values])
      }
      return [caption, rows]
    },
    rows () {
      return this.captionRows[1]
    },
    caption () {
      return this.captionRows[0]
    }
  },
  methods: {
    setPosition () {
      this.$refs.tooltip.setPosition()
    }
  }
}
</script>

<style>
.chartTable caption {
  font-weight: bold;
  margin-bottom: 0.5em;
  font-size: 150%;
  text-align: left;
  text-decoration: underline;
  white-space: nowrap;
}
.chartTable th {
  vertical-align: top;
  text-align: left;
}

</style>
