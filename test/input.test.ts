import * as core from '@actions/core'
import {expect} from 'chai'
import * as fc from 'fast-check'
import {describe, it} from 'mocha'
import * as path from 'node:path'
import * as process from 'process'

import {Parser} from '../src/input.js'
import {silentLogger} from '../src/util.js'

class InputEnvSetter {
  withTargetRepo(input: string) {
    process.env['INPUT_TARGETREPO'] = input
    return this
  }
  withTargetBranch(input: string) {
    process.env['INPUT_TARGETBRANCH'] = input
    return this
  }
  withTargetFolder(input: string) {
    process.env['INPUT_TARGETFOLDER'] = input
    return this
  }
  withSourceFolder(input: string) {
    process.env['INPUT_SOURCEFOLDER'] = input
    return this
  }
  withTags(input: string) {
    process.env['INPUT_TAGS'] = input
    return this
  }
  withToken(input: string) {
    process.env['INPUT_TOKEN'] = input
    return this
  }
  withPublishAll(input: string) {
    process.env['INPUT_PUBLISHALL'] = input
    return this
  }
  withJekyllTheme(input: string) {
    process.env['INPUT_JEKYLLTHEME'] = input
    return this
  }
  withJekyllTitle(input: string) {
    process.env['INPUT_JEKYLLTITLE'] = input
    return this
  }
  withJekyllDescription(input: string) {
    process.env['INPUT_JEKYLLDESCRIPTION'] = input
    return this
  }
  withColorSchema(input: string) {
    process.env['INPUT_COLORSCHEMA'] = input
    return this
  }
  withDomain(input: string) {
    process.env['INPUT_DOMAIN'] = input
    return this
  }
  withTargetDefaultBranch(input: string) {
    process.env['INPUT_TARGETDEFAULTBRANCH'] = input
    return this
  }
  withSourceRepo(input: string) {
    process.env['GITHUB_REPOSITORY'] = input
    return this
  }
  withActor(input: string) {
    process.env['GITHUB_ACTOR'] = input
    return this
  }
  withSourceBranchName(input: string) {
    process.env['GITHUB_REF_NAME'] = input
    return this
  }
}

function cleanupInputEnv() {
  process.env['INPUT_TARGETREPO'] = ''
  process.env['INPUT_TARGETBRANCH'] = ''
  process.env['INPUT_TARGETFOLDER'] = ''
  process.env['INPUT_SOURCEFOLDER'] = ''
  process.env['INPUT_TAGS'] = ''
  process.env['INPUT_TOKEN'] = ''
  process.env['INPUT_PUBLISHALL'] = ''
  process.env['INPUT_JEKYLLTHEME'] = ''
  process.env['INPUT_JEKYLLTITLE'] = ''
  process.env['INPUT_JEKYLLDESCRIPTION'] = ''
  process.env['INPUT_COLORSCHEMA'] = ''
  process.env['INPUT_DOMAIN'] = ''
  process.env['INPUT_TARGETDEFAULTBRANCH'] = ''
  process.env['GITHUB_REPOSITORY'] = ''
  process.env['GITHUB_ACTOR'] = ''
  process.env['GITHUB_REF_NAME'] = ''
}

function configureInput(
  targetRepo: string,
  targetBranch: string,
  targetFolder: string,
  sourceFolder: string,
  tags: string,
  token: string,
  publishAll: string,
  jekyllTheme?: string,
  jekyllTitle?: string,
  jekyllDescription?: string,
  colorSchema?: string,
  domain?: string,
  targetDefaultBranch: string = 'main'
) {
  process.env['INPUT_TARGETREPO'] = targetRepo
  process.env['INPUT_TARGETBRANCH'] = targetBranch
  process.env['INPUT_TARGETFOLDER'] = targetFolder
  process.env['INPUT_SOURCEFOLDER'] = sourceFolder
  process.env['INPUT_TAGS'] = tags
  process.env['INPUT_TOKEN'] = token
  process.env['INPUT_PUBLISHALL'] = publishAll
  process.env['INPUT_JEKYLLTHEME'] = jekyllTheme
  process.env['INPUT_JEKYLLTITLE'] = jekyllTitle
  process.env['INPUT_JEKYLLDESCRIPTION'] = jekyllDescription
  process.env['INPUT_COLORSCHEMA'] = colorSchema
  process.env['INPUT_DOMAIN'] = domain
  process.env['INPUT_TARGETDEFAULTBRANCH'] = targetDefaultBranch
}

