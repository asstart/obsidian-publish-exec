import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as glob from '@actions/glob'
import * as io from '@actions/io'
import {match} from 'fp-ts/lib/Either.js'
import {pipe} from 'fp-ts/lib/function.js'
import fm from 'front-matter'
import * as fs from 'node:fs'
import * as path from 'node:path'

import {create404Wrapper} from './404.js'
import {
  Content,
  cleanupFrontMatter,
  getContentProcessor,
  mergeFrontMatter,
  resolveObsidianLink,
  setup404Content,
  setupNewFrontMatter,
  wikiLinkToMdImage,
  wikiLinkToMdLink
} from './content.js'
import {FS, Input, Opts, Parser} from './input.js'
import {ConfWriter, JekyllConfCreator} from './jekyll-config.js'
import {
  createChildJTDFmWrapper,
  createIndexJTDFmWrapper,
  createRootIndexJTDFmWrapper
} from './jtd.js'
import {Exec, IO, PublisherDiffRepo, PublisherSameRepo} from './publish.js'
import {getLinkResolver} from './relink.js'
import {Log} from './util.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmi = fm as any

function getFS(): FS {
  return {
    exists(_path: string) {
      return fs.existsSync(_path)
    }
  }
}

function getInput(): Input {
  return {
    getInput(name, options) {
      return core.getInput(name, options)
    },
    getBooleanInput(name, options) {
      return core.getBooleanInput(name, options)
    }
  }
}

function getGHActionsLogger(): Log {
  return {
    debug(msg) {
      core.debug(msg)
    },
    warn(msg) {
      core.warning(msg)
    }
  }
}

function getConfWriter(): ConfWriter {
  return {
    write: fs.writeSync,
    open: fs.openSync,
    mkdir: fs.mkdirSync
  }
}

function getExec(): Exec {
  return {
    async exec(commandLine, args, options) {
      return exec.exec(commandLine, args, options)
    }
  }
}

function getIO(): IO {
  return {
    async which(tool, check) {
      return io.which(tool, check)
    }
  }
}

function getPublisher(opts: Opts, logger: Log): Publisher {
  if (opts.targetRepo === opts.sourceRepo) {
    return new PublisherSameRepo(opts, getExec(), getIO(), logger)
  }
  return new PublisherDiffRepo(opts, getExec(), getIO(), logger)
}

interface Publisher {
  prepare(): Promise<void>
  publish(): Promise<void>
}

