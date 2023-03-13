import {Either, left} from 'fp-ts/lib/Either.js'
// eslint-disable-next-line import/no-unresolved
import MDAST from 'mdast'
import * as path from 'node:path'
import * as yml from 'yaml'

import {Opts} from './input'
import {JekyllConf} from './jekyll-config'

const colorSchemas: Set<string> = new Set(['light', 'dark'])

const defaultSiteFooter =
  'This site powered by <a href="https://github.com/just-the-docs/just-the-docs">Just the Docs</a>, a documentation theme for Jekyll and <a href="https://github.com/asstart/obsidian-publish-action">Obsidian Publish Action</a>, a GitHub action for publishing <a href="https://obsidian.md/">Obsidian</a> notes'

export class JTDootConf {
  logo?: string
  favicon_ico?: string
  search_enabled = true
  search?: JTDSearchConf = new JTDSearchConf()
  mermaid?: JTDMermaidConf = new JTDMermaidConf()
  heading_anchors = true
  color_scheme = 'light'
  back_to_top = true
  back_to_top_text = 'Back to top'
  site_footer = defaultSiteFooter
}

export class JTDSearchConf {
  heading_level = 2
  previews = 3
  preview_words_before = 5
  preview_words_after = 10
  // tokenizer_separator = /[\s/]+/.source
  rel_url = true
  button = false
}

export class JTDMermaidConf {
  version?: string = '9.1.3'
}

export function initJTDConf(
  conf: JekyllConf,
  opts: Opts
): Either<JTDootConf, Error> {
  const jtdConf = new JTDootConf()
  if (isValidColorScheme(opts.color_scheme)) {
    jtdConf.color_scheme = opts.color_scheme!
  }
  return left(jtdConf)
}

export function conditionJTD(conf: JekyllConf): boolean {
  return conf.remote_theme === 'asstart/just-the-docs'
}

function isValidColorScheme(cs?: string): boolean {
  // should we fail if wrong scheme?
  if (cs && cs != null && colorSchemas.has(cs)) {
    return true
  }
  return false
}

export function createIndexJTDFmWrapper(
  dirpath: string,
  opts: Opts
): () => MDAST.FrontmatterContent {
  return () => createIndexJTDFm(dirpath, opts)
}

// TODO need to handle cases if more than 5 parents
function createIndexJTDFm(
  dirpath: string,
  opts: Opts
): MDAST.FrontmatterContent {
  const rp = path.relative(opts.sourceDir, dirpath)
  const splitted = rp.split('/')
  return {
    type: 'yaml',
    value: yml.stringify(
      new JTDIndexFm(
        path.basename(dirpath),
        true,
        true,
        'default',
        false,
        false,
        ...splitted.reverse().slice(1)
      )
    )
  }
}

export function createRootIndexJTDFmWrapper(): () => MDAST.FrontmatterContent {
  return () => createRootIndexJTDFm()
}

function createRootIndexJTDFm(): MDAST.FrontmatterContent {
  return {
    type: 'yaml',
    value: yml.stringify(
      new JTDIndexFm(
        'index',
        false,
        false,
        'index',
        true,
        true,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      )
    )
  }
}

class JTDIndexFm {
  title = ''
  has_toc = true
  has_children = true
  layout = 'default'
  nav_exclude = false
  index = false
  parent?: string
  grand_parent?: string
  ggrand_parent?: string
  gggrand_parent?: string
  ggggrand_parent?: string

  constructor(
    title: string,
    has_toc?: boolean,
    has_children?: boolean,
    layout?: string,
    nav_exclude?: boolean,
    isIndex?: boolean,
    parent?: string,
    grand_parent?: string,
    ggrand_parent?: string,
    gggrand_parent?: string,
    ggggrand_parent?: string
  ) {
    this.title = title
    this.has_toc = has_toc ?? this.has_toc
    this.has_children = has_children ?? this.has_children
    this.parent = parent
    this.grand_parent = grand_parent
    this.ggrand_parent = ggrand_parent
    this.gggrand_parent = gggrand_parent
    this.ggggrand_parent = ggggrand_parent
    this.layout = layout ?? this.layout
    this.nav_exclude = nav_exclude ?? this.nav_exclude
    this.index = isIndex ?? this.index
  }
}

export function createChildJTDFmWrapper(
  filepath: string,
  opts: Opts
): () => MDAST.FrontmatterContent {
  return () => createChildJTDFm(filepath, opts)
}

// TODO need to handle cases if more than 5 parents
function createChildJTDFm(
  filepath: string,
  opts: Opts
): MDAST.FrontmatterContent {
  return {
    type: 'yaml',
    value: getChildFm(filepath, opts)
  }
}

function getChildFm(filepath: string, opts: Opts): string {
  if (path.dirname(filepath) === opts.sourceDir) {
    return yml.stringify(
      new JTDChildFm(path.basename(filepath, path.extname(filepath)))
    )
  }
  const rp = path.relative(opts.sourceDir, path.dirname(filepath))
  const splitted = rp.split('/')
  return yml.stringify(
    new JTDChildFm(
      path.basename(filepath, path.extname(filepath)),
      'default',
      ...splitted.reverse()
    )
  )
}

class JTDChildFm {
  title = ''
  layout = 'default'
  parent?: string
  grand_parent?: string
  ggrand_parent?: string
  gggrand_parent?: string
  ggggrand_parent?: string

  constructor(
    title: string,
    layout?: string,
    parent?: string,
    grand_parent?: string,
    ggrand_parent?: string,
    gggrand_parent?: string,
    ggggrand_parent?: string
  ) {
    this.title = title
    this.parent = parent
    this.grand_parent = grand_parent
    this.ggrand_parent = ggrand_parent
    this.gggrand_parent = gggrand_parent
    this.ggggrand_parent = ggggrand_parent
    this.layout = layout ?? this.layout
  }
}
