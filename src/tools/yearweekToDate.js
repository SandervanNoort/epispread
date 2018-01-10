export default function (year, week, day = 1) {
  // day = 1 (monday), day = 7 (sunday)

  // utcday: 0=sun, 1=mon, 2=tue, 3=wed, 4=thu, 5=fri, 6=sat
  let weekdayJan1 = new Date(Date.UTC(year, 0)).getUTCDay()
  if (weekdayJan1 === 0) {
    weekdayJan1 = 7
  }
  // day: 1=mon, 2=tue, 3=wed, 4=thu, 5=fri, 6=sat, 7=sun

  if (weekdayJan1 > 4) {
    // 1st of jan is fri-sun, so week 1 starts in previous year
    week += 1
  }

  return new Date(Date.UTC(year, 0, 1 + 7 * (week - 1) + day - weekdayJan1))
}
