import { JSDocInterface } from '../types/JSDocInterface'
const fs = require('fs')
const path = require('path')
const jsDocData = require('./JSDoc.json') as JSDocInterface

type FunctionLegacyMap = {
  [key: string]: boolean;
  legacyParse: boolean
  legacyParseMap: boolean
  convertTokens: boolean
}

export type CodeMap = {
  [functionName: string]: FunctionLegacyMap[]
}

const codeMap: CodeMap = {}

Object.values(jsDocData).forEach(value =>
  value.forEach(({ title, args }) => {
    codeMap[title] = args.reduce<FunctionLegacyMap[]>(
      (prevValue, { type: { names } }) => {
        prevValue.push({
          legacyParse: names.includes('Date') || names.includes('*'),
          legacyParseMap: names.includes('Array.<Date>'),
          convertTokens: title === "format",
        })

        return prevValue
      },
      []
    )
  })
)

fs.writeFile(
  path.join(__dirname, '..', '..', 'data', 'functionData.json'),
  JSON.stringify(codeMap),
  function(err: NodeJS.ErrnoException | null) {
    if (err) {
      return console.log(err)
    }

    console.log('The file was saved!')
  }
)
