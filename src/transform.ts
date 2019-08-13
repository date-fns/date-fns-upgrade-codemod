import { camelCase } from 'change-case'
import isEmpty from 'lodash.isempty'
import { v2 } from '@date-fns/upgrade'

import { API, FileInfo, Literal, Options } from 'jscodeshift/src/core'
import { CodeMap } from './utils/parse'
import {
  ExpressionKind,
  LiteralKind,
  SpreadElementKind
} from 'ast-types/gen/kinds'
import {
  CallExpression,
  Identifier,
  ImportDeclaration,
  MemberExpression,
  VariableDeclaration
} from 'ast-types/gen/nodes'
import { Collection } from 'jscodeshift/src/Collection'
import { ImportDefinition, ImportSpecifier } from './types'

const transformImports = require('transform-imports')
const functionData = require('./data/functionData.json') as CodeMap

const lastPath = (
  c: Collection<ImportDeclaration> | Collection<VariableDeclaration>
) => c.at(-1).paths()[0]

const getParser = (options: Options) => {
  const realOptions = isEmpty(options) ? undefined : options

  switch (options.parser) {
    case 'babylon':
      return require('jscodeshift/parser/babylon')(realOptions)
    case 'flow':
      return require('jscodeshift/parser/flow')(realOptions)
    case 'ts':
      return require('jscodeshift/parser/ts')(realOptions)
    case 'tsx':
      return require('jscodeshift/parser/tsx')(realOptions)
    case 'babel':
    default:
      return require('jscodeshift/parser/babylon')(realOptions)
  }
}

