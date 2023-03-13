import {Either, left, right} from 'fp-ts/lib/Either.js'
import glob from 'glob'
import path from 'node:path'

import {Log, consoleLogger} from './util.js'

export function getLinkResolver(
  log?: Log,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fs?: any
): (
  linkto: string,
  currdir: string,
  rootdir: string
) => Either<string, undefined> {
  const logger = log ? log : consoleLogger

  return (linkto: string, currdir: string, rootdir: string) => {
    const exts = new Set(['md', 'MD', 'markdown', 'MARKDOWN'])
    let found: string[]
    logger.debug(`resolving: ${linkto}, curr: ${currdir}, root: ${rootdir}`)
    if (!isInternal(linkto)) {
      logger.debug(`resolving result: external link`)
      return right(undefined)
    }
    if (isRootPath(linkto)) {
      const patterns = makePatterns(linkto, exts)
      found = glob.sync(patterns, withFs({root: rootdir}, fs))
      if (found.length > 0) {
        const res = closest(found, rootdir)
        logger.debug(`resolving result: root path - ${res}`)
        return left(res)
      }
    } else {
      // at first search in directory where file that contains this link placed
      let patterns = makePatterns(linkto, exts)
      found = glob.sync(
        patterns,
        withFs({root: rootdir, cwd: currdir, absolute: true}, fs)
      )
      if (found.length > 0) {
        const res = closest(found, currdir)
        logger.debug(`resolving result: ${res}`)
        return left(res)
      }

      // if file wasn't found in the same directory
      // search in the all children dirs
      patterns = makeChildrenPatterns(linkto, exts)
      found = glob.sync(
        patterns,
        withFs({root: rootdir, cwd: currdir, absolute: true}, fs)
      )
      if (found.length > 0) {
        const res = closest(found, currdir)
        logger.debug(`resolving result: ${res}`)
        return left(res)
      }

      // if file wasn't found in the children directories
      // search from the root
      patterns = makeChildrenPatterns(linkto, exts)
      found = glob.sync(
        patterns,
        withFs({root: rootdir, cwd: rootdir, absolute: true}, fs)
      )
      if (found.length > 0) {
        const res = closest(found, rootdir)
        logger.debug(`resolving result: ${res}`)
        return left(res)
      }
    }
    logger.debug(`resolving result: undefined`)
    return right(undefined)
  }
}

function isInternal(link: string): boolean {
  return !link.match(/^https?:\/\//)
}

function makePatterns(linkto: string, extensions: Set<string>): string {
  const withExt = hasExt(linkto)
  if (withExt) {
    return linkto
  }
  const patterns: string[] = []
  for (const ext of extensions) {
    patterns.push(`.${ext}`)
  }
  return `${linkto}@(${patterns.join('|')})`
}

function makeChildrenPatterns(linkto: string, extensions: Set<string>): string {
  if (hasExt(linkto)) {
    return `./**/${linkto}`
  }
  const patterns: string[] = []
  for (const ext of extensions) {
    patterns.push(`.${ext}`)
  }
  return `./**/${linkto}@(${patterns.join('|')})`
}

function isRootPath(linkto: string): boolean {
  return linkto.startsWith('/')
}

function dirCount(_path: string): number {
  let count = 0
  for (let c = 0; c < _path.length; c++) {
    if (_path.charAt(c) === '/') {
      count++
    }
  }
  return count
}

function hasExt(name: string): boolean {
  return path.extname(name) !== ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withFs(obj: any, fs?: any): any {
  if (fs) {
    obj.fs = fs
  }
  return obj
}

function closest(paths: string[], relativeTo: string): string {
  paths.sort((a, b) => a.localeCompare(b))
  // just relatively big number
  let minPath = 200000000
  let closestFile = ''
  for (const f of paths) {
    const relative = path.relative(relativeTo, f)
    const count = dirCount(relative)
    if (count < minPath) {
      minPath = count
      closestFile = f
    }
  }
  return closestFile
}
