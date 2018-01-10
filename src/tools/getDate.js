import yearweekToDate from './yearweekToDate'

let dates = {}

export default function (datecol) {
  let date
  if (['', undefined, null].includes(datecol)) {
    return null
  }
  if (datecol instanceof Date) {
    return datecol
  }
  if (dates.hasOwnProperty(datecol)) {
    return dates[datecol]
  }

  if (datecol.match(/^y?(\d{4})$/)) {
    let match = datecol.match(/^y?(\d{4})$/)
    let year = parseInt(match[1], 10)
    date = new Date(Date.UTC(year + 1, 12, 0))
  }
  else if (datecol.match(/^(\d{4})_?m(\d{1,2})$/)) {
    let match = datecol.match(/^(\d{4})_?m(\d{1,2})$/)
    let year = parseInt(match[1], 10)
    let month = parseInt(match[2], 10)
    // last day of the month
    date = new Date(Date.UTC(year, month, 0))
  }
  else if (datecol.match(/^(\d{4})_?w(\d{1,2})$/)) {
    let match = datecol.match(/^(\d{4})_?w(\d{1,2})$/)
    let year = parseInt(match[1], 10)
    let week = parseInt(match[2], 10)
    // last day of the week
    date = yearweekToDate(year, week, 7)
  }
  else if (isFinite(datecol)) {
    date = parseFloat(datecol)
  }
  else {
    let timestamp = Date.parse(datecol)
    if (isNaN(timestamp)) {
      date = null
    }
    else {
      date = new Date(timestamp)
    }
  }
  dates[datecol] = date
  return date
}