export async function makeSite(): Promise<void> {
  try {
    const logger = getGHActionsLogger()
    const parser = new Parser(getFS(), getInput(), logger)
    const opts: Opts = parser.parseInput()
    const publisher = getPublisher(opts, logger)

    await publisher.prepare()

    const files = await searchFiles(opts.sourceDir, logger)

    processFiles(files, opts, logger)
    const jcc = new JekyllConfCreator(opts, getConfWriter(), logger)

    jcc.saveJekyllConfig()

    if (jcc.conf.domain) {
      fs.writeFile(
        path.join(opts.targetDir, 'CNAME'),
        jcc.conf.domain,
        function () {}
      )
    }

    const aw404 = setup404(opts, logger)
    const awInd = setupRootIndex(opts)

    await aw404
    await awInd

    await publisher.publish()
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function setup404(opts: Opts, logger: Log): Promise<void> {
  const proc = getContentProcessor(
    opts,
    [setupNewFrontMatter(create404Wrapper()), setup404Content()],
    []
  )

  const targetfile = path.join(opts.targetDir, '404.md')

  pipe(
    await proc.process(''),
    match(
      (v: Content) => {
        fs.writeSync(fs.openSync(targetfile, 'w'), v.content)
      },
      (_v: undefined) => {
        logger.debug('not content for 404')
        return
      }
    )
  )
}

async function setupRootIndex(opts: Opts): Promise<void> {
  const proc = getContentProcessor(
    opts,
    [setupNewFrontMatter(createRootIndexJTDFmWrapper())],
    []
  )

  const targetfile = path.join(opts.targetDir, 'index.md')

  pipe(
    await proc.process(''),
    match(
      (v: Content) => {
        fs.writeSync(fs.openSync(targetfile, 'w'), v.content)
      },
      (_v: undefined) => {
        getGHActionsLogger().debug('not content for root index')
        return
      }
    )
  )
}

async function setupIntermidiateIndexes(
  filepath: string,
  opts: Opts
): Promise<void> {
  let currDir = path.dirname(filepath)
  while (path.relative(opts.sourceDir, currDir) !== '') {
    //while not source dir
    const idxf = path.join(currDir, 'index.md')
    if (!fs.existsSync(idxf)) {
      await setupIndexFile(currDir, opts)
    }
    currDir = path.dirname(currDir)
  }
}

function filterByTags(content: string, opts: Opts): boolean {
  if (opts.publishAll) {
    return true
  }

  const fmcontent = fmi(content)
  const checkTags = opts.tags

  if (
    fmcontent.attributes &&
    fmcontent.attributes.tags &&
    fmcontent.attributes.tags instanceof Array
  ) {
    for (let i = 0; i < fmcontent.attributes.tags.length; i++) {
      const ct = fmcontent.attributes.tags[i]
      if (typeof ct === 'string' && checkTags.has(ct)) {
        return true
      }
    }
  }
  return false
}

function processFiles(files: string[], opts: Opts, logger: Log): void {
  for (let i = 0; i < files.length; i++) {
    const currFile = files[i]
    fs.readFile(currFile, 'utf-8', processFile(currFile, opts, logger))
  }
}

async function setupIndexFile(dirpath: string, opts: Opts): Promise<void> {
  // no need to add index file to the root
  if (dirpath === opts.sourceDir) {
    return
  }

  const targetfile = mkTargetDir(path.resolve(dirpath, 'index.md'), opts)

  const proc = getContentProcessor(
    opts,
    [setupNewFrontMatter(createIndexJTDFmWrapper(dirpath, opts))],
    []
  )

  pipe(
    await proc.process(''),
    match(
      (v: Content) => {
        fs.writeSync(fs.openSync(targetfile, 'w'), v.content)
      },
      (_v: undefined) => {
        return
      }
    )
  )
}

function processFile(
  filepath: string,
  opts: Opts,
  logger: Log
): (err: NodeJS.ErrnoException | null, data: string) => void {
  return async (_err: NodeJS.ErrnoException | null, data: string) => {
    logger.debug(`process file: ${filepath}`)
    const content = []
    const cp = getContentProcessor(
      opts,
      [
        cleanupFrontMatter,
        mergeFrontMatter(createChildJTDFmWrapper(filepath, opts)),
        wikiLinkToMdLink,
        wikiLinkToMdImage,
        resolveObsidianLink(
          path.dirname(filepath),
          opts.sourceDir,
          content,
          getLinkResolver(getGHActionsLogger()),
          opts.jekyll_baseurl
        )
      ],
      [filterByTags]
    )
    const processedP = cp.process(data)

    const targetfile = mkTargetDir(filepath, opts)

    await pipe(
      await processedP,
      match(
        async (v: Content) => {
          await setupIntermidiateIndexes(filepath, opts)
          fs.writeSync(fs.openSync(targetfile, 'w'), v.content)
        },
        async (_v: undefined) => {
          return
        }
      )
    )

    if (content.length > 0) {
      logger.debug(`page: ${filepath} has following content: ${content}`)
      for (const c of content) {
        const tf = mkTargetDir(c, opts)
        io.cp(c, tf, {recursive: true, force: true})
      }
    }
  }
}

function mkTargetDir(filepath: string, opts: Opts): string {
  const fileDirRelativeToSource = path.dirname(
    filepath.slice(opts.sourceDir.length + 1)
  ) // path to a directory with target file relative to the sourceDir
  const dir = `${opts.targetDir}/${fileDirRelativeToSource}/` // path with intermediate dirs, but without file
  const tfile = path.resolve(dir, path.basename(filepath))
  fs.mkdirSync(dir, {recursive: true})
  return tfile
}

async function searchFiles(rootPath: string, logger: Log): Promise<string[]> {
  const patterns = [
    `${rootPath}/**/*.md`,
    `${rootPath}/**/*.MD`,
    `${rootPath}/**/*.markdown`,
    `${rootPath}/**/*.MARKDOWN`
  ]

  const globber = await glob.create(patterns.join('\n'), {
    followSymbolicLinks: false
  })
  const files = await globber.glob()

  logger.debug(`found files:\n ${files.join('\n')}`)

  return files
}