function configureGithubDefaults(
  githubRepository?: string,
  actor?: string,
  sourceRunBranch: string = 'main'
) {
  process.env['GITHUB_REPOSITORY'] = githubRepository
  process.env['GITHUB_ACTOR'] = actor
  process.env['GITHUB_REF_NAME'] = sourceRunBranch
}

const fsExistsTrue = {
  exists(path: string) {
    return true
  }
}

const fsExistsFalse = {
  exists(path: string) {
    return false
  }
}

const input = {
  getInput(name, options) {
    return core.getInput(name, options)
  },
  getBooleanInput(name, options) {
    return core.getBooleanInput(name, options)
  }
}

describe('input tests', () => {
  beforeEach(() => {
    cleanupInputEnv()
  })

  it('test targetRepo not specified', () => {
    new InputEnvSetter()
      .withTargetBranch('gh-pages')
      .withTargetFolder('docs')
      .withSourceFolder('.')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')

    expect(() => {
      const parser = new Parser(fsExistsTrue, input, silentLogger)
      parser.parseInput()
    }).throw(
      'Error: targetRepo =  value length must be between[1,295],targetRepo =  must have format username/reponame'
    )
  })

  it("test targetRepo specified and doesn't match with source repo", () => {
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch('gh-pages')
      .withTargetFolder('.')
      .withSourceFolder('.')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/source-repository')
      .withActor('username')
      .withTargetDefaultBranch('main')
      .withSourceBranchName('main')

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    const opts = parser.parseInput()

    expect(opts.targetRepo).eq('username/repository')
  })

  it('test targetBranch not specified', () => {
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetFolder('.')
      .withSourceFolder('.')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/source-repository')
      .withActor('username')
      .withTargetDefaultBranch('main')
      .withSourceBranchName('main')
    const parser = new Parser(fsExistsTrue, input, silentLogger)
    expect(() => parser.parseInput()).throw(
      'Error: targetBranch =  value length must be between[1,255]'
    )
  })

  it('test targetBranch specified', () => {
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch('branch')
      .withTargetFolder('.')
      .withSourceFolder('.')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/source-repository')
      .withActor('username')
      .withTargetDefaultBranch('main')
      .withSourceBranchName('main')

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    const opts = parser.parseInput()
    expect(opts.targetBranch).eq('branch')
  })

  it("test targetFolder 'docs' spelling options", () => {
    const targetDirs = fc.record({
      targetFolder: fc.constantFrom('docs', '/docs')
    })

    fc.assert(
      fc.property(targetDirs, prop => {
        new InputEnvSetter()
          .withTargetRepo('username/repository')
          .withTargetBranch('gh-pages')
          .withTargetFolder(prop.targetFolder)
          .withSourceFolder('.')
          .withTags('tag')
          .withToken('1')
          .withPublishAll('true')
          .withSourceRepo('username/source-repository')
          .withActor('username')
          .withTargetDefaultBranch('main')
          .withSourceBranchName('main')

        const parser = new Parser(fsExistsTrue, input, silentLogger)
        const opts = parser.parseInput()
        expect(opts.targetDir).eq(path.resolve('target', 'docs'))

        cleanupInputEnv()
      })
    )
  })

  it("test targetFolder 'root' spelling options", () => {
    const targetDirs = fc.record({
      targetFolder: fc.constantFrom('.', '/')
    })

    fc.assert(
      fc.property(targetDirs, prop => {
        new InputEnvSetter()
          .withTargetRepo('username/repository')
          .withTargetBranch('gh-pages')
          .withTargetFolder(prop.targetFolder)
          .withSourceFolder('.')
          .withTags('tag')
          .withToken('1')
          .withPublishAll('true')
          .withSourceRepo('username/source-repository')
          .withActor('username')
          .withTargetDefaultBranch('main')
          .withSourceBranchName('main')

        const parser = new Parser(fsExistsTrue, input, silentLogger)
        const opts = parser.parseInput()
        expect(opts.targetDir).eq(path.resolve('target', '.'))
        cleanupInputEnv()
      })
    )
  })

  it('test targetFolder incorrect options', () => {
    const targetDirs = fc.record({
      targetFolder: fc.constantFrom(
        '',
        '/doc',
        '/root',
        'doc',
        'root',
        '/a',
        '//',
        '..'
      )
    })

    fc.assert(
      fc.property(targetDirs, prop => {
        new InputEnvSetter()
          .withTargetRepo('username/repository')
          .withTargetBranch('gh-pages')
          .withTargetFolder(prop.targetFolder)
          .withSourceFolder('.')
          .withTags('tag')
          .withToken('1')
          .withPublishAll('true')
          .withSourceRepo('username/source-repository')
          .withActor('username')
          .withTargetDefaultBranch('main')
          .withSourceBranchName('main')

        const parser = new Parser(fsExistsTrue, input, silentLogger)

        expect(() => parser.parseInput()).throw(Error)
      })
    )
  })

  it('test sourceFolder options', () => {
    const sourceDirs = fc.record({
      sourceDir: fc.constantFrom(
        ['.', '.'],
        ['/', '.'],
        ['/s', 's'],
        ['s', 's'],
        ['s/', 's'],
        ['s/.', 's'],
        ['s/..', '.'],
        ['s//', 's'],
        ['/s1/s2', 's1/s2'],
        ['s1/s2', 's1/s2'],
        ['s1/s2/', 's1/s2'],
        ['s1/s2/../s3/.', 's1/s3']
      )
    })

    fc.assert(
      fc.property(sourceDirs, prop => {
        new InputEnvSetter()
          .withTargetRepo('username/repository')
          .withTargetBranch('gh-pages')
          .withTargetFolder('.')
          .withSourceFolder(prop.sourceDir[0])
          .withTags('tag')
          .withToken('1')
          .withPublishAll('true')
          .withSourceRepo('username/source-repository')
          .withActor('username')
          .withTargetDefaultBranch('main')
          .withSourceBranchName('main')

        const parser = new Parser(fsExistsTrue, input, silentLogger)
        const opts = parser.parseInput()

        expect(opts.sourceDir).eq(path.resolve('source', prop.sourceDir[1]))

        cleanupInputEnv()
      })
    )
  })

  it("test sourceFolder if doesn't exist", () => {
    const sourceDir = 'src'
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch('gh-pages')
      .withTargetFolder('.')
      .withSourceFolder(sourceDir)
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/source-repository')
      .withActor('username')
      .withTargetDefaultBranch('main')
      .withSourceBranchName('main')

    const parser = new Parser(fsExistsFalse, input, silentLogger)

    expect(() => parser.parseInput()).throw(
      `Error: ${path.resolve('source', sourceDir)} doesn't`
    )
  })

  it('test success tags parsing, if publishAll=false', () => {
    const tags = fc.record({
      tag: fc.constantFrom(
        ['tag', new Set(['tag'])],
        ['tag,', new Set(['tag'])],
        ['tag  ', new Set(['tag'])],
        [' tag ', new Set(['tag'])],
        [' tag', new Set(['tag'])],
        ['tag1,tag2', new Set(['tag1', 'tag2'])],
        ['tag1,tag2,', new Set(['tag1', 'tag2'])],
        ['tag1 , tag2,', new Set(['tag1', 'tag2'])],
        ['tag1,tag1', new Set(['tag1'])]
      )
    })

    fc.assert(
      fc.property(tags, prop => {
        const publishAll = 'false'
        new InputEnvSetter()
          .withTargetRepo('username/repository')
          .withTargetBranch('gh-pages')
          .withTargetFolder('.')
          .withSourceFolder('source')
          .withTags(prop.tag[0] as string)
          .withToken('1')
          .withPublishAll(publishAll)
          .withSourceRepo('username/source-repository')
          .withActor('username')
          .withTargetDefaultBranch('main')
          .withSourceBranchName('main')

        const parser = new Parser(fsExistsTrue, input, silentLogger)
        const opts = parser.parseInput()

        expect(opts.tags).deep.eq(prop.tag[1])
        expect(opts.publishAll).eq(false)

        cleanupInputEnv()
      })
    )
  })

  it('test tags parse failed, if publishAll=false', () => {
    const tags = fc.record({
      tag: fc.constantFrom(
        ['', "Error: if publishAll=false, tags can't be empty"],
        [',', "Error: if publishAll=false, tags can't be empty"],
        [',,,', "Error: if publishAll=false, tags can't be empty"],
        ['  ', "Error: if publishAll=false, tags can't be empty"]
      )
    })

    fc.assert(
      fc.property(tags, prop => {
        const publishAll = 'false'
        new InputEnvSetter()
          .withTargetRepo('username/repository')
          .withTargetBranch('gh-pages')
          .withTargetFolder('.')
          .withSourceFolder('source')
          .withTags(prop.tag[0] as string)
          .withToken('1')
          .withPublishAll(publishAll)
          .withSourceRepo('username/source-repository')
          .withActor('username')
          .withTargetDefaultBranch('main')
          .withSourceBranchName('main')
        const parser = new Parser(fsExistsTrue, input, silentLogger)

        expect(() => parser.parseInput()).throw(prop.tag[1])
        cleanupInputEnv()
      })
    )
  })

  it('test parse tags success, if publishAll=true', () => {
    const tags = fc.record({
      tag: fc.constantFrom(
        ['tag'],
        ['tag,'],
        ['tag  '],
        [' tag '],
        [' tag'],
        ['tag1,tag2'],
        ['tag1,tag2,'],
        ['tag1 , tag2,'],
        ['tag1,tag1'],
        [''],
        [' '],
        [','],
        [',,']
      )
    })

    fc.assert(
      fc.property(tags, prop => {
        const publishAll = 'true'
        new InputEnvSetter()
          .withTargetRepo('username/repository')
          .withTargetBranch('gh-pages')
          .withTargetFolder('.')
          .withSourceFolder('source')
          .withTags(prop.tag[0] as string)
          .withToken('1')
          .withPublishAll(publishAll)
          .withSourceRepo('username/source-repository')
          .withActor('username')
          .withTargetDefaultBranch('main')
          .withSourceBranchName('main')

        const parser = new Parser(fsExistsTrue, input, silentLogger)
        const opts = parser.parseInput()

        expect(opts.tags).deep.eq(new Set<string>([]))
        expect(opts.publishAll).eq(true)

        cleanupInputEnv()
      })
    )
  })

  it('test parse publishAll success', () => {
    const publishAll = fc.record({
      pa: fc.constantFrom(
        ['true', true],
        ['TRUE', true],
        ['True', true],
        [' true ', true],
        ['false', false],
        ['FALSE', false],
        ['False', false],
        [' false ', false]
      )
    })

    fc.assert(
      fc.property(publishAll, prop => {
        new InputEnvSetter()
          .withTargetRepo('username/repository')
          .withTargetBranch('gh-pages')
          .withTargetFolder('.')
          .withSourceFolder('source')
          .withTags('tag')
          .withToken('1')
          .withPublishAll(prop.pa[0] as string)
          .withSourceRepo('username/source-repository')
          .withActor('username')
          .withTargetDefaultBranch('main')
          .withSourceBranchName('main')

        const parser = new Parser(fsExistsTrue, input, silentLogger)
        const opts = parser.parseInput()

        expect(opts.publishAll).eq(prop.pa[1])

        cleanupInputEnv()
      })
    )
  })

  it('test parse publishAll failed', () => {
    const publishAll = fc.record({
      pa: fc.constantFrom('tRue', 'fAlse')
    })

    fc.assert(
      fc.property(publishAll, prop => {
        new InputEnvSetter()
          .withTargetRepo('username/repository')
          .withTargetBranch('gh-pages')
          .withTargetFolder('.')
          .withSourceFolder('source')
          .withTags('tag')
          .withToken('1')
          .withPublishAll(prop.pa[0] as string)
          .withSourceRepo('username/source-repository')
          .withActor('username')
          .withTargetDefaultBranch('main')
          .withSourceBranchName('main')

        const parser = new Parser(fsExistsTrue, input, silentLogger)

        expect(() => parser.parseInput()).throw(
          `Input does not meet YAML 1.2 "Core Schema" specification: publishAll` +
            `\n` +
            `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``
        )

        cleanupInputEnv()
      })
    )
  })

  it('test commitMsg', () => {
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch('gh-pages')
      .withTargetFolder('.')
      .withSourceFolder('source')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/source-repository')
      .withActor('username')
      .withTargetDefaultBranch('main')
      .withSourceBranchName('main')

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    const opts = parser.parseInput()

    expect(opts.commitMsg).eq('publish obsidian')
  })

  it('test success parsing colorSchema', () => {
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch('gh-pages')
      .withTargetFolder('.')
      .withSourceFolder('source')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/source-repository')
      .withActor('username')
      .withTargetDefaultBranch('main')
      .withSourceBranchName('main')
      .withColorSchema('light')

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    const opts = parser.parseInput()

    expect(opts.color_scheme).eq('light')
  })

  it('test failed parsing colorSchema', () => {
    const cs = 'colorschemvaluetoolng'
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch('gh-pages')
      .withTargetFolder('.')
      .withSourceFolder('source')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/source-repository')
      .withActor('username')
      .withTargetDefaultBranch('main')
      .withSourceBranchName('main')
      .withColorSchema(cs)

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    expect(() => parser.parseInput()).throw(
      'Error: colorSchema = colorschemvaluetoolng value length must be between[0,20]'
    )
  })

  it('test success parsing jekyllTitle', () => {
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch('gh-pages')
      .withTargetFolder('.')
      .withSourceFolder('source')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/source-repository')
      .withActor('username')
      .withTargetDefaultBranch('main')
      .withSourceBranchName('main')
      .withJekyllTitle('jekyll title')

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    const opts = parser.parseInput()

    expect(opts.jekyll_title).eq('jekyll title')
  })

  it('test success parsing domain', () => {
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch('gh-pages')
      .withTargetFolder('.')
      .withSourceFolder('source')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/source-repository')
      .withActor('username')
      .withTargetDefaultBranch('main')
      .withSourceBranchName('main')
      .withDomain('app.io')

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    const opts = parser.parseInput()

    expect(opts.domain).eq('app.io')
  })

  it('test parsing domain validation error', () => {
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch('gh-pages')
      .withTargetFolder('.')
      .withSourceFolder('source')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/source-repository')
      .withActor('username')
      .withTargetDefaultBranch('main')
      .withSourceBranchName('main')
      .withDomain('app.github.io')

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    expect(() => parser.parseInput()).throw(
      'only custom domain must be specified in domain param, if *.github.io used, omit this property'
    )
  })

  it('test parsing success if sourceRepo matches with targetRepo', () => {
    const targetBranch = 'gh-pages'
    const targetDefaultBranch = 'main'
    const sourceRunBranch = 'main'
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch(targetBranch)
      .withTargetFolder('docs')
      .withSourceFolder('source')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/repository')
      .withActor('username')
      .withTargetDefaultBranch(targetDefaultBranch)
      .withSourceBranchName(sourceRunBranch)

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    const opts = parser.parseInput()
    expect(opts.targetBranch).eq('gh-pages')
  })

  it('test parsing success if sourceRepo doesnt match with targetRepo', () => {
    const targetBranch = 'main'
    const targetDefaultBranch = 'main'
    const sourceRunBranch = 'main'
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch(targetBranch)
      .withTargetFolder('.')
      .withSourceFolder('source')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/source-repository')
      .withActor('username')
      .withTargetDefaultBranch(targetDefaultBranch)
      .withSourceBranchName(sourceRunBranch)

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    const opts = parser.parseInput()
    expect(opts.targetBranch).eq('main')
  })

  it('test parsing failure if sourceRepo matches with targetRepo and targetBranch matches with sourceRunBranch', () => {
    const targetBranch = 'branch'
    const targetDefaultBranch = 'main'
    const sourceRunBranch = 'branch'
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch(targetBranch)
      .withTargetFolder('docs')
      .withSourceFolder('source')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/repository')
      .withActor('username')
      .withTargetDefaultBranch(targetDefaultBranch)
      .withSourceBranchName(sourceRunBranch)

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    expect(() => parser.parseInput()).throw(
      `Error: if sourceRepo=username/repository matches with targetRepo=username/repository ` +
        `targetBranch(branch) can't be neither default repository branch nor branch ` +
        `in which workflow were ran: (main,branch)`
    )
  })

  it('test parsing failure if sourceRepo matches with targetRepo and targetBranch matches with targetDefaultBranch', () => {
    const targetBranch = 'branch'
    const targetDefaultBranch = 'branch'
    const sourceRunBranch = 'main'
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch(targetBranch)
      .withTargetFolder('docs')
      .withSourceFolder('source')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/repository')
      .withActor('username')
      .withTargetDefaultBranch(targetDefaultBranch)
      .withSourceBranchName(sourceRunBranch)

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    expect(() => parser.parseInput()).throw(
      `Error: if sourceRepo=username/repository matches with targetRepo=username/repository ` +
        `targetBranch(branch) can't be neither default repository branch nor branch ` +
        `in which workflow were ran: (branch,main)`
    )
  })

  it('test parsing failure if sourceRepo matches with targetRepo and targetBranch matches with both targetDefaultBranch and sourceRunBranch', () => {
    const targetBranch = 'main'
    const targetDefaultBranch = 'main'
    const sourceRunBranch = 'main'
    new InputEnvSetter()
      .withTargetRepo('username/repository')
      .withTargetBranch(targetBranch)
      .withTargetFolder('docs')
      .withSourceFolder('source')
      .withTags('tag')
      .withToken('1')
      .withPublishAll('true')
      .withSourceRepo('username/repository')
      .withActor('username')
      .withTargetDefaultBranch(targetDefaultBranch)
      .withSourceBranchName(sourceRunBranch)

    const parser = new Parser(fsExistsTrue, input, silentLogger)
    expect(() => parser.parseInput()).throw(
      `Error: if sourceRepo=username/repository matches with targetRepo=username/repository ` +
        `targetBranch(main) can't be neither default repository branch nor branch ` +
        `in which workflow were ran: (main)`
    )
  })
})