const dateFnsCodemod = (fileInfo: FileInfo, api: API, options: Options) => {
  const j = api.jscodeshift

  const importSpecifiers: ImportSpecifier[] = []

  /**
   * Hopefully import types are consistent across project/file, but
   * for some magic at the end, we keep a track of import types used
   */
  const usedImportTypes = {
    default: false,
    named: false,
    module: false
  }

  const usedLegacyUpgrades: { [key: string]: boolean } = {
    legacyParse: false,
    legacyParseMap: false,
    convertTokens: false
  }

  /**
   * First we go over imports in the file with help from `transform-imports` package
   * We're looking for:
   *    1) Packages imported from `date-fns[/something]`
   *    2) Have imported variable name
   */
  const codeWithTransformedImports = transformImports(
    fileInfo.source,
    (importDefs: ImportDefinition[]) => {
      importDefs
        .filter(({ source }) => (source || '').includes('date-fns'))
        .filter(({ variableName }) => variableName !== undefined)
        .forEach(importDef => {
          const source = importDef.source!
          const libraryName = importDef.importedExport.name

          const isImportNameDefault =
            libraryName === 'default' || libraryName === '*'
          const isImportingFromModule = importDef.source!.includes('/')

          const importType: ImportSpecifier['importType'] =
            (isImportNameDefault && isImportingFromModule && 'module') ||
            (isImportNameDefault && !isImportingFromModule && 'default') ||
            (!isImportNameDefault && !isImportingFromModule && 'named') ||
            'named'

          switch (importType) {
            case 'default':
              importSpecifiers.push({
                importedName: importDef.variableName!,
                importType
              })
              usedImportTypes[importType] = true

              break
            case 'named':
              importSpecifiers.push({
                importedName: importDef.variableName!,
                libraryName: libraryName,
                importType
              })
              usedImportTypes[importType] = true

              break
            case 'module':
              const newLibraryName = camelCase(source.split('/')[1]).replace(
                /iso/gi,
                'ISO'
              )

              importSpecifiers.push({
                importedName: importDef.variableName!,
                libraryName: newLibraryName,
                importType
              })

              usedImportTypes[importType] = true
              importDef.source = `date-fns/${newLibraryName}`

              break
          }
        })
    },
    {
      parser: getParser(options)
    }
  )

  const root = j(codeWithTransformedImports)

  /**
   * For each argument of function imported from `date-fns`
   *    1) Check if function data exists in imported JSON
   *    2) Return passed argument node if it doesn't
   *    3)
   */
  const rewriteArguments = (libraryName: string) => (
    argumentNode: ExpressionKind | SpreadElementKind | LiteralKind,
    argumentIndex: number
  ) => {
    const functionCallData = functionData[libraryName]

    if (!functionCallData) return argumentNode

    const legacyHelperFunctionName = functionCallData[argumentIndex]

    if (!legacyHelperFunctionName) return argumentNode

    if (
      legacyHelperFunctionName === 'convertTokens' &&
      argumentNode.type === 'Literal' &&
      typeof argumentNode.value === 'string'
    )
      return j.literal(v2.convertTokens(argumentNode.value))

    usedLegacyUpgrades[legacyHelperFunctionName] = true

    return j.callExpression(j.identifier(legacyHelperFunctionName), [
      argumentNode
    ])
  }

  /**
   * If `date-fns` was imported like `import dateFns from `date-fns`
   * we have to look for function calls (`CallExpression`) on import name
   * e.g. `dateFns.format`
   */
  const processDefaultImport = (importedName: string) => {
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

        return j.callExpression(
          j.memberExpression(
            j.identifier(importedName),
            j.identifier(memberName)
          ),
          node.arguments.map(rewriteArguments(memberName))
        )
      })
  }

  /**
   * If `date-fns` was imported like `import { format } from `date-fns`
   * then we just need to look for calls on imported function
   */
  const processNamedImport = (importedName: string, libraryName: string) => {
    root
      .find<CallExpression>(j.CallExpression, {
        callee: {
          type: 'Identifier',
          name: importedName
        }
      })
      .replaceWith(({ node }) =>
        j.callExpression(
          j.identifier(importedName),
          node.arguments.map(rewriteArguments(libraryName))
        )
      )
  }

  /**
   * Process all collected imports
   */
  importSpecifiers.forEach(importSpecifier => {
    switch (importSpecifier.importType) {
      case 'default':
        processDefaultImport(importSpecifier.importedName)
        break
      case 'named':
      case 'module':
        processNamedImport(
          importSpecifier.importedName,
          importSpecifier.libraryName
        )
        break
    }
  })

  /**
   * As a last step we add import of all `date-fns-upgrade` tools used
   */
  const usedLegacyUpgradesEntries = Object.entries(usedLegacyUpgrades).filter(
    ([_, value]) => value
  )

  if (usedLegacyUpgradesEntries.length > 0) {
    const usedLegacyUpgrades = usedLegacyUpgradesEntries.reduce<string[]>(
      (accum, [key]) => accum.concat(key),
      []
    )

    const importDeclarationCollection = root.find<ImportDeclaration>(
      j.ImportDeclaration
    )
    const variableDeclarationCollection = root.find<VariableDeclaration>(
      j.VariableDeclaration,
      {
        declarations: [
          {
            type: 'VariableDeclarator',
            init: {
              type: 'CallExpression',
              callee: {
                type: 'Identifier',
                name: 'require'
              }
            }
          }
        ]
      }
    )

    if (importDeclarationCollection.size()) {
      lastPath(importDeclarationCollection).insertAfter(
        j.importDeclaration(
          usedLegacyUpgrades.map(value =>
            j.importSpecifier(j.identifier(value))
          ),
          j.stringLiteral('date-fns-upgrade')
        )
      )
    } else if (variableDeclarationCollection.size()) {
      lastPath(variableDeclarationCollection).insertAfter(
        j.variableDeclaration('const', [
          j.variableDeclarator(
            j.objectPattern(
              usedLegacyUpgrades.map(value => {
                const identifier = j.identifier(value)
                return j.property.from({
                  kind: 'init',
                  key: identifier,
                  value: identifier,
                  shorthand: true
                })
              })
            ),
            j.callExpression(j.identifier('require'), [
              j.literal('date-fns-upgrade')
            ])
          )
        ])
      )
    }
  }

  return root.toSource()
}

module.exports = dateFnsCodemod
