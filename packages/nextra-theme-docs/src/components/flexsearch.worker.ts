import type FlexSearch from 'flexsearch'
import type { EnrichedDocumentSearchResultSetUnitResultUnit } from 'flexsearch'
import { getSearchWorkerInstance } from '../utils'

export type SectionIndex = FlexSearch.Document<
  {
    id: string
    url: string
    title: string
    pageId: string
    content: string
    display?: string
    preset?: string
  },
  ['title', 'content', 'url', 'display']
>

export type PageIndex = FlexSearch.Document<
  {
    id: number
    title: string
    content: string
    preset?: string
  },
  ['title']
>

const SearchScope = {
  Page: 'page',
  Section: 'section'
} as const
type SearchScope = (typeof SearchScope)[keyof typeof SearchScope]

function callWorker<T>(worker: Worker, type: string, payload: any): Promise<T> {
  return new Promise((resolve, reject) => {
    const callId = Math.random().toString(36).slice(2, 9)
    worker.addEventListener(
      'message',
      function messageListener(event: MessageEvent) {
        const { id, payload, error } = event.data
        if (id === callId) {
          if (error) {
            reject(error)
          } else {
            resolve(payload)
          }
          worker.removeEventListener('message', messageListener)
        }
      }
    )
    worker.postMessage({ type, payload, id: callId })
  })
}

export async function loadIndexes(
  basePath: string,
  locale: string
): Promise<TSearchWrapper> {
  const workerInstance = getSearchWorkerInstance();

  await callWorker<TSearchWrapper>(workerInstance, 'init', {
    locale,
    basePath
  })

  return {
    async page(
      query: string
    ): Promise<
      Array<EnrichedDocumentSearchResultSetUnitResultUnit<TPageItem>>
    > {
      return callWorker(workerInstance, 'search', {
        scope: SearchScope.Page,
        query,
        locale,
        basePath
      })
    },
    async section(
      query: string,
      tag?: string
    ): Promise<
      Array<EnrichedDocumentSearchResultSetUnitResultUnit<TSectionItem>>
    > {
      return callWorker(workerInstance, 'search', {
        scope: SearchScope.Section,
        query,
        tag,
        locale,
        basePath
      })
    }
  }
}

type TPageItem = {
  id: number
  title: string
  content: string
  preset?: string
}

type TSectionItem = {
  id: string
  url: string
  title: string
  pageId: string
  content: string
  display?: string | undefined
  preset?: string | undefined
}

type SearchFn<T> = (
  query: string,
  tag?: string
) => Promise<Array<EnrichedDocumentSearchResultSetUnitResultUnit<T>>>

type PageSearchFn = SearchFn<TPageItem>
type SectionSearchFn = SearchFn<TSectionItem>

export type TSearchWrapper = { page: PageSearchFn; section: SectionSearchFn }
