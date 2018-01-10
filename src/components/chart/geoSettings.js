import { addConfig } from 'src/storeTools'
import store from 'src/store'

let settings = {
  label: {
    type: 'text',
    $id: 1
  },
  date: {
    type: 'text',
    $id: 2
  },
  autoZoom: {
    type: 'bool',
    default: true,
    $id: 3
  },
  appearance: {
    playDelay: {
      type: 'float',
      default: 1,
      options: [0, 0.5, 1, 2, 5, 10]
    },
    zoomPosition: {
      type: 'text',
      default: 'center',
      options: ['center', 'left']
    },
    border: {
      type: 'int',
      default: 10
    },
    backgroundColor: {
      type: 'color',
      default: '#ccc'
    }
  },
  legend: {
    size: {
      top: {
        type: 'int',
        default: 0
      },
      left: {
        type: 'int',
        default: -10
      },
      titleGap: {
        type: 'int',
        default: 5
      },
      titleSize: {
        type: 'int',
        default: 18
      },
      width: {
        type: 'int',
        default: 20
      },
      height: {
        type: 'int',
        default: 120
      }
    },
    ticks: {
      fontSize: {
        type: 'int',
        default: 10
      },
      tickHeight: {
        type: 'int',
        default: 1
      },
      tickWidth: {
        type: 'float',
        default: 0.25
      },
      tickGap: {
        type: 'int',
        default: 5
      },
      ticks: {
        type: 'int',
        default: 4
      }
    },
    color: {
      type: 'text',
      default: 'Reds',
      options: ['Reds', 'Blues'],
      $id: 1
    },
    minValue: {
      type: 'float',
      default: 300,
      $id: 2
    },
    maxValue: {
      type: 'float',
      default: 1500,
      $id: 3
    },
    log: {
      type: 'bool',
      default: false,
      $id: 4
    }
  },
  active: {
    default: true,
    type: 'bool',
    hidden: true
  },
  _status: {
    path: {type: 'function'},
    lonlatHover: {type: 'array'},
    strokeWidth: {type: 'float'}
  }
}

addConfig(store, ['geos'], {multiple: settings, $prefix: 'geo'})
