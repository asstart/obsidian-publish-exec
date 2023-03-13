import {expect} from 'chai'
import * as fc from 'fast-check'
import {describe, it} from 'mocha'

import {Opts, private_optsBuilder} from '../src/input.js'
import {JekyllConfCreator} from '../src/jekyll-config.js'
import {JTDMermaidConf, JTDSearchConf, JTDootConf} from '../src/jtd.js'
import {silentLogger} from '../src/util.js'

describe('jekyll configuration test suite', () => {
  it('test jekyll_conf valid remote-theme inputs', () => {
    const themes = fc.record({
      theme: fc.constantFrom(
        ['just-the-docs', 'asstart/just-the-docs'],
        ['asstart/just-the-docs', 'asstart/just-the-docs']
      )
    })

    fc.assert(
      fc.property(themes, prop => {
        const opts: Opts = new private_optsBuilder(
          {
            exists(path) {
              return true
            }
          },
          silentLogger
        )
          .withSourceDir('/source')
          .withTargetDir('/docs')
          .withTags('tag')
          .withPublishAll(false)
          .withTargetRepo('username/repo')
          .withTargetBranch('branch')
          .withAccessToken('token')
          .withCommitMsg('commit')
          .withActor('username')
          .withJekyllTheme(prop.theme[0])
          .build()

        const jcc = new JekyllConfCreator(
          opts,
          {
            write(fd, string) {
              return 1
            },
            open(path, flags, mode) {
              return 1
            },
            mkdir(p, options) {
              return ''
            }
          },
          silentLogger
        )

        expect(jcc.conf.remote_theme).eq(prop.theme[1])
        expect(jcc.conf.theme).eq(undefined)
        expect(jcc.conf.description).eq(undefined)
        expect(jcc.conf.title).deep.eq(undefined)
        expect(jcc.conf.plugins).contain('jekyll-remote-theme')
      })
    )
  })

  it('test jekyll_conf valid default theme', () => {
    const themes = fc.record({
      theme: fc.constantFrom('', 'just-the-docs')
    })

    fc.assert(
      fc.property(themes, prop => {
        const opts: Opts = new private_optsBuilder(
          {
            exists(path) {
              return true
            }
          },
          silentLogger
        )
          .withSourceDir('/source')
          .withTargetDir('/docs')
          .withTags('tag')
          .withPublishAll(false)
          .withTargetRepo('username/repo')
          .withTargetBranch('branch')
          .withAccessToken('token')
          .withCommitMsg('commit')
          .withActor('username')
          .withJekyllTheme(prop.theme)
          .build()

        const jcc = new JekyllConfCreator(
          opts,
          {
            write(fd, string) {
              return 1
            },
            open(path, flags, mode) {
              return 1
            },
            mkdir(p, options) {
              return ''
            }
          },
          silentLogger
        )
        expect(jcc.conf.remote_theme).eq('asstart/just-the-docs')
        expect(jcc.conf.theme).eq(undefined)
        expect(jcc.conf.description).eq(undefined)
        expect(jcc.conf.title).eq(undefined)
        expect(jcc.conf.plugins).contain('jekyll-remote-theme')
      })
    )
  })

  it('test jekyll_conf invalid theme inputs', () => {
    const themes = fc.record({
      theme: fc.constantFrom(
        'just-the-doc',
        'minim',
        'default',
        '1',
        '0.1.0',
        'pages-themes/architect@badversion',
        'architect@v0.1.0',
        'pages-themes/unsupported-theme@v0.1.0',
        '/pages-themes/architect@v0.2.0',
        'pages-themes/architect@v0.2.0.',
        'pages-themes/architec@v0.2.0'
      )
    })

    fc.assert(
      fc.property(themes, prop => {
        const opts: Opts = new private_optsBuilder(
          {
            exists(path) {
              return true
            }
          },
          silentLogger
        )
          .withSourceDir('/source')
          .withTargetDir('/docs')
          .withTags('tag')
          .withPublishAll(false)
          .withTargetRepo('username/repo')
          .withTargetBranch('branch')
          .withAccessToken('token')
          .withCommitMsg('commit')
          .withActor('username')
          .withJekyllTheme(prop.theme)
          .build()

        expect(
          () =>
            new JekyllConfCreator(
              opts,
              {
                write(fd, string) {
                  return 1
                },
                open(path, flags, mode) {
                  return 1
                },
                mkdir(p, options) {
                  return ''
                }
              },
              silentLogger
            )
        ).throw(Error)
      })
    )
  })

  it('test jekyll_conf title', () => {
    const title = 'title'
    const opts: Opts = new private_optsBuilder(
      {
        exists(path) {
          return true
        }
      },
      silentLogger
    )
      .withSourceDir('/source')
      .withTargetDir('/docs')
      .withTags('tag')
      .withPublishAll(false)
      .withTargetRepo('username/repo')
      .withTargetBranch('branch')
      .withAccessToken('token')
      .withCommitMsg('commit')
      .withActor('username')
      .withJekyllTitle(title)
      .build()

    const jcc = new JekyllConfCreator(
      opts,
      {
        write(fd, string) {
          return 1
        },
        open(path, flags, mode) {
          return 1
        },
        mkdir(p, options) {
          return ''
        }
      },
      silentLogger
    )
    expect(jcc.conf.title).eq('title')
    expect(jcc.conf.description).eq(undefined)
    expect(jcc.conf.theme).eq(undefined)
    expect(jcc.conf.remote_theme).eq('asstart/just-the-docs')
    expect(jcc.conf.plugins).contain('jekyll-remote-theme')
  })

  it('test jekyll_conf description', () => {
    const description = 'some description'
    const opts: Opts = new private_optsBuilder(
      {
        exists(path) {
          return true
        }
      },
      silentLogger
    )
      .withSourceDir('/source')
      .withTargetDir('/docs')
      .withTags('tag')
      .withPublishAll(false)
      .withTargetRepo('username/repo')
      .withTargetBranch('branch')
      .withAccessToken('token')
      .withCommitMsg('commit')
      .withActor('username')
      .withJekyllDescription(description)
      .build()

    const jcc = new JekyllConfCreator(
      opts,
      {
        write(fd, string) {
          return 1
        },
        open(path, flags, mode) {
          return 1
        },
        mkdir(p, options) {
          return ''
        }
      },
      silentLogger
    )
    expect(jcc.conf.title).eq(undefined)
    expect(jcc.conf.description).eq('some description')
    expect(jcc.conf.theme).eq(undefined)
    expect(jcc.conf.remote_theme).eq('asstart/just-the-docs')
    expect(jcc.conf.plugins).contain('jekyll-remote-theme')
  })

  it('test jekyll_conf baseurl', () => {
    const opts: Opts = new private_optsBuilder(
      {
        exists(path) {
          return true
        }
      },
      silentLogger
    )
      .withSourceDir('/source')
      .withTargetDir('/docs')
      .withTags('tag')
      .withPublishAll(false)
      .withTargetRepo('username/repo')
      .withTargetBranch('branch')
      .withAccessToken('token')
      .withCommitMsg('commit')
      .withActor('username')
      .build()

    const jcc = new JekyllConfCreator(
      opts,
      {
        write(fd, string) {
          return 1
        },
        open(path, flags, mode) {
          return 1
        },
        mkdir(p, options) {
          return ''
        }
      },
      silentLogger
    )
    expect(jcc.conf.title).eq(undefined)
    expect(jcc.conf.description).eq(undefined)
    expect(jcc.conf.theme).eq(undefined)
    expect(jcc.conf.remote_theme).eq('asstart/just-the-docs')
    expect(jcc.conf.plugins).contain('jekyll-remote-theme')
    expect(jcc.conf.baseurl).eq('/repo')
  })

  it('test jekyll_conf domain', () => {
    const opts: Opts = new private_optsBuilder(
      {
        exists(path) {
          return true
        }
      },
      silentLogger
    )
      .withSourceDir('/source')
      .withTargetDir('/docs')
      .withTags('tag')
      .withPublishAll(false)
      .withTargetRepo('username/repo')
      .withTargetBranch('branch')
      .withAccessToken('token')
      .withCommitMsg('commit')
      .withActor('username')
      .withDomain('app.io')
      .build()

    const jcc = new JekyllConfCreator(
      opts,
      {
        write(fd, string) {
          return 1
        },
        open(path, flags, mode) {
          return 1
        },
        mkdir(p, options) {
          return ''
        }
      },
      silentLogger
    )
    expect(jcc.conf.title).eq(undefined)
    expect(jcc.conf.description).eq(undefined)
    expect(jcc.conf.theme).eq(undefined)
    expect(jcc.conf.remote_theme).eq('asstart/just-the-docs')
    expect(jcc.conf.plugins).contain('jekyll-remote-theme')
    expect(jcc.conf.baseurl).undefined
    expect(jcc.conf.domain).eq('app.io')
  })

  it('jtd default JTDRootConf filled if theme=just-the-docs', () => {
    const opts: Opts = new private_optsBuilder(
      {
        exists(path) {
          return true
        }
      },
      silentLogger
    )
      .withSourceDir('/source')
      .withTargetDir('/docs')
      .withTags('tag')
      .withPublishAll(false)
      .withTargetRepo('username/repo')
      .withTargetBranch('branch')
      .withAccessToken('token')
      .withCommitMsg('commit')
      .withActor('username')
      .build()

    const jcc = new JekyllConfCreator(
      opts,
      {
        write(fd, string) {
          return 1
        },
        open(path, flags, mode) {
          return 1
        },
        mkdir(p, options) {
          return ''
        }
      },
      silentLogger
    )
    expect(jcc.conf.title).eq(undefined)
    expect(jcc.conf.description).eq(undefined)
    expect(jcc.conf.theme).eq(undefined)
    expect(jcc.conf.remote_theme).eq('asstart/just-the-docs')
    expect(jcc.conf.plugins).contain('jekyll-remote-theme')
    expect(jcc.conf.baseurl).eq('/repo')
    expect(jcc.conf.dependentConfigs.length).eq(1)
    expect(jcc.conf.dependentConfigs[0]).to.be.instanceOf(JTDootConf)
    const dc = jcc.conf.dependentConfigs[0] as JTDootConf
    expect(dc.color_scheme).eq('light')
    expect(dc.favicon_ico).eq(undefined)
    expect(dc.logo).eq(undefined)
    expect(dc.heading_anchors).eq(true)
    expect(dc.search_enabled).eq(true)
    expect(dc.mermaid).to.be.instanceOf(JTDMermaidConf)
    const mc = dc.mermaid as JTDMermaidConf
    expect(mc.version).eq('9.1.3')
    expect(dc.search).to.be.instanceOf(JTDSearchConf)
    const sc = dc.search as JTDSearchConf
    expect(sc.button).eq(false)
    expect(sc.rel_url).eq(true)
    // expect(sc.tokenizer_separator).toEqual(`[\\s/]+`)
    expect(sc.preview_words_after).eq(10)
    expect(sc.preview_words_before).eq(5)
    expect(sc.previews).eq(3)
    expect(sc.heading_level).eq(2)
  })

  it('jtd custom JTDRootConf filled if theme=just-the-docs', () => {
    const opts: Opts = new private_optsBuilder(
      {
        exists(path) {
          return true
        }
      },
      silentLogger
    )
      .withSourceDir('/source')
      .withTargetDir('/docs')
      .withTags('tag')
      .withPublishAll(false)
      .withTargetRepo('username/repo')
      .withTargetBranch('branch')
      .withAccessToken('token')
      .withCommitMsg('commit')
      .withActor('username')
      .withColorSchema('dark')
      .build()

    const jcc = new JekyllConfCreator(
      opts,
      {
        write(fd, string) {
          return 1
        },
        open(path, flags, mode) {
          return 1
        },
        mkdir(p, options) {
          return ''
        }
      },
      silentLogger
    )
    expect(jcc.conf.title).eq(undefined)
    expect(jcc.conf.description).eq(undefined)
    expect(jcc.conf.theme).eq(undefined)
    expect(jcc.conf.remote_theme).eq('asstart/just-the-docs')
    expect(jcc.conf.plugins).contain('jekyll-remote-theme')
    expect(jcc.conf.baseurl).eq('/repo')
    expect(jcc.conf.dependentConfigs.length).eq(1)
    expect(jcc.conf.dependentConfigs[0]).to.be.instanceOf(JTDootConf)
    const dc = jcc.conf.dependentConfigs[0] as JTDootConf
    expect(dc.color_scheme).eq('dark')
    expect(dc.favicon_ico).eq(undefined)
    expect(dc.logo).eq(undefined)
    expect(dc.heading_anchors).eq(true)
    expect(dc.search_enabled).eq(true)
    expect(dc.mermaid).to.be.instanceOf(JTDMermaidConf)
    const mc = dc.mermaid as JTDMermaidConf
    expect(mc.version).eq('9.1.3')
    expect(dc.search).to.be.instanceOf(JTDSearchConf)
    const sc = dc.search as JTDSearchConf
    expect(sc.button).eq(false)
    expect(sc.rel_url).eq(true)
    // expect(sc.tokenizer_separator).toEqual(`[\\s/]+`)
    expect(sc.preview_words_after).eq(10)
    expect(sc.preview_words_before).eq(5)
    expect(sc.previews).eq(3)
    expect(sc.heading_level).eq(2)
  })

  it('test stringify JekyllConf with baseurl', () => {
    const opts: Opts = new private_optsBuilder(
      {
        exists(path) {
          return true
        }
      },
      silentLogger
    )
      .withSourceDir('/source')
      .withTargetDir('/docs')
      .withTags('tag')
      .withPublishAll(false)
      .withTargetRepo('username/repo')
      .withTargetBranch('branch')
      .withAccessToken('token')
      .withCommitMsg('commit')
      .withActor('username')
      .build()

    const jcc = new JekyllConfCreator(
      opts,
      {
        write(fd, string) {
          return 1
        },
        open(path, flags, mode) {
          return 1
        },
        mkdir(p, options) {
          return ''
        }
      },
      silentLogger
    )

    const expectedYml = `plugins:
  - jekyll-seo-tag
  - jekyll-remote-theme
remote_theme: asstart/just-the-docs
baseurl: /repo
search_enabled: true
search:
  heading_level: 2
  previews: 3
  preview_words_before: 5
  preview_words_after: 10
  rel_url: true
  button: false
mermaid:
  version: 9.1.3
heading_anchors: true
color_scheme: light
back_to_top: true
back_to_top_text: Back to top
site_footer: This site powered by <a href="https://github.com/just-the-docs/just-the-docs">Just the Docs</a>, a documentation theme for Jekyll and <a href="https://github.com/asstart/obsidian-publish-action">Obsidian Publish Action</a>, a GitHub action for publishing <a href="https://obsidian.md/">Obsidian</a> notes
`

    expect(jcc.conf.stringify()).eq(expectedYml)
  })

  it('test stringify JekyllConf with gh url', () => {
    const opts: Opts = new private_optsBuilder(
      {
        exists(path) {
          return true
        }
      },
      silentLogger
    )
      .withSourceDir('/source')
      .withTargetDir('/docs')
      .withTags('tag')
      .withPublishAll(false)
      .withTargetRepo('username/repo')
      .withTargetBranch('branch')
      .withAccessToken('token')
      .withCommitMsg('commit')
      .withActor('username')
      .withDomain('app.io')
      .build()

    const jcc = new JekyllConfCreator(
      opts,
      {
        write(fd, string) {
          return 1
        },
        open(path, flags, mode) {
          return 1
        },
        mkdir(p, options) {
          return ''
        }
      },
      silentLogger
    )

    const expectedYml = `plugins:
  - jekyll-seo-tag
  - jekyll-remote-theme
remote_theme: asstart/just-the-docs
domain: app.io
search_enabled: true
search:
  heading_level: 2
  previews: 3
  preview_words_before: 5
  preview_words_after: 10
  rel_url: true
  button: false
mermaid:
  version: 9.1.3
heading_anchors: true
color_scheme: light
back_to_top: true
back_to_top_text: Back to top
site_footer: This site powered by <a href="https://github.com/just-the-docs/just-the-docs">Just the Docs</a>, a documentation theme for Jekyll and <a href="https://github.com/asstart/obsidian-publish-action">Obsidian Publish Action</a>, a GitHub action for publishing <a href="https://obsidian.md/">Obsidian</a> notes
`

    expect(jcc.conf.stringify()).eq(expectedYml)
  })
})
