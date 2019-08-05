import { API, FileInfo } from 'jscodeshift/src/core'
import { ImportDefinition } from './types/importDefinition'
import { CodeMap } from './utils/parse'
import * as K from 'ast-types/gen/kinds'
import {
  CallExpression,
  Identifier,
  MemberExpression
} from 'ast-types/gen/nodes'

import functionData from './data/functionData.json'

const transformImports = require('transform-imports')

type ImportSpecifier = {
  libraryName: string | null
  importedName: string
  importType: 'default' | 'named' | 'module'
}

module.exports = function(fileInfo: FileInfo, api: API) {
  const j = api.jscodeshift
  const root = j(fileInfo.source)

  const importSpecifier: ImportSpecifier[] = []

  transformImports(fileInfo.source, (importDefs: ImportDefinition[]) => {
    importDefs
      .filter(({ source }) => (source || '').includes('date-fns'))
      .filter(({ variableName }) => variableName !== undefined)
      .forEach(importDef => {
        const source = importDef.source || ''
        const importedExportName = importDef.importedExport.name

        if (
          (importedExportName === 'default' || importedExportName === '*') &&
          !source.includes('/')
        ) {
          importSpecifier.push({
            importedName: importDef.variableName!,
            libraryName: null,
            importType: 'default' as const
          })
        }
      })
  })

  const rewriteArguments = (libraryName: string) => (
    argumentNode: K.ExpressionKind | K.SpreadElementKind,
    index: number
  ) => {
    const functionCallData = (functionData as CodeMap)[libraryName]

    if (!functionCallData) return argumentNode

    if (functionCallData[index]['hasDate'])
      return j.callExpression(j.identifier('legacyParse'), [argumentNode])

    if (functionCallData[index]['hasArrayDate'])
      return j.callExpression(j.identifier('legacyParseMap'), [argumentNode])

    if (functionCallData[index]['convertTokens'])
      return j.callExpression(j.identifier('convertTokens'), [argumentNode])

    return argumentNode
  }

  importSpecifier.forEach(({ importedName }) => {
    root
      .find<CallExpression>(j.CallExpression, {
        callee: {
          type: 'MemberExpression',
          object: {
            name: importedName
          }
        }
      })
      .replaceWith<CallExpression>(({ node }) => {
        const memberName = ((node.callee as MemberExpression)
          .property as Identifier).name

        node = j.callExpression(
          j.memberExpression(
            j.identifier(importedName),
            j.identifier(memberName)
          ),
          node.arguments.map(rewriteArguments(memberName))
        )

        return node
      })
  })

  return root.toSource()
}
