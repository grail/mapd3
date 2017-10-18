import * as d3 from "./helpers/d3-service"

import {keys} from "./helpers/constants"
import {getUnique, override} from "./helpers/common"

export default function Scale () {

  let config = {
    margin: {
      top: 60,
      right: 30,
      bottom: 40,
      left: 70
    },
    height: null,
    width: null,
    keyType: null,
    chartType: null,
    colorSchema: null,
    defaultColor: null
  }

  let data = {
    dataByKey: null,
    dataBySeries: null,
    flatDataSorted: null,
    groupKeys: null
  }

  const getID = (d) => d[keys.ID]
  const getKey = (d) => d[keys.DATA]
  const getValue = (d) => d[keys.VALUE]

  function buildXScale (_allKeys) {
    const chartWidth = config.width - config.margin.left - config.margin.right
    let datesExtent = null
    let xScale = null
    if (config.keyType === "time") {
      datesExtent = d3.extent(_allKeys)
      xScale = d3.scaleTime()
    } else {
      datesExtent = _allKeys
      xScale = (config.chartType === "bar" || config.chartType === "stackedBar") ? d3.scaleBand() : d3.scalePoint()
      xScale.padding(0)
    }

    xScale.domain(datesExtent)
      .range([0, chartWidth])

    return xScale
  }

  function buildYScale (_extent) {
    const chartHeight = config.height - config.margin.top - config.margin.bottom
    const yScale = d3.scaleLinear()
        .domain(_extent)
        .rangeRound([chartHeight, 0])
        .nice()

    return yScale
  }

  function buildColorScale () {
    const ids = data.dataBySeries.map(getID)
    const colorScale = d3.scaleOrdinal()
        .range(config.colorSchema.map((d) => d.value))
        .domain(config.colorSchema.map((d, i) => d.key || ids[i]))
        .unknown(config.defaultColor)

    return colorScale
  }

  function splitByGroups () {
    const groups = {}
    data.dataBySeries.forEach((d) => {
      const key = d[keys.GROUP]
      if (!groups[key]) {
        groups[key] = {
          allValues: [],
          allKeys: []
        }
      }
      groups[key].allValues = groups[key].allValues.concat(d[keys.VALUES].map(getValue))
      groups[key].allKeys = groups[key].allKeys.concat(d[keys.VALUES].map(getKey))
    })

    return groups
  }

  function getStackedScales () {
    const allStackHeights = data.dataByKey.map((d) => d3.sum(d.series.map((dB) => dB.value)))

    const stackData = data.dataByKey.map((d) => {
      const points = {
        key: d[keys.DATA]
      }
      d.series.forEach((dB) => {
        points[dB[keys.ID]] = dB[keys.VALUE]
      })

      return points
    })

    const stack = d3.stack()
      .keys(data.dataBySeries.map(getID))
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone)

    const valuesExtent = d3.extent(allStackHeights)

    const allKeys = data.flatDataSorted.map(getKey)
    const allUniqueKeys = getUnique(allKeys)

    const xScale = buildXScale(allUniqueKeys)
    const colorScale = buildColorScale()
    const yScale = buildYScale([0, valuesExtent[1]])

    return {
      stackData,
      stack,
      xScale,
      yScale,
      colorScale
    }
  }

  function getHorizontalScales () {
    const groups = splitByGroups()

    const hasSecondAxis = data.groupKeys.length > 1

    const groupAxis1 = groups[data.groupKeys[0]]
    const allUniqueKeys = groupAxis1.allKeys
    const valuesExtent = d3.extent(groupAxis1.allValues)

    const xScale = buildXScale(allUniqueKeys)
    const colorScale = buildColorScale()
    const yScale = buildYScale(valuesExtent)

    let yScale2 = null
    if (hasSecondAxis) {
      const groupAxis2 = groups[data.groupKeys[1]]
      const valuesExtent2 = d3.extent(groupAxis2.allValues)

      yScale2 = yScale.copy()
        .domain(valuesExtent2)
    }

    return {
      hasSecondAxis,
      xScale,
      yScale,
      colorScale,
      yScale2
    }
  }

  function getScales () {
    if (config.chartType === "stackedBar"
      || config.chartType === "stackedArea") {
      return getStackedScales()
    } else {
      return getHorizontalScales()
    }
  }

  function setConfig (_config) {
    config = override(config, _config)
    return this
  }

  function setData (_data) {
    data = Object.assign({}, data, _data)
    return this
  }

  return {
    setConfig,
    setData,
    getScales
  }
}
