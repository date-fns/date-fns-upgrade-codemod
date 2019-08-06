jest.autoMockOff()
const defineTest = require('../testUtils').defineTest

defineTest(__dirname, 'importDefaultSpecifier')
defineTest(__dirname, 'importDefaultSpecifierSubmodule')
defineTest(__dirname, 'importNamespaceSpecifier')
defineTest(__dirname, 'importSpecifier')
defineTest(__dirname, 'objectProperty')
defineTest(__dirname, 'variableDeclarator')
