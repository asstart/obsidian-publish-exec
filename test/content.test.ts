import {expect} from 'chai'
import * as fc from 'fast-check'
import {createFsFromVolume, fs, vol} from 'memfs'
import {describe, it} from 'mocha'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import {Processor, unified} from 'unified'

import {
  cleanupFrontMatter,
  getContentProcessor,
  mergeFrontMatter,
  setup404Content,
  wikiLinkToMdImage,
  wikiLinkToMdLink
} from '../src/content.js'
import {resolveObsidianLink} from '../src/content.js'
import wikiLinkWithEmbeddingsPlugin from '../src/embedding/embedding-wikilink.js'
import {getLinkResolver} from '../src/relink.js'
import {silentLogger} from '../src/util.js'

describe('test content', () => {
  class TranformationTestCase {
    input: string
    expected: string

    constructor(input: string, expected: string) {
      this.input = input
      this.expected = expected
    }
  }

  it('test cleanupFrontMatter plugin', () => {
    const testdata = fc.record({
      content: fc.constantFrom(
        new TranformationTestCase('# No front-matter', '# No front-matter\n'),
        new TranformationTestCase(
          '---\n---\n# Empty front-matter',
          '---\n---\n\n# Empty front-matter\n'
        ),
        new TranformationTestCase(
          '---\n\n\n\n---\n# Empty front-matter with spaces',
          '---\n---\n\n# Empty front-matter with spaces\n'
        ),
        new TranformationTestCase(
          '---\nkey: value\n---\n# Non-empty front-matter',
          '---\n---\n\n# Non-empty front-matter\n'
        )
      )
    })

    const processor = unified()
      .use(remarkGfm)
      .use(remarkParse)
      .use(remarkStringify)
      .use(remarkFrontmatter, {
        type: 'yaml',
        marker: {open: '-', close: '-'},
        anywhere: false
      })
      .use(cleanupFrontMatter)

    fc.assert(
      fc.property(testdata, prop => {
        expect(String(processor.processSync(prop.content.input))).to.be.eq(
          prop.content.expected
        )
      })
    )
  })

  it('test wikiLinkToMdLink plugin', () => {
    const testdata = fc.record({
      content: fc.constantFrom(
        new TranformationTestCase(
          '[[Nospacelink]]',
          '[Nospacelink](Nospacelink)'
        ),
        new TranformationTestCase(
          '[[Link without alias]]',
          '[Link without alias](Link%20without%20alias)'
        ),
        new TranformationTestCase('[[Link|Alias]]', '[Alias](Link)'),
        new TranformationTestCase(
          '[[Link|Alias1|Alias2]]',
          '[Alias1|Alias2](Link)'
        ),
        new TranformationTestCase(
          '[[Link|НЕ ASCII Алиас]]',
          '[НЕ ASCII Алиас](Link)'
        ),
        new TranformationTestCase(
          '[[Не ASCII ссылка|Alias]]',
          '[Alias](%D0%9D%D0%B5%20ASCII%20%D1%81%D1%81%D1%8B%D0%BB%D0%BA%D0%B0)'
        ),
        new TranformationTestCase(
          '![[Embeddinglink.jpg]]',
          '[[Embeddinglink.jpg]]'
        ),
        new TranformationTestCase(
          '![[Embeddinglink.pdf]]',
          '[Embeddinglink.pdf](Embeddinglink.pdf)'
        ),
        new TranformationTestCase(
          '![[Embeddinglink.pdf|Alias]]',
          '[Alias](Embeddinglink.pdf)'
        )
      )
    })

    const processor = unified()
      .use(remarkGfm)
      .use(remarkParse)
      .use(remarkStringify)
      .use(wikiLinkWithEmbeddingsPlugin, {aliasDivider: '|'})
      .use(wikiLinkToMdLink)

    fc.assert(
      fc.property(testdata, prop => {
        expect(
          String(processor.processSync(prop.content.input)).trim()
        ).to.be.eq(prop.content.expected)
      })
    )
  })

  it('test wikiLinkToMdImage plugin', () => {
    const testdata = fc.record({
      content: fc.constantFrom(
        new TranformationTestCase('[[Justlink]]', '[[Justlink]]'),
        new TranformationTestCase(
          '![[Embeddinglink.pdf|Alias]]',
          '[[Embeddinglink.pdf|Alias]]'
        ),
        new TranformationTestCase(
          '![[Embeddinglink.jpg]]',
          '![Embeddinglink.jpg](Embeddinglink.jpg)'
        ),
        new TranformationTestCase(
          '![[Embeddinglink.jpg|Alias]]',
          '![Alias](Embeddinglink.jpg)'
        ),
        new TranformationTestCase(
          '![[Embedding link.jpg|Alias]]',
          '![Alias](Embedding%20link.jpg)'
        ),
        new TranformationTestCase(
          '![[не ascii ссылка.jpg|Alias]]',
          '![Alias](%D0%BD%D0%B5%20ascii%20%D1%81%D1%81%D1%8B%D0%BB%D0%BA%D0%B0.jpg)'
        ),
        new TranformationTestCase(
          '![[Embeddinglink.jpg|не ascii алиас]]',
          '![не ascii алиас](Embeddinglink.jpg)'
        )
      )
    })

    const processor = unified()
      .use(remarkGfm)
      .use(remarkParse)
      .use(remarkStringify)
      .use(wikiLinkWithEmbeddingsPlugin, {aliasDivider: '|'})
      .use(wikiLinkToMdImage)

    fc.assert(
      fc.property(testdata, prop => {
        expect(
          String(processor.processSync(prop.content.input)).trim()
        ).to.be.eq(prop.content.expected)
      })
    )
  })

  it('test mergeFrontMatter plugin', () => {
    class TC {
      input: string
      toMerge: string
      expected: string

      constructor(source: string, toMerge: string, expected: string) {
        this.input = source
        this.toMerge = toMerge
        this.expected = expected
      }
    }

    const testdata = fc.record({
      content: fc.constantFrom(
        new TC('', '', ''),
        new TC('', '\n', ''),
        new TC('', ' ', ''),
        new TC('---\n---', '', '---\n---'),
        new TC('---\n---', '\n', '---\n---'),
        new TC('---\n---', ' ', '---\n---'),
        new TC(
          '---\nkey1:value1\n---',
          'key2:value2',
          '---\nkey1:value1\nkey2:value2\n---'
        ),
        new TC(
          '---\nkey1:value1\n---',
          'key1:value2',
          '---\nkey1:value1\nkey1:value2\n---'
        ),
        new TC('# No FM', '', '# No FM'),
        new TC(
          '# No FM in source',
          'key:value',
          '---\nkey:value\n---\n\n# No FM in source'
        )
      )
    })

    fc.assert(
      fc.property(testdata, prop => {
        const processor = unified()
          .use(remarkGfm)
          .use(remarkParse)
          .use(remarkStringify)
          .use(remarkFrontmatter, {
            type: 'yaml',
            marker: {open: '-', close: '-'},
            anywhere: false
          })
          .use(
            mergeFrontMatter(() => {
              return {type: 'yaml', value: prop.content.toMerge}
            })
          )

        expect(
          String(processor.processSync(prop.content.input)).trim()
        ).to.be.eq(prop.content.expected)
      })
    )
  })

  it('test setup404Content plugin', () => {
    const processor = unified()
      .use(remarkGfm)
      .use(remarkParse)
      .use(remarkStringify)
      .use(setup404Content())

    const input = ''
    expect(String(processor.processSync(input)).trim()).to.be.eq(
      '# Page Not Found'
    )
  })

  it('test resolveObsidianLink plugin', () => {
    class ExtractionTranformationTestCase {
      baseurl: string | undefined
      input: string
      files: string[]
      expected: string
      extracted: string[]

      constructor(
        input: string,
        files: string[],
        expected: string,
        extracted: string[],
        baseUrl: string | undefined
      ) {
        this.input = input
        ;(this.files = files), (this.expected = expected)
        this.extracted = extracted
        this.baseurl = baseUrl
      }
    }

    const testdata = fc.record({
      content: fc.constantFrom(
        new ExtractionTranformationTestCase(
          '# No links',
          [],
          '# No links',
          [],
          undefined
        ),
        new ExtractionTranformationTestCase(
          '# Single internal link\n[Link Alias](/single_link)',
          ['single_link.md'],
          '# Single internal link\n\n[Link Alias](/single_link)',
          [],
          undefined
        ),
        new ExtractionTranformationTestCase(
          '# Single internal link\n[Link Alias](single_link)',
          ['single_link.md'],
          '# Single internal link\n\n[Link Alias](/single_link)',
          [],
          undefined
        ),
        new ExtractionTranformationTestCase(
          '# Single internal link\n[Link Alias](/single_link.md)',
          ['single_link.md'],
          '# Single internal link\n\n[Link Alias](/single_link)',
          [],
          undefined
        ),
        new ExtractionTranformationTestCase(
          '# Single internal link\n[Link Alias](single_link.md)',
          ['single_link.md'],
          '# Single internal link\n\n[Link Alias](/single_link)',
          [],
          undefined
        ),
        new ExtractionTranformationTestCase(
          '# Single internal link\n[Link Alias](/single_link)',
          ['single_link.md'],
          '# Single internal link\n\n[Link Alias](/some_base_url/single_link)',
          [],
          '/some_base_url'
        ),
        new ExtractionTranformationTestCase(
          '# Single internal link\n[Link Alias](single_link)',
          ['single_link.md'],
          '# Single internal link\n\n[Link Alias](/some_base_url/single_link)',
          [],
          '/some_base_url'
        ),
        new ExtractionTranformationTestCase(
          '# Multiple internal links\n[Link Alias 1](/single_link_1)\n[Link Alias 2](/single_link_2)',
          ['single_link_1.md', 'single_link_2.md'],
          '# Multiple internal links\n\n[Link Alias 1](/single_link_1)\n[Link Alias 2](/single_link_2)',
          [],
          undefined
        ),
        new ExtractionTranformationTestCase(
          '# Multiple internal links\n[Link Alias 1](/single_link_1)\n[Link Alias 2](/single_link_2)',
          ['single_link_1.md', 'single_link_2.md'],
          '# Multiple internal links\n\n[Link Alias 1](/some_base_url/single_link_1)\n[Link Alias 2](/some_base_url/single_link_2)',
          [],
          '/some_base_url'
        ),
        new ExtractionTranformationTestCase(
          '# External link\n[Link Alias 1](http://github.com)\n[Link Alias 2](http://github.com)',
          [],
          '# External link\n\n[Link Alias 1](http://github.com)\n[Link Alias 2](http://github.com)',
          [],
          undefined
        ),
        new ExtractionTranformationTestCase(
          '# External link\n[Link Alias 1](http://github.com)\n[Link Alias 2](http://github.com)',
          [],
          '# External link\n\n[Link Alias 1](http://github.com)\n[Link Alias 2](http://github.com)',
          [],
          '/some_base_url'
        ),
        new ExtractionTranformationTestCase(
          '# Single image link\n![Img Alias](/image.jpg)',
          ['image.jpg'],
          '# Single image link\n\n![Img Alias](/image.jpg)',
          ['/image.jpg'],
          undefined
        ),
        new ExtractionTranformationTestCase(
          '# Single image link\n![Img Alias](image.jpg)',
          ['image.jpg'],
          '# Single image link\n\n![Img Alias](/image.jpg)',
          ['/image.jpg'],
          undefined
        ),
        new ExtractionTranformationTestCase(
          '# Single image link\n![Img Alias](/image.jpg)',
          ['image.jpg'],
          '# Single image link\n\n![Img Alias](/some_base_url/image.jpg)',
          ['/image.jpg'],
          '/some_base_url'
        ),
        new ExtractionTranformationTestCase(
          '# Single image link\n![Img Alias](image.jpg)',
          ['image.jpg'],
          '# Single image link\n\n![Img Alias](/some_base_url/image.jpg)',
          ['/image.jpg'],
          '/some_base_url'
        )
      )
    })

    fc.assert(
      fc.property(testdata, prop => {
        const store: string[] = []

        const json: any = {}
        for (const file of prop.content.files) {
          json[file] = '# HW'
        }
        vol.fromJSON(json, '/')

        const processor = unified()
          .use(remarkGfm)
          .use(remarkParse)
          .use(remarkStringify)
          .use(
            resolveObsidianLink(
              '/',
              '/',
              store,
              getLinkResolver(silentLogger, createFsFromVolume(vol)),
              prop.content.baseurl
            )
          )

        const processed = processor.processSync(prop.content.input)

        expect(String(processed).trim()).to.be.eq(prop.content.expected)
        expect(store).to.has.members(prop.content.extracted)

        vol.reset()
      })
    )
  })
})
