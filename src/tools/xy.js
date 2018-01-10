export default function (event) {
  let val = {}
  if (event.changedTouches) {
    val.x = event.changedTouches[0].clientX
    val.y = event.changedTouches[0].clientY
  }
  else {
    val.x = event.pageX || event.clientX + document.documentElement.scrollLeft
    val.y = event.pageY || event.clientY + document.documentElement.scrollTop
  }
  return val
}
