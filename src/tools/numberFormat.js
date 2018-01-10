import { format } from 'd3-format'

export default function (value) {
  value = parseFloat(value)
  let text
  if (value < 1) {
    text = format('.1g')(value)
  }
  else if (Number.isInteger(value)) {
    text = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  else if (value < 100) {
    text = format('.1f')(value)
  }
  else if (value < 1000000) {
    text = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  else {
    text = format('s')(value)
  }
  return text
}
