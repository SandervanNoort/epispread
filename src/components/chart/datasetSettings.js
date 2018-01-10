import { addConfig } from 'src/storeTools'
import store from 'src/store'

let settings = {
  label: {
    type: 'text',
    $id: 1
  },
  input: {
    type: 'text',
    $id: 2,
    options: ['source', 'data'],
    default: 'source'
  },
  source: {
    show (get) { return get('input') === 'source' },
    followMap: {
      type: 'bool',
      default: false
    }
  },
  active: {
    type: 'bool',
    default: true,
    hidden: true
  },
  labels: {
    show (get) { return get('input') === 'data' },
    labels: {
      $add: true
    }
  },
  rawData: {
    show (get) { return get('input') === 'data' },
    $add: true,
    features: {
      type: 'array',
      hidden: true
    },
    geojson: {
      type: 'object',
      hidden: true
    },
    xType: {
      type: 'text',
      options: ['', 'date', 'number'],
      default: ''
    },
    barWidth: {
      type: 'int',
      allowed: ['year', 'month', 'week'],
      default: '1'
    },
    x: {
      type: 'array'
    },
    y: {
      type: 'array'
    },
    extra: {
      $add: true
    },
    dataType: {
      type: 'text',
      options: ['timeseries', 'geo', 'rect'],
      default: 'timeseries'
    }
  },
  global: {
    hidden: true,
    legend: {
      min: {
        type: 'float'
      },
      max: {
        type: 'float'
      },
      log: {
        type: 'bool'
      }
    }
  },
  appearance: {
    show (get) { return get('rawData/dataType') === 'timeseries' },
    $add: true,
    shape: {
      type: 'text',
      options: ['epi-line', 'epi-bar'],
      default: 'epi-line',
      show (get) { return get('../rawData/dataType') === 'timeseries' }
    },
    dotSize: {
      type: 'int',
      default: 3,
      show (get) {
        return get('../rawData/dataType') === 'timeseries' &&
               get('shape') === 'epi-line'
      }
    },
    strokeWidth: {
      type: 'int',
      default: 2,
      show (get) {
        return get('../rawData/dataType') === 'timeseries' &&
               get('shape') === 'epi-line'
      }
    },
    color: {
      type: 'color',
      default: 'auto',
      show (get) { return get('../rawData/dataType') === 'timeseries' }
    }
  },
  _status: {
    hoverIndex: {type: 'int'},
    xDomain: {type: 'array'},
    yDomain: {type: 'array'},
    xMin: {type: 'array'},
    bounds: {type: 'array'}
  }
}

addConfig(
  store,
  ['charts', 'multiple', 'datasets'],
  {multiple: settings, $prefix: 'dataset'})
addConfig(
  store,
  ['geos', 'multiple', 'datasets'],
  {multiple: settings, $prefix: 'dataset'})
