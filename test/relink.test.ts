import {expect} from 'chai'
import * as fc from 'fast-check'
import {match} from 'fp-ts/lib/Either.js'
import {createFsFromVolume, fs, vol} from 'memfs'
import {describe, it} from 'mocha'

import {getLinkResolver} from '../src/relink'
import {silentLogger} from '../src/util'

describe('test link resolving', () => {
  it('rootlinks with extension must be resolved', () => {
    interface tc {
      file: string
      link: string
      root: string
      cwd: string
      expectedpath: string
    }

    const rec = fc.record({
      tc: fc.constantFrom(
        {
          file: '/page.md',
          link: '/page.md',
          root: '/',
          cwd: '/',
          expectedpath: '/page.md'
        },
        {
          file: '/dir/page.md',
          link: '/dir/page.md',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.md'
        },
        {
          file: '/fakeroot/page.md',
          link: '/page.md',
          root: '/fakeroot',
          cwd: '/',
          expectedpath: '/fakeroot/page.md'
        },
        {
          file: '/fakeroot/dir/page.md',
          link: '/dir/page.md',
          root: '/fakeroot',
          cwd: '/',
          expectedpath: '/fakeroot/dir/page.md'
        }
      )
    })

    fc.assert(
      fc.property(rec, prop => {
        const tc: tc = prop.tc
        const json: any = {}
        json[tc.file] = '#HW'

        vol.fromJSON(json, '/')

        const res = getLinkResolver(silentLogger, createFsFromVolume(vol))(
          tc.link,
          tc.cwd,
          tc.root
        )

        expect(res._tag).eq('Left')
        match(
          (found: string) => {
            expect(found).eq(tc.expectedpath)
          },
          r => {
            throw Error('not expected')
          }
        )(res)

        vol.reset()
      })
    )
  })

  it('rootlinks without extension must be resolved', () => {
    interface tc {
      file: string
      link: string
      root: string
      cwd: string
      expectedpath: string
    }

    const rec = fc.record({
      tc: fc.constantFrom(
        {
          file: '/page.md',
          link: '/page',
          root: '/',
          cwd: '/',
          expectedpath: '/page.md'
        },
        {
          file: '/page.MD',
          link: '/page',
          root: '/',
          cwd: '/',
          expectedpath: '/page.MD'
        },
        {
          file: '/page.markdown',
          link: '/page',
          root: '/',
          cwd: '/',
          expectedpath: '/page.markdown'
        },
        {
          file: '/page.MARKDOWN',
          link: '/page',
          root: '/',
          cwd: '/',
          expectedpath: '/page.MARKDOWN'
        },
        {
          file: '/dir/page.md',
          link: '/dir/page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.md'
        },
        {
          file: '/dir/page.MD',
          link: '/dir/page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.MD'
        },
        {
          file: '/dir/page.markdown',
          link: '/dir/page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.markdown'
        },
        {
          file: '/dir/page.MARKDOWN',
          link: '/dir/page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.MARKDOWN'
        },
        {
          file: '/fakeroot/page.md',
          link: '/page',
          root: '/fakeroot',
          cwd: '/',
          expectedpath: '/fakeroot/page.md'
        },
        {
          file: '/fakeroot/page.MD',
          link: '/page',
          root: '/fakeroot',
          cwd: '/',
          expectedpath: '/fakeroot/page.MD'
        },
        {
          file: '/fakeroot/page.markdown',
          link: '/page',
          root: '/fakeroot',
          cwd: '/',
          expectedpath: '/fakeroot/page.markdown'
        },
        {
          file: '/fakeroot/page.MARKDOWN',
          link: '/page',
          root: '/fakeroot',
          cwd: '/',
          expectedpath: '/fakeroot/page.MARKDOWN'
        },
        {
          file: '/fakeroot/dir/page.md',
          link: '/dir/page',
          root: '/fakeroot',
          cwd: '/',
          expectedpath: '/fakeroot/dir/page.md'
        },
        {
          file: '/fakeroot/dir/page.MD',
          link: '/dir/page',
          root: '/fakeroot',
          cwd: '/',
          expectedpath: '/fakeroot/dir/page.MD'
        },
        {
          file: '/fakeroot/dir/page.markdown',
          link: '/dir/page',
          root: '/fakeroot',
          cwd: '/',
          expectedpath: '/fakeroot/dir/page.markdown'
        },
        {
          file: '/fakeroot/dir/page.MARKDOWN',
          link: '/dir/page',
          root: '/fakeroot',
          cwd: '/',
          expectedpath: '/fakeroot/dir/page.MARKDOWN'
        }
      )
    })

    fc.assert(
      fc.property(rec, prop => {
        const tc: tc = prop.tc
        const json: any = {}
        json[tc.file] = '#HW'

        vol.fromJSON(json, '/')

        const res = getLinkResolver(silentLogger, createFsFromVolume(vol))(
          tc.link,
          tc.cwd,
          tc.root
        )

        expect(res._tag).eq('Left')
        match(
          (found: string) => {
            expect(found).eq(tc.expectedpath)
          },
          r => {
            throw Error('not expected')
          }
        )(res)

        vol.reset()
      })
    )
  })

  it('rootlinks with extension must not be resolved', () => {
    interface tc {
      file: string
      link: string
      root: string
      cwd: string
    }

    const rec = fc.record({
      tc: fc.constantFrom(
        {file: '/anotherpage.md', link: '/page.md', root: '/', cwd: '/'},
        {file: '/page.md', link: '/page.md', root: '/fakeroot', cwd: '/'},
        {file: '/dir/page.md', link: '/page.md', root: '/', cwd: '/'},
        {file: '/dir/page.md', link: '/page.md', root: '/fakeroot', cwd: '/'}
      )
    })

    fc.assert(
      fc.property(rec, prop => {
        const tc: tc = prop.tc
        const json: any = {}
        json[tc.file] = '#HW'

        vol.fromJSON(json, '/')

        const res = getLinkResolver(silentLogger, createFsFromVolume(vol))(
          tc.link,
          tc.cwd,
          tc.root
        )

        expect(res._tag).eq('Right')

        vol.reset()
      })
    )
  })

  it('rootlinks without extension must not be resolved', () => {
    interface tc {
      file: string
      link: string
      root: string
      cwd: string
    }

    const rec = fc.record({
      tc: fc.constantFrom(
        {file: '/anotherpage.md', link: '/page', root: '/', cwd: '/'},
        {file: '/page.md', link: '/page', root: '/fakeroot', cwd: '/'},
        {file: '/dir/page.md', link: '/page', root: '/', cwd: '/'},
        {file: '/dir/page.md', link: '/page', root: '/fakeroot', cwd: '/'}
      )
    })

    fc.assert(
      fc.property(rec, prop => {
        const tc: tc = prop.tc
        const json: any = {}
        json[tc.file] = '#HW'

        vol.fromJSON(json, '/')

        const res = getLinkResolver(silentLogger, createFsFromVolume(vol))(
          tc.link,
          tc.cwd,
          tc.root
        )

        expect(res._tag).eq('Right')

        vol.reset()
      })
    )
  })

  it('only filename link with extension must be resolved', () => {
    interface tc {
      files: string[]
      link: string
      root: string
      cwd: string
      expectedpath: string
    }
    const rec = fc.record({
      tc: fc.constantFrom(
        // same directory cases
        {
          files: ['/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/',
          expectedpath: '/page.md'
        },
        {
          files: ['/dir/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/page.md'
        },
        {
          files: ['/page.md', '/dir/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/',
          expectedpath: '/page.md'
        },
        {
          files: ['/page.md', '/dir/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/page.md'
        },
        // child directory cases - file in same dir
        {
          files: ['/dir/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.md'
        },
        {
          files: ['/dir/dir2/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.md'
        },
        {
          files: ['/dir/dir2/page.md', '/dir/dir2/dir3/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.md'
        },
        {
          files: ['/dir/dir21/page.md', '/dir/dir22/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir21/page.md'
        },

        // child directory cases - file in one of subdir
        {
          files: ['/dir/dir2/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.md'
        },
        {
          files: ['/page.md', '/dir/dir2/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.md'
        },
        {
          files: ['/dir/dir2/dir3/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.md'
        },
        {
          files: ['/page.md', '/dir/dir2/dir3/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.md'
        },
        {
          files: ['/dir/dir2/dir3/page.md', '/dir/dir2/dir3/dir4/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.md'
        },
        {
          files: [
            '/page.md',
            '/dir/dir2/dir3/page.md',
            '/dir/dir2/dir3/dir4/page.md'
          ],
          link: 'page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.md'
        },
        {
          files: ['/dir/dir21/dir3/page.md', '/dir/dir22/dir3/page.md'],
          link: 'page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir21/dir3/page.md'
        },
        {
          files: [
            '/page.md',
            '/dir/dir21/dir3/page.md',
            '/dir/dir22/dir3/page.md'
          ],
          link: 'page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir21/dir3/page.md'
        },

        // no file in child dirs, search from root
        {
          files: ['/page.md', '/dir/dir2/anotherpage.md'],
          link: 'page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/page.md'
        },
        {
          files: ['/dir11/page.md', '/dir/dir2/anotherpage.md'],
          link: 'page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir11/page.md'
        }
      )
    })

    fc.assert(
      fc.property(rec, prop => {
        const tc: tc = prop.tc
        const json: any = {}
        for (const file of tc.files) {
          json[file] = '#HW'
        }
        vol.fromJSON(json, '/')

        const res = getLinkResolver(silentLogger, createFsFromVolume(vol))(
          tc.link,
          tc.cwd,
          tc.root
        )

        expect(res._tag).eq('Left')

        match(
          (found: string) => {
            expect(found).eq(tc.expectedpath)
          },
          r => {
            throw Error('not expected')
          }
        )(res)

        vol.reset()
      })
    )
  })

  it('only filename link without extension must be resolved', () => {
    interface tc {
      files: string[]
      link: string
      root: string
      cwd: string
      expectedpath: string
    }
    const rec = fc.record({
      tc: fc.constantFrom(
        // same directory cases
        {
          files: ['/page.md'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/page.md'
        },
        {
          files: ['/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/page.MD'
        },
        {
          files: ['/page.markdown'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/page.markdown'
        },
        {
          files: ['/page.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/page.MARKDOWN'
        },

        {
          files: ['/dir/page.md'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/page.md'
        },
        {
          files: ['/dir/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/page.MD'
        },
        {
          files: ['/dir/page.markdown'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/page.markdown'
        },
        {
          files: ['/dir/page.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/page.MARKDOWN'
        },

        {
          files: ['/page.md', '/dir/page.md'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/page.md'
        },
        {
          files: ['/page.MD', '/dir/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/page.MD'
        },
        {
          files: ['/page.markdown', '/dir/page.markdown'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/page.markdown'
        },
        {
          files: ['/page.MARKDOWN', '/dir/page.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/page.MARKDOWN'
        },

        {
          files: ['/page.md', '/dir/page.md'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/page.md'
        },
        {
          files: ['/page.MD', '/dir/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/page.MD'
        },
        {
          files: ['/page.markdown', '/dir/page.markdown'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/page.markdown'
        },
        {
          files: ['/page.MARKDOWN', '/dir/page.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/page.MARKDOWN'
        },
        // child directory cases - file in same dir
        {
          files: ['/dir/page.md'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.md'
        },
        {
          files: ['/dir/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.MD'
        },
        {
          files: ['/dir/page.markdown'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.markdown'
        },
        {
          files: ['/dir/page.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.MARKDOWN'
        },

        {
          files: ['/dir/dir2/page.md'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.md'
        },
        {
          files: ['/dir/dir2/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.MD'
        },
        {
          files: ['/dir/dir2/page.markdown'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.markdown'
        },
        {
          files: ['/dir/dir2/page.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.MARKDOWN'
        },

        {
          files: ['/dir/dir2/page.md', '/dir/dir2/dir3/page.md'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.md'
        },
        {
          files: ['/dir/dir2/page.MD', '/dir/dir2/dir3/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.MD'
        },
        {
          files: ['/dir/dir2/page.markdown', '/dir/dir2/dir3/page.markdown'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.markdown'
        },
        {
          files: ['/dir/dir2/page.MARKDOWN', '/dir/dir2/dir3/page.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.MARKDOWN'
        },

        {
          files: ['/dir/dir21/page.md', '/dir/dir22/page.md'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir21/page.md'
        },
        {
          files: ['/dir/dir21/page.MD', '/dir/dir22/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir21/page.MD'
        },
        {
          files: ['/dir/dir21/page.markdown', '/dir/dir22/page.markdown'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir21/page.markdown'
        },
        {
          files: ['/dir/dir21/page.MARKDOWN', '/dir/dir22/page.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir21/page.MARKDOWN'
        },

        // child directory cases - file in one of subdir
        {
          files: ['/dir/dir2/page.md'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.md'
        },
        {
          files: ['/dir/dir2/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.MD'
        },
        {
          files: ['/dir/dir2/page.markdown'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.markdown'
        },
        {
          files: ['/dir/dir2/page.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.MARKDOWN'
        },

        {
          files: ['/page.md', '/dir/dir2/page.md'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.md'
        },
        {
          files: ['/page.MD', '/dir/dir2/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.MD'
        },
        {
          files: ['/page.markdown', '/dir/dir2/page.markdown'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.markdown'
        },
        {
          files: ['/page.MARKDOWN', '/dir/dir2/page.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.MARKDOWN'
        },

        {
          files: ['/dir/dir2/dir3/page.md'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.md'
        },
        {
          files: ['/dir/dir2/dir3/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.MD'
        },
        {
          files: ['/dir/dir2/dir3/page.markdown'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.markdown'
        },
        {
          files: ['/dir/dir2/dir3/page.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.MARKDOWN'
        },

        {
          files: ['/page.md', '/dir/dir2/dir3/page.md'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.md'
        },
        {
          files: ['/page.MD', '/dir/dir2/dir3/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.MD'
        },
        {
          files: ['/page.markdown', '/dir/dir2/dir3/page.markdown'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.markdown'
        },
        {
          files: ['/page.MARKDOWN', '/dir/dir2/dir3/page.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.MARKDOWN'
        },

        {
          files: ['/dir/dir2/dir3/page.md', '/dir/dir2/dir3/dir4/page.md'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.md'
        },
        {
          files: ['/dir/dir2/dir3/page.MD', '/dir/dir2/dir3/dir4/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.MD'
        },
        {
          files: [
            '/dir/dir2/dir3/page.markdown',
            '/dir/dir2/dir3/dir4/page.markdown'
          ],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.markdown'
        },
        {
          files: [
            '/dir/dir2/dir3/page.MARKDOWN',
            '/dir/dir2/dir3/dir4/page.MARKDOWN'
          ],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.MARKDOWN'
        },

        {
          files: [
            '/page.md',
            '/dir/dir2/dir3/page.md',
            '/dir/dir2/dir3/dir4/page.md'
          ],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.md'
        },
        {
          files: [
            '/page.MD',
            '/dir/dir2/dir3/page.MD',
            '/dir/dir2/dir3/dir4/page.MD'
          ],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.MD'
        },
        {
          files: [
            '/page.markdown',
            '/dir/dir2/dir3/page.markdown',
            '/dir/dir2/dir3/dir4/page.markdown'
          ],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.markdown'
        },
        {
          files: [
            '/page.MARKDOWN',
            '/dir/dir2/dir3/page.MARKDOWN',
            '/dir/dir2/dir3/dir4/page.MARKDOWN'
          ],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/dir3/page.MARKDOWN'
        },

        {
          files: ['/dir/dir21/dir3/page.md', '/dir/dir22/dir3/page.md'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir21/dir3/page.md'
        },
        {
          files: ['/dir/dir21/dir3/page.MD', '/dir/dir22/dir3/page.MD'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir21/dir3/page.MD'
        },
        {
          files: [
            '/dir/dir21/dir3/page.markdown',
            '/dir/dir22/dir3/page.markdown'
          ],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir21/dir3/page.markdown'
        },
        {
          files: [
            '/dir/dir21/dir3/page.MARKDOWN',
            '/dir/dir22/dir3/page.MARKDOWN'
          ],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir21/dir3/page.MARKDOWN'
        },

        {
          files: [
            '/page.md',
            '/dir/dir21/dir3/page.md',
            '/dir/dir22/dir3/page.md'
          ],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir21/dir3/page.md'
        },
        {
          files: [
            '/page.MD',
            '/dir/dir21/dir3/page.MD',
            '/dir/dir22/dir3/page.MD'
          ],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir21/dir3/page.MD'
        },
        {
          files: [
            '/page.markdown',
            '/dir/dir21/dir3/page.markdown',
            '/dir/dir22/dir3/page.markdown'
          ],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir21/dir3/page.markdown'
        },
        {
          files: [
            '/page.MARKDOWN',
            '/dir/dir21/dir3/page.MARKDOWN',
            '/dir/dir22/dir3/page.MARKDOWN'
          ],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir21/dir3/page.MARKDOWN'
        },

        // no file in child dirs, search from root
        {
          files: ['/page.md', '/dir/dir2/anotherpage.md'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/page.md'
        },
        {
          files: ['/page.MD', '/dir/dir2/anotherpage.MD'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/page.MD'
        },
        {
          files: ['/page.markdown', '/dir/dir2/anotherpage.markdown'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/page.markdown'
        },
        {
          files: ['/page.MARKDOWN', '/dir/dir2/anotherpage.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/page.MARKDOWN'
        },

        {
          files: ['/dir11/page.md', '/dir/dir2/anotherpage.md'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir11/page.md'
        },
        {
          files: ['/dir11/page.MD', '/dir/dir2/anotherpage.MD'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir11/page.MD'
        },
        {
          files: ['/dir11/page.markdown', '/dir/dir2/anotherpage.markdown'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir11/page.markdown'
        },
        {
          files: ['/dir11/page.MARKDOWN', '/dir/dir2/anotherpage.MARKDOWN'],
          link: 'page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir11/page.MARKDOWN'
        }
      )
    })

    fc.assert(
      fc.property(rec, prop => {
        const tc: tc = prop.tc
        const json: any = {}
        for (const file of tc.files) {
          json[file] = '#HW'
        }
        vol.fromJSON(json, '/')

        const res = getLinkResolver(silentLogger, createFsFromVolume(vol))(
          tc.link,
          tc.cwd,
          tc.root
        )

        expect(res._tag).eq('Left')

        match(
          (found: string) => {
            expect(found).eq(tc.expectedpath)
          },
          r => {
            throw Error('not expected')
          }
        )(res)

        vol.reset()
      })
    )
  })

  it('only filename link with extension must not be resolved', () => {
    interface tc {
      files: string[]
      link: string
      root: string
      cwd: string
    }
    const rec = fc.record({
      tc: fc.constantFrom(
        {files: ['/anotherpage.md'], link: 'page.md', root: '/', cwd: '/'},
        {
          files: ['/dir/anotherpage.md'],
          link: 'page.md',
          root: '/',
          cwd: '/dir'
        },
        {
          files: ['/page.md'],
          link: 'page.md',
          root: '/fakeroot',
          cwd: '/fakeroot/dir'
        }
      )
    })

    fc.assert(
      fc.property(rec, prop => {
        const tc: tc = prop.tc
        const json: any = {}
        for (const file of tc.files) {
          json[file] = '#HW'
        }
        vol.fromJSON(json, '/')

        const res = getLinkResolver(silentLogger, createFsFromVolume(vol))(
          tc.link,
          tc.cwd,
          tc.root
        )

        expect(res._tag).eq('Right')

        vol.reset()
      })
    )
  })

  it('only filename link without extension must not be resolved', () => {
    interface tc {
      files: string[]
      link: string
      root: string
      cwd: string
    }
    const rec = fc.record({
      tc: fc.constantFrom(
        // same directory cases
        {files: ['/anotherpage.md'], link: 'page.md', root: '/', cwd: '/'},
        {files: ['/anotherpage.MD'], link: 'page.md', root: '/', cwd: '/'},
        {
          files: ['/anotherpage.markdown'],
          link: 'page.md',
          root: '/',
          cwd: '/'
        },
        {
          files: ['/anotherpage.MARKDOWN'],
          link: 'page.md',
          root: '/',
          cwd: '/'
        },

        {
          files: ['/dir/anotherpage.md'],
          link: 'page.md',
          root: '/',
          cwd: '/dir'
        },
        {
          files: ['/dir/anotherpage.MD'],
          link: 'page.md',
          root: '/',
          cwd: '/dir'
        },
        {
          files: ['/dir/anotherpage.markdown'],
          link: 'page.md',
          root: '/',
          cwd: '/dir'
        },
        {
          files: ['/dir/anotherpage.MARKDOWN'],
          link: 'page.md',
          root: '/',
          cwd: '/dir'
        },

        {
          files: ['/page.md'],
          link: 'page.md',
          root: '/fakeroot',
          cwd: '/fakeroot/dir'
        },
        {
          files: ['/page.MD'],
          link: 'page.md',
          root: '/fakeroot',
          cwd: '/fakeroot/dir'
        },
        {
          files: ['/page.markdown'],
          link: 'page.md',
          root: '/fakeroot',
          cwd: '/fakeroot/dir'
        },
        {
          files: ['/page.MARKDOWN'],
          link: 'page.md',
          root: '/fakeroot',
          cwd: '/fakeroot/dir'
        }
      )
    })

    fc.assert(
      fc.property(rec, prop => {
        const tc: tc = prop.tc
        const json: any = {}
        for (const file of tc.files) {
          json[file] = '#HW'
        }
        vol.fromJSON(json, '/')

        const res = getLinkResolver(silentLogger, createFsFromVolume(vol))(
          tc.link,
          tc.cwd,
          tc.root
        )

        expect(res._tag).eq('Right')

        vol.reset()
      })
    )
  })

  it('relative filename link with extension must be resolved', () => {
    interface tc {
      files: string[]
      link: string
      root: string
      cwd: string
      expectedpath: string
    }
    const rec = fc.record({
      tc: fc.constantFrom(
        // child dir case
        {
          files: ['/dir/page.md'],
          link: 'dir/page.md',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.md'
        },
        {
          files: ['/dir/dir2/page.md'],
          link: 'dir2/page.md',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.md'
        },
        {
          files: ['/dir/dir2/page.md'],
          link: 'dir2/page.md',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.md'
        },

        {
          files: ['/dir/dir2/page.md'],
          link: 'dir2/page.md',
          root: '/',
          cwd: '/dir/dir2',
          expectedpath: '/dir/dir2/page.md'
        }
      )
    })

    fc.assert(
      fc.property(rec, prop => {
        const tc: tc = prop.tc
        const json: any = {}
        for (const file of tc.files) {
          json[file] = '#HW'
        }
        vol.fromJSON(json, '/')

        const res = getLinkResolver(silentLogger, createFsFromVolume(vol))(
          tc.link,
          tc.cwd,
          tc.root
        )

        expect(res._tag).eq('Left')

        match(
          (found: string) => {
            expect(found).eq(tc.expectedpath)
          },
          r => {
            throw Error('not expected')
          }
        )(res)

        vol.reset()
      })
    )
  })

  it('relative filename link without extension must be resolved', () => {
    interface tc {
      files: string[]
      link: string
      root: string
      cwd: string
      expectedpath: string
    }
    const rec = fc.record({
      tc: fc.constantFrom(
        // child dir case
        {
          files: ['/dir/page.md'],
          link: 'dir/page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.md'
        },
        {
          files: ['/dir/page.MD'],
          link: 'dir/page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.MD'
        },
        {
          files: ['/dir/page.markdown'],
          link: 'dir/page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.markdown'
        },
        {
          files: ['/dir/page.MARKDOWN'],
          link: 'dir/page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/page.MARKDOWN'
        },

        {
          files: ['/dir/dir2/page.md'],
          link: 'dir2/page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.md'
        },
        {
          files: ['/dir/dir2/page.MD'],
          link: 'dir2/page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.MD'
        },
        {
          files: ['/dir/dir2/page.markdown'],
          link: 'dir2/page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.markdown'
        },
        {
          files: ['/dir/dir2/page.MARKDOWN'],
          link: 'dir2/page',
          root: '/',
          cwd: '/',
          expectedpath: '/dir/dir2/page.MARKDOWN'
        },

        {
          files: ['/dir/dir2/page.md'],
          link: 'dir2/page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.md'
        },
        {
          files: ['/dir/dir2/page.MD'],
          link: 'dir2/page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.MD'
        },
        {
          files: ['/dir/dir2/page.markdown'],
          link: 'dir2/page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.markdown'
        },
        {
          files: ['/dir/dir2/page.MARKDOWN'],
          link: 'dir2/page',
          root: '/',
          cwd: '/dir',
          expectedpath: '/dir/dir2/page.MARKDOWN'
        },

        {
          files: ['/dir/dir2/page.md'],
          link: 'dir2/page',
          root: '/',
          cwd: '/dir/dir2',
          expectedpath: '/dir/dir2/page.md'
        },
        {
          files: ['/dir/dir2/page.MD'],
          link: 'dir2/page',
          root: '/',
          cwd: '/dir/dir2',
          expectedpath: '/dir/dir2/page.MD'
        },
        {
          files: ['/dir/dir2/page.markdown'],
          link: 'dir2/page',
          root: '/',
          cwd: '/dir/dir2',
          expectedpath: '/dir/dir2/page.markdown'
        },
        {
          files: ['/dir/dir2/page.MARKDOWN'],
          link: 'dir2/page',
          root: '/',
          cwd: '/dir/dir2',
          expectedpath: '/dir/dir2/page.MARKDOWN'
        },
        {
          files: ['/home/tmp/dir/dir2/page.MARKDOWN'],
          link: 'dir2/page',
          root: '/home/tmp/dir/',
          cwd: '/home/tmp/dir/dir2',
          expectedpath: '/home/tmp/dir/dir2/page.MARKDOWN'
        }
      )
    })

    fc.assert(
      fc.property(rec, prop => {
        const tc: tc = prop.tc
        const json: any = {}
        for (const file of tc.files) {
          json[file] = '#HW'
        }
        vol.fromJSON(json, '/')

        const res = getLinkResolver(silentLogger, createFsFromVolume(vol))(
          tc.link,
          tc.cwd,
          tc.root
        )

        expect(res._tag).eq('Left')

        match(
          (found: string) => {
            expect(found).eq(tc.expectedpath)
          },
          r => {
            throw Error('not expected')
          }
        )(res)

        vol.reset()
      })
    )
  })

  it('relative filename link with extension must not be resolved', () => {
    interface tc {
      files: string[]
      link: string
      root: string
      cwd: string
    }
    const rec = fc.record({
      tc: fc.constantFrom(
        // child dir case
        {
          files: ['/dir/anotherpage.md'],
          link: 'dir/page.md',
          root: '/',
          cwd: '/'
        },
        {files: ['/page.md'], link: 'dir/page.md', root: '/dir', cwd: '/dir'},
        {
          files: ['/dir/page.md', '/dir/dir2/anotherpage.md'],
          link: 'dir2/page.md',
          root: '/dir2',
          cwd: '/dir2'
        }
      )
    })

    fc.assert(
      fc.property(rec, prop => {
        const tc: tc = prop.tc
        const json: any = {}
        for (const file of tc.files) {
          json[file] = '#HW'
        }
        vol.fromJSON(json, '/')

        const res = getLinkResolver(silentLogger, createFsFromVolume(vol))(
          tc.link,
          tc.cwd,
          tc.root
        )

        expect(res._tag).eq('Right')

        vol.reset()
      })
    )
  })
})
