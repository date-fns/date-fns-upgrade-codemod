// Adopted from https://github.com/reactjs/react-codemod/blob/master/bin/cli.js
// Huge thanks to Sunil Pai for original code!
const globby = require('globby')
const inquirer = require('inquirer')
const meow = require('meow')
const path = require('path')
const execa = require('execa')

const transformerDirectory = path.join(__dirname, '../', 'src')
const jscodeshiftExecutable = require.resolve('.bin/jscodeshift')

function runTransform({ files, flags, parser }) {
  const transformerPath = path.join(transformerDirectory, `transform.ts`)

  let args = []

  const { dry, print, explicitRequire } = flags

  if (dry) {
    args.push('--dry')
  }
  if (print) {
    args.push('--print')
  }

  if (explicitRequire === 'false') {
    args.push('--explicit-require=false')
  }

  args.push('--verbose=2')

  args.push('--ignore-pattern=**/node_modules/**')

  args.push('--parser', parser)

  if (parser === 'tsx') {
    args.push('--extensions=tsx,ts,jsx,js')
  } else {
    args.push('--extensions=jsx,js')
  }

  args = args.concat(['--transform', transformerPath])

  if (flags.jscodeshift) {
    args = args.concat(flags.jscodeshift)
  }

  args = args.concat(files)

  console.log(`Executing command: jscodeshift ${args.join(' ')}`)

  const result = execa.sync(jscodeshiftExecutable, args, {
    stdio: 'inherit',
    stripEof: false
  })

  if (result.error) {
    throw result.error
  }
}

const PARSER_INQUIRER_CHOICES = [
  {
    name: 'JavaScript',
    value: 'babel'
  },
  {
    name: 'JavaScript with Flow',
    value: 'flow'
  },
  {
    name: 'TypeScript',
    value: 'tsx'
  }
]

function expandFilePathsIfNeeded(filesBeforeExpansion) {
  const shouldExpandFiles = filesBeforeExpansion.some(file =>
    file.includes('*')
  )
  return shouldExpandFiles
    ? globby.sync(filesBeforeExpansion)
    : filesBeforeExpansion
}

function run() {
  const cli = meow(
    {
      description: 'Codemod to update date-fns 1.x to 2.x',
      help: `
    Usage
      $ npx date-fns-codemod <path> <...options>

        path         Files or directory to transform. Can be a glob like src/**.test.js

    Options
      --dry          Dry run (no changes are made to files)
      --print        Print transformed files to your terminal      

      --jscodeshift  (Advanced) Pass options directly to jscodeshift
    `
    },
    {
      boolean: ['dry', 'print', 'explicit-require', 'help'],
      string: ['_'],
      alias: {
        h: 'help'
      }
    }
  )

  inquirer
    .prompt([
      {
        type: 'input',
        name: 'files',
        message: 'On which files or directory should the codemod be applied?',
        when: !cli.input[0],
        default: '.',
        // validate: () =>
        filter: files => files.trim()
      },
      {
        type: 'list',
        name: 'parser',
        message: 'Which dialect of JavaScript do you use?',
        default: 'babel',
        when: !cli.flags.parser,
        pageSize: PARSER_INQUIRER_CHOICES.length,
        choices: PARSER_INQUIRER_CHOICES
      }
    ])
    .then(answers => {
      const { files, parser } = answers

      const filesBeforeExpansion = cli.input[0] || files
      const filesExpanded = expandFilePathsIfNeeded([filesBeforeExpansion])

      const selectedParser = cli.flags.parser || parser

      if (!filesExpanded.length) {
        console.log(`No files found matching ${filesBeforeExpansion.join(' ')}`)
        return null
      }

      return runTransform({
        files: filesExpanded,
        flags: cli.flags,
        parser: selectedParser,
      })
    })
}

module.exports = {
  run: run,
  runTransform: runTransform,
  jscodeshiftExecutable: jscodeshiftExecutable,
  transformerDirectory: transformerDirectory
}
