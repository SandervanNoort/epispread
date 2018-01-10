<template>
<div>
  <h4>Set date</h4>
  <q-btn @click.stop="nextDate(-1)" icon='skip_previous' />
  <q-btn @click.stop="nextDate(1)" icon='skip_next' />
  <q-btn v-if="playTimer" @click.stop="stop" icon='stop' />
  <q-btn v-else icon='play_arrow'>
    <q-popover ref='p'>
      <q-field label='Play delay'>
        <select v-model="delay">
          <option v-for="delay in delayOptions" :value="delay.value">
            {{delay.label}}
          </option>
        </select  >
        <!-- <q-select :options="delayOptions" v-model="delay"></q-select> -->
      </q-field>
      <q-btn @click.stop="playButton">Play</q-btn>
    </q-popover>
  </q-btn>
  <q-select v-if="dateOptions" :options="dateOptions" v-model="date" />
</div>
</template>

<script>
import { addComputed } from 'src/storeTools'
import { QBtn, QField, QSelect, QPopover, QModal } from 'quasar'

export default {
  name: 'geo-play',
  components: { QBtn, QField, QSelect, QPopover, QModal },
  inject: ['layout'],
  computed: {
    ...addComputed({
      datasets: 'datasets',
      date: 'date',
      delay: 'appearance/playDelay',
      playTimer: '_status/playTimer'
    }),
    module () { return this.$vget('/_status/actionValues/module') },
    dateOptions () {
      let config = this.$config('date')
      if (config && config.selectOptions) {
        return config.selectOptions
      }
    },
    delayOptions () {
      return this.$config('appearance', 'playDelay').options.map((delay) => ({
        label: `${delay} seconds`,
        value: delay})
      )
    },
    datasetList () {
      return Object.keys(this.datasets)
        .sort((key1, key2) => {
          return this.datasets[key1].id > this.datasets[key2].id
        })
        .filter((key) => this.datasets[key].active)
    }
  },
  methods: {
    nextDate (step) {
      this.$logger.debug('nextDate')
      this.$vnext('date', step)
    },
    stop () {
      clearTimeout(this.playTimer)
      this.playTimer = null
    },
    playButton () {
      this.$refs.p.close(() => {
        this.layout.hideRightSmall(this.play)
      })
    },
    play () {
      this.playTimer = setTimeout(
        () => {
          this.$logger.debug('set next date')
          this.$vnext('date', 1)
          this.$nextTick(this.play)
        },
        this.delay * 1000)
    }
  }
}
</script>

<style>
</style>
