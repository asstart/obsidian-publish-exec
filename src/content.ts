import {Either, left, match, right} from 'fp-ts/lib/Either.js'
import {pipe} from 'fp-ts/lib/function.js'
// eslint-disable-next-line import/no-unresolved
import MDAST, {Heading} from 'mdast'
import * as path from 'node:path'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
// eslint-disable-next-line import/named
import {Processor, unified} from 'unified'
import {u} from 'unist-builder'
import {visit} from 'unist-util-visit'

import wikiLinkWithEmbeddingsPlugin from '../src/embedding/embedding-wikilink.js'
import {Opts} from './input.js'

export const cleanupFrontMatter =
  () =>
  (tree: MDAST.Root): void => {
    visit(tree, node => {
      if (node.type === 'yaml') {
        node.value = ''
      }
    })
  }

export const wikiLinkToMdLink = () => (tree: MDAST.Root) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visit(tree, (node: any) => {
    if (
      node.type === 'wikiLink' &&
      (!node.isType ||
        !(node.isType === 'embedding') ||
        !(node.embedType === 'img'))
    ) {
      const nnode = u(
        'link',
        {
          url: encodeURI(node.value),
          isType: node.isType,
          data: null,
          value: null
        },
        [
          u('text', {
            value: node.data ? node.data.alias : node.value
          })
        ]
      )
      Object.assign(node, nnode)
    }
  })
}

export const wikiLinkToMdImage = () => (tree: MDAST.Root) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visit(tree, (node: any) => {
    if (
      node.type === 'wikiLink' &&
      node.isType === 'embedding' &&
      node.embedType === 'img'
    ) {
      const nnode = u('image', {
        url: encodeURI(node.value),
        isType: node.isType,
        data: null,
        value: null,
        alt: node.data ? node.data.alias : node.value
      })
      Object.assign(node, nnode)
    }
  })
}

// TODO
// this merge is dumb, doesn't validate output yaml
// and possibly can produce yaml with a duplicate keys
// not really actual for my use cases, but it's better to fix
export const mergeFrontMatter = (fmNode: () => MDAST.FrontmatterContent) => {
  return () =>
    (tree: MDAST.Root): void => {
      const toMerge = fmNode().value
      if (toMerge === undefined || toMerge.trim() === '') {
        return
      }

      let merged = false
      visit(tree, node => {
        if (node.type === 'yaml') {
          merged = true
          const nnode = u('yaml', {
            value: `${node.value}\n${toMerge}`
          })
          Object.assign(node, nnode)
        }
      })

      if (!merged) {
        visit(tree, node => {
          if (node.type === 'root') {
            const fm = fmNode()
            if (node.children) {
              node.children = [fm, ...node.children]
            } else {
              node.children = [fm]
            }
          }
        })
      }
    }
}

export const setupNewFrontMatter = (fmNode: () => MDAST.FrontmatterContent) => {
  return () =>
    (tree: MDAST.Root): void => {
      visit(tree, node => {
        if (node.type === 'root') {
          const fm = fmNode()
          if (node.children) {
            node.children = [fm, ...node.children]
          } else {
            node.children = [fm]
          }
        }
      })
    }
}

export const setup404Content = () => {
  return () =>
    (tree: MDAST.Root): void => {
      visit(tree, node => {
        if (node.type === 'root') {
          const h: Heading = u('heading', {
            depth: 1 as const,
            children: [
              u('text', {
                value: 'Page Not Found'
              })
            ]
          })

          if (node.children) {
            node.children = [...node.children, h]
          } else {
            node.children = [h]
          }
        }
      })
    }
}

export const resolveObsidianLink = (
  curr: string,
  root: string,
  store: string[],
  resolveLink: (
    url: string,
    currdir: string,
    rootdir: string
  ) => Either<string, undefined>,
  baseUrl?: string
) => {
  return () =>
    (tree: MDAST.Root): void => {
      visit(tree, node => {
        if (node.type === 'link' || node.type === 'image') {
          pipe(
            resolveLink(decodeURI(node.url), curr, root),
            match(
              (l: string) => {
                const ism = isMedia(node)
                if (ism) {
                  store.push(l)
                }

                if (!baseUrl) {
                  node.url = encodeURI(formatLink(l, root, ism))
                } else {
                  const resUrl = `${baseUrl}${
                    l.startsWith('/') ? '' : '/'
                  }${formatLink(l, root, ism)}`
                  node.url = encodeURI(resUrl)
                }
              },
              () => {}
            )
          )
        }
      })
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isMedia(node: any): boolean {
  return node.type === 'image' || (node.isType && node.isType === 'embedding')
}

function formatInternalLink(link: string, root: string): string {
  const res = path.relative(root, link)
  const formatted = res.replace(/\.\w+$/, '')
  return `/${formatted}`
}

function formatEmbeddingLink(link: string, root: string): string {
  return `/${path.relative(root, link)}`
}

function formatLink(link: string, root: string, ismedia: boolean): string {
  return ismedia
    ? formatEmbeddingLink(link, root)
    : formatInternalLink(link, root)
}

export function getContentProcessor(
  opts: Opts,
  processors: ((tree: MDAST.Root) => void)[],
  filters: ((s: string, o: Opts) => boolean)[]
): ContentProcessor {
  const proc = unified()
    .use(remarkGfm)
    .use(remarkParse)
    .use(remarkStringify)
    .use(remarkFrontmatter, {
      type: 'yaml',
      marker: {open: '-', close: '-'},
      anywhere: false
    })
    .use(wikiLinkWithEmbeddingsPlugin, {aliasDivider: '|'})
    .use(processors)

  return new ContentProcessor(proc, opts, filters)
}

export class Content {
  content = ''

  constructor(content: string) {
    this.content = content
  }
}

export class ContentProcessor {
  uf: Processor = unified()
  opts: Opts = new Opts()

  // possibly will be replaced with additional plugin for processor
  filters: ((s: string, o: Opts) => boolean)[] = [() => true]

  constructor(
    processor: Processor,
    opts: Opts,
    filters: ((s: string, o: Opts) => boolean)[]
  ) {
    this.uf = processor
    this.filters = filters
    this.opts = opts
  }

  async process(content: string): Promise<Either<Content, undefined>> {
    const fr = this.filter(content)
    if (!fr) {
      return right(undefined)
    }

    const pr = await this.uf.process(content)

    return left(new Content(String(pr)))
  }

  filter(content: string): boolean {
    for (const f of this.filters) {
      if (!f(content, this.opts)) {
        return false
      }
    }
    return true
  }
}
