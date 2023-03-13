// eslint-disable-next-line import/no-unresolved
import {FrontmatterContent} from 'mdast'
import * as yml from 'yaml'

export function create404Wrapper(): () => FrontmatterContent {
  return () => create404Fm()
}

class NotFoundFm {
  layout = 'default'
  title = '404'
  nav_exclude = true
  search_exclude = true
}

function create404Fm(): FrontmatterContent {
  return {
    type: 'yaml',
    value: yml.stringify(new NotFoundFm())
  }
}
