import { format, formatSpecifier } from 'd3-format'
import formatThousands from './formatThousands'

export default function (tickFormat) {
  if (tickFormat === '') {
    return ['', null]
  }
  else if (tickFormat !== undefined) {
    let match = tickFormat.match(/\/(\d+)/)
    if (match) {
      let factor = parseInt(match[1], 10)
      return [`per ${formatThousands(factor)}`, (val) => format('d')(val * factor)]
    }
    match = tickFormat.match(/\*(\d+)/)
    if (match) {
      let factor = parseInt(match[1], 10)
      return [`x ${formatThousands(factor)}`, (val) => format('d')(val / factor)]
    }
    try {
      formatSpecifier(tickFormat)
      return ['', tickFormat]
    }
    catch (e) {
      return ['', 's']
      // Cannot parse tickformat
    }
  }
  else {
    return ['', 's']
  }
}
