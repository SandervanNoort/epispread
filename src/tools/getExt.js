export default function (fname) {
  return fname.slice((Math.max(0, fname.lastIndexOf('.')) || Infinity) + 1)
}
