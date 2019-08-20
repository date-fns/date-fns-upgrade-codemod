declare module 'transform-imports' {
  import { NodePath } from 'ast-types'

  type ImportDefinition = {
    variableName?: string
    source?: string
    importedExport: {
      name: string
      isImportedAsCJS: boolean
    }
    kind: 'value' | 'type' | 'typeof'
    isDynamicImport: boolean
    path: NodePath

    remove(): void
    fork?(options: { insert?: 'before' | 'after' }): void
  }
  function transformImports(
    source: string,
    callback: (importDefinitions: ImportDefinition[]) => void,
    options?: any
  ): string

  export = transformImports
}
