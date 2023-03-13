import {config, expect} from 'chai'
import * as fc from 'fast-check'
// eslint-disable-next-line import/no-unresolved
import MDAST from 'mdast'
import {describe, it} from 'mocha'
import * as path from 'node:path'
import * as yml from 'yaml'

import {Opts, private_optsBuilder} from '../src/input.js'
import {
  createChildJTDFmWrapper,
  createIndexJTDFmWrapper,
  createRootIndexJTDFmWrapper
} from '../src/jtd.js'
import {silentLogger} from '../src/util.js'

describe('Just The Doc test suite', () => {
  config.truncateThreshold = 1000
  const fcVerboseLevel = 1

  const fsExistsTrue = {
    exists(path: string) {
      return true
    }
  }

  const optsBuilderTmp = new private_optsBuilder(fsExistsTrue, silentLogger)
    .withTargetDir('docs')
    .withTags('tag')
    .withTargetRepo('user/repo')
    .withTargetBranch('gh-pages')
    .withAccessToken('tkn')
    .withCommitMsg('test commit')
    .withActor('user')

  it('test createIndexJTDFmWrapper', () => {
    class TestCase {
      sourceDir: string
      fileDir: string
      expected: MDAST.FrontmatterContent

      constructor(
        sourceDir: string,
        fileDir: string,
        expected: MDAST.FrontmatterContent
      ) {
        this.sourceDir = sourceDir
        this.fileDir = fileDir
        this.expected = expected
      }
    }

    const testdata = fc.record({
      data: fc.constantFrom(
        new TestCase(
          'randomsourcedirname/',
          path.resolve('source/randomsourcedirname/f1'),
          {
            type: 'yaml',
            value: yml.stringify({
              title: 'f1',
              has_toc: true,
              has_children: true,
              layout: 'default',
              nav_exclude: false,
              index: false
            })
          }
        ),
        new TestCase(
          'randomsourcedirname/',
          path.resolve('source/randomsourcedirname/f1/f2/f3/f4/f5/f6'),
          {
            type: 'yaml',
            value: yml.stringify({
              title: 'f6',
              has_toc: true,
              has_children: true,
              layout: 'default',
              nav_exclude: false,
              index: false,
              parent: 'f5',
              grand_parent: 'f4',
              ggrand_parent: 'f3',
              gggrand_parent: 'f2',
              ggggrand_parent: 'f1'
            })
          }
        )
      )
    })

    fc.assert(
      fc.property(testdata, prop => {
        const opts: Opts = optsBuilderTmp
          .withSourceDir(prop.data.sourceDir)
          .build()

        const yaml = createIndexJTDFmWrapper(prop.data.fileDir, opts)()

        expect(yaml).to.be.deep.eq(prop.data.expected)
      }),
      {verbose: fcVerboseLevel}
    )
  })

  it('test createRootIndexJTDFmWrapper', () => {
    const expected = {
      type: 'yaml',
      value: yml.stringify({
        title: 'index',
        has_toc: false,
        has_children: false,
        layout: 'index',
        nav_exclude: true,
        index: true
      })
    }
    const yaml = createRootIndexJTDFmWrapper()()

    expect(yaml).to.be.deep.eq(expected)
  })

  it('test createChildJTDFmWrapper', () => {
    class TestCase {
      sourceDir: string
      filepath: string
      expected: MDAST.FrontmatterContent

      constructor(
        sourceDir: string,
        fileDir: string,
        expected: MDAST.FrontmatterContent
      ) {
        this.sourceDir = sourceDir
        this.filepath = fileDir
        this.expected = expected
      }
    }

    const testdata = fc.record({
      data: fc.constantFrom(
        new TestCase(
          'randomsourcedirname/',
          path.resolve('source/randomsourcedirname/file.md'),
          {
            type: 'yaml',
            value: yml.stringify({
              title: 'file',
              layout: 'default'
            })
          }
        ),
        new TestCase(
          'randomsourcedirname/',
          path.resolve('source/randomsourcedirname/f1/file.md'),
          {
            type: 'yaml',
            value: yml.stringify({
              title: 'file',
              layout: 'default',
              parent: 'f1'
            })
          }
        ),
        new TestCase(
          'randomsourcedirname/',
          path.resolve('source/randomsourcedirname/f1/f2/f3/f4/f5/file.md'),
          {
            type: 'yaml',
            value: yml.stringify({
              title: 'file',
              layout: 'default',
              parent: 'f5',
              grand_parent: 'f4',
              ggrand_parent: 'f3',
              gggrand_parent: 'f2',
              ggggrand_parent: 'f1'
            })
          }
        )
      )
    })

    fc.assert(
      fc.property(testdata, prop => {
        const opts: Opts = optsBuilderTmp
          .withSourceDir(prop.data.sourceDir)
          .build()

        const yaml = createChildJTDFmWrapper(prop.data.filepath, opts)()

        expect(yaml).to.be.deep.eq(prop.data.expected)
      }),
      {verbose: fcVerboseLevel}
    )
  })
})
