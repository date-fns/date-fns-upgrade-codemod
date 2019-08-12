const { format, closestToIndex, addSeconds } = require('date-fns')

const {
  legacyParse,
  legacyParseMap,
} = require('date-fns-upgrade')

const dateIs = '2019-07-01'

const formatMePlease = format(legacyParse('2019-07-01'), "LL'-'dd")
const closestIndex = closestToIndex(
  legacyParse(new Date(2015, 8, 6)),
  legacyParseMap([
    new Date(2015, 0, 1),
    new Date(2016, 0, 1),
    new Date(2017, 0, 1)
  ])
)
const addSecondsPlease = addSeconds(legacyParse(dateIs), 999)
