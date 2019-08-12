import { format as importedFormat, closestToIndex, addSeconds } from 'date-fns'

import { legacyParse, legacyParseMap } from 'date-fns-upgrade'

const dateIs = '2019-07-01'
const someToken = 'MM-DD'

const formatInlineMod = importedFormat(legacyParse('2019-07-01'), "LL'-'dd")
const closestIndex = closestToIndex(
  legacyParse(new Date(2015, 8, 6)),
  legacyParseMap([
    new Date(2015, 0, 1),
    new Date(2016, 0, 1),
    new Date(2017, 0, 1)
  ])
)
const addSecondsPlease = addSeconds(legacyParse(dateIs), 999)
