import {keys} from "./constants"
import * as d3 from "./d3-service"

/**
 * Clones the passed array of data
 * @param  {Object[]} dataToClone Data to clone
 * @return {Object[]}             Cloned data
 */
export function cloneData (_dataToClone) {
  return JSON.parse(JSON.stringify(_dataToClone))
}

export function sortData (_data, _keyType) {
  const sortedData = cloneData(_data)
  if (_keyType === "time") {
    sortedData.forEach((d) => {
      d[keys.DATA] = new Date(d[keys.DATA])
    })
    sortedData.sort((a, b) => a[keys.DATA].getTime() - b[keys.DATA].getTime())
  } else if (_keyType === "string") {
    sortedData.sort((a, b) => a[keys.DATA].localeCompare(b[keys.DATA], "en", {numeric: false}))
  } else {
    sortedData.sort((a, b) => a[keys.DATA] - b[keys.DATA])
  }
  return sortedData
}

export function getUnique (arr) {
  return [...new Set(arr)]
}

export function invertScale (_scale, _mouseX, _keyType) {
  if (_keyType === "time" || _keyType === "number") {
    return _scale.invert(_mouseX)
  } else {
    const bandStep = _scale.step()
    const index = Math.round((_mouseX) / bandStep)
    return _scale.domain()[index]
  }
}

export function override (a, b) {
  const accum = {}
  for (const x in a) {
    if (a.hasOwnProperty(x)) {
      accum[x] = (x in b) ? b[x] : a[x]
    }
  }
  return accum
}

export function throttle (callback, limit) {
  let wait = false
  let timer = null
  return function throttleFn (...args) {
    if (!wait) {
      wait = true
      clearTimeout(timer)
      timer = setTimeout(() => {
        wait = false
        callback(...args)
      }, limit)
    }
  }
}

export function rebind (target) {
  return function reapply (...args) {
    target.on(`${args[0]}.rebind`, ...args.slice(1))
    return this
  }
}

export function stringToType (str, type) {
  let converted = str
  if (type === "time") {
    converted = new Date(str)
  } else if (type === "number") {
    converted = Number(str)
  }
  return converted
}

// slightly modified version of d3's default time-formatting to always use abbrev month names
const formatMillisecond = d3.timeFormat(".%L");
const formatSecond = d3.timeFormat(":%S");
const formatMinute = d3.timeFormat("%I:%M");
const formatHour = d3.timeFormat("%I %p");
const formatDay = d3.timeFormat("%a %d");
const formatWeek = d3.timeFormat("%b %d");
const formatMonth = d3.timeFormat("%b");
const formatYear = d3.timeFormat("%Y");

/**
 * auto formats a date obj to a string using d3-time-format
 * @param {Date} date object to format
 * @returns {string} date string
*/
export function multiFormat(date) {
  return (d3.timeSecond(date) < date ? formatMillisecond
      : d3.timeMinute(date) < date ? formatSecond
      : d3.timeHour(date) < date ? formatMinute
      : d3.timeDay(date) < date ? formatHour
      : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? formatDay : formatWeek)
      : d3.timeYear(date) < date ? formatMonth
      : formatYear)(date);
}
