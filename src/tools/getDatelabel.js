let months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

let monthsShort = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
  'Sep', 'Oct', 'Nov', 'Dec'
]

function getMonth (month, shortName) {
  return shortName ? monthsShort[month - 1] : months[month - 1]
}

export default function (datecol) {
  let datelabel
  if (datecol.match(/^(\d{4})_m(\d{2})$/)) {
    let match = datecol.match(/^(\d{4})_m(\d{2})$/)
    let year = match[1]
    let month = match[2]
    datelabel = getMonth(month, true) + ' ' + year
  }
  else if (datecol.match(/^(\d{4})_w(\d{2})$/)) {
    let match = datecol.match(/^(\d{4})_w(\d{2})$/)
    let year = match[1]
    let week = match[2]
    datelabel = year + ', week ' + week
  }
  else if (datecol.match(/^y(\d{4})$/)) {
    let match = datecol.match(/^y(\d{4})$/)
    let year = match[1]
    datelabel = year
  }
  else {
    datelabel = datecol
  }
  return datelabel
}
