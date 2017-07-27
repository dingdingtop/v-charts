import { itemPoint } from '../echarts-base'
import { getFormated } from '../util'
import 'echarts/lib/chart/pie'

const pieRadius = 100
const ringRadius = [80, 100]
const roseRingRadius = [20, 100]
const pieOffsetY = 200

function getPieSeries (args) {
  const {
    rows,
    dataType,
    percentShow,
    dimension,
    metrics,
    radius,
    offsetY,
    selectedMode,
    hoverAnimation,
    digit,
    roseType,
    label,
    level,
    limitShowNum
  } = args

  let series = []
  let levelTemp = {}
  let rowsTemp = []
  if (level) {
    level.forEach((levelItems, index) => {
      levelItems.forEach(item => { levelTemp[item] = index })
    })
    rows.forEach(row => {
      const itemLevel = levelTemp[row[dimension]]
      if (itemLevel !== undefined) {
        if (rowsTemp[itemLevel]) {
          rowsTemp[itemLevel].push(row)
        } else {
          rowsTemp[itemLevel] = [row]
        }
      }
    })
  } else {
    rowsTemp.push(rows)
  }
  let seriesBase = {
    type: 'pie',
    selectedMode,
    hoverAnimation,
    roseType,
    center: ['50%', offsetY]
  }
  let rowsTempLength = rowsTemp.length
  rowsTemp.forEach((dataRows, index) => {
    let seriesItem = Object.assign({ data: [] }, seriesBase)
    const centerWidth = radius / rowsTempLength
    if (!index) {
      seriesItem.radius = centerWidth
    } else {
      const outerWidth = centerWidth + radius / (2 * rowsTempLength) * (2 * index - 1)
      const innerWidth = outerWidth + radius / (2 * rowsTempLength)
      seriesItem.radius = [outerWidth, innerWidth]
    }
    if (rowsTempLength > 1 && index === 0) {
      seriesItem.label = {
        normal: { position: 'inner' }
      }
    }
    if (label) seriesItem.label = label
    if (percentShow) {
      seriesItem.label = {
        normal: {
          show: true,
          position: rowsTempLength > 1 && index === 0 ? 'inner' : 'outside',
          formatter (item) {
            let tpl = []
            tpl.push(`${item.name}:`)
            tpl.push(getFormated(item.value, dataType, digit))
            tpl.push(`(${item.percent}%)`)
            return tpl.join(' ')
          }
        }
      }
    }
    seriesItem.data = dataRows.map(row => ({
      name: row[dimension],
      value: row[metrics]
    }))
    series.push(seriesItem)
  })
  if (limitShowNum) {
    const firstData = series[0].data
    const remainArr = firstData.slice(limitShowNum, firstData.length)
    let sum = 0
    remainArr.forEach(item => { sum += item.value })
    series[0].data = firstData.slice(0, limitShowNum)
    series[0].data.push({ name: '其他', value: sum })
  }
  return series
}

function getPieLegend (args) {
  const { rows, dimension, legendLimit, level, limitShowNum } = args
  let legend = []
  const levelTemp = []
  if (level) {
    level.forEach(levelItem => {
      levelItem.forEach(item => {
        levelTemp.push(item)
      })
    })
    legend = levelTemp
  } else if (limitShowNum) {
    for (let i = 0; i < limitShowNum; i++) {
      legend.push(rows[i][dimension])
    }
    legend.push('其他')
  } else {
    legend = rows.map(row => row[dimension])
  }
  return legend.length
    ? { data: legend, show: legend.length < legendLimit }
    : false
}

function getPieTooltip (args) {
  const {
    dataType,
    rows,
    limitShowNum,
    digit,
    metrics,
    dimension
  } = args
  let sum = 0
  const remainArr = rows.map(row => {
    sum += row[metrics]
    return {
      name: row[dimension],
      value: row[metrics]
    }
  })
  return {
    formatter (item) {
      let tpl = []
      tpl.push(itemPoint(item.color))
      if (limitShowNum && item.name === '其他') {
        tpl.push('其他:')
        remainArr.forEach(({ name, value }) => {
          const percent = getFormated((value / sum), 'percent')
          tpl.push(`<br>${name}:`)
          tpl.push(getFormated(value, dataType, digit))
          tpl.push(`(${percent})`)
        })
      } else {
        tpl.push(`${item.name}:`)
        tpl.push(getFormated(item.value, dataType, digit))
        tpl.push(`(${item.percent}%)`)
      }
      return tpl.join(' ')
    }
  }
}

export const pie = (columns, rows, settings, extra, isRing) => {
  const {
    dataType = 'normal',
    percentShow,
    dimension = columns[0],
    metrics = columns[1],
    roseType = false,
    radius = isRing
      ? roseType
        ? roseRingRadius
        : ringRadius
      : pieRadius,
    offsetY = pieOffsetY,
    legendLimit = 30,
    selectedMode = false,
    hoverAnimation = true,
    digit = 2,
    label = false,
    level = false,
    limitShowNum = 0
  } = settings
  const { tooltipVisible, legendVisible } = extra
  const seriesParams = {
    rows,
    dataType,
    percentShow,
    dimension,
    metrics,
    radius,
    offsetY,
    selectedMode,
    hoverAnimation,
    digit,
    roseType,
    label,
    level,
    limitShowNum
  }
  const series = getPieSeries(seriesParams)
  const legendParams = {
    rows,
    dimension,
    legendLimit,
    level,
    limitShowNum
  }
  const legend = legendVisible && getPieLegend(legendParams)
  const tooltip = tooltipVisible && getPieTooltip({
    dataType,
    rows,
    limitShowNum,
    digit,
    metrics,
    dimension
  })
  const options = { series, legend, tooltip }
  return options
}

export const ring = (columns, rows, settings, extra) => {
  return pie(columns, rows, settings, extra, true)
}
