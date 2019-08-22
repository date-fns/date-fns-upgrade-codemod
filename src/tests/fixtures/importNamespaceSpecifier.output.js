import * as dateFnsOrNotFns from 'date-fns'

import {
  legacyParse,
  legacyParseMap,
  convertTokens
} from '@date-fns/upgrade/v2'

const dateIs = '2019-07-01'

const someToken = 'MM-DD'
const format = dateFnsOrNotFns.format(
  legacyParse('2019-07-01'),
  convertTokens(someToken)
)
const closestIndex = dateFnsOrNotFns.closestToIndex(
  legacyParse(new Date(2015, 8, 6)),
  legacyParseMap([
    new Date(2015, 0, 1),
    new Date(2016, 0, 1),
    new Date(2017, 0, 1)
  ])
)
const addSeconds = dateFnsOrNotFns.addSeconds(legacyParse(dateIs), 999)
