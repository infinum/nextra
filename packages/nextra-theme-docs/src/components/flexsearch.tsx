import cn from 'clsx'
// flexsearch types are incorrect, they were overwritten in tsconfig.json
import { useRouter } from 'next/router'
import type { ReactElement, ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_LOCALE } from '../constants'
import type { SearchResult } from '../types'
import type { TSearchWrapper } from './flexsearch.worker'
import { loadIndexes } from './flexsearch.worker'
import { HighlightMatches } from './highlight-matches'
import { Search } from './search'

type Result = {
  _page_rk: number
  _section_rk: number
  route: string
  prefix: ReactNode
  children: ReactNode
}

// This can be global for better caching.
const indexes: {
  [locale: string]: TSearchWrapper
} = {}

export function Flexsearch({
  className
}: {
  className?: string
}): ReactElement {
  const { locale = DEFAULT_LOCALE, basePath } = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [search, setSearch] = useState('')

  const doSearch = async (search: string) => {
    if (!search) return
    const { page: pageSearch, section: sectionSearch } = indexes[locale]

    // Show the results for the top 5 pages
    const pageResults = await pageSearch(search)

    const results: Result[] = []
    const pageTitleMatches: Record<number, number> = {}

    for (let i = 0; i < pageResults.length; i++) {
      const result = pageResults[i]
      pageTitleMatches[i] = 0

      // Show the top 5 results for each page
      const sectionResults = await sectionSearch(search, `page_${result.id}`)

      let isFirstItemOfPage = true
      const occurred: Record<string, boolean> = {}

      for (let j = 0; j < sectionResults.length; j++) {
        const { doc } = sectionResults[j]
        const isMatchingTitle = doc.display !== undefined
        if (isMatchingTitle) {
          pageTitleMatches[i]++
        }
        const { url, title } = doc
        const content = doc.display || doc.content
        if (occurred[url + '@' + content]) continue
        occurred[url + '@' + content] = true
        results.push({
          _page_rk: i,
          _section_rk: j,
          route: url,
          prefix: isFirstItemOfPage && (
            <div
              className={cn(
                'nx-mx-2.5 nx-mb-2 nx-mt-6 nx-select-none nx-border-b nx-border-black/10 nx-px-2.5 nx-pb-1.5 nx-text-xs nx-font-semibold nx-uppercase nx-text-gray-500 first:nx-mt-0 dark:nx-border-white/20 dark:nx-text-gray-300',
                'contrast-more:nx-border-gray-600 contrast-more:nx-text-gray-900 contrast-more:dark:nx-border-gray-50 contrast-more:dark:nx-text-gray-50'
              )}
            >
              {result.doc.title}
            </div>
          ),
          children: (
            <>
              <div className="nx-text-base nx-font-semibold nx-leading-5">
                <HighlightMatches match={search} value={title} />
              </div>
              {content && (
                <div className="excerpt nx-mt-1 nx-text-sm nx-leading-[1.35rem] nx-text-gray-600 dark:nx-text-gray-400 contrast-more:dark:nx-text-gray-50">
                  <HighlightMatches match={search} value={content} />
                </div>
              )}
            </>
          )
        })
        isFirstItemOfPage = false
      }
    }

    setResults(
      results
        .sort((a, b) => {
          // Sort by number of matches in the title.
          if (a._page_rk === b._page_rk) {
            return a._section_rk - b._section_rk
          }
          if (pageTitleMatches[a._page_rk] !== pageTitleMatches[b._page_rk]) {
            return pageTitleMatches[b._page_rk] - pageTitleMatches[a._page_rk]
          }
          return a._page_rk - b._page_rk
        })
        .map(res => ({
          id: `${res._page_rk}_${res._section_rk}`,
          route: res.route,
          prefix: res.prefix,
          children: res.children
        }))
    )
  }

  const preload = useCallback(
    (active: boolean) => {
      if (active && !indexes[locale]) {
        setLoading(true)
        loadIndexes(basePath, locale)
          .then(workerIndexes => {
            indexes[locale] = workerIndexes
            setLoading(false)
          })
          .catch(() => {
            setError(true)
            setLoading(false)
          })
      }
    },
    [locale, basePath]
  )

  const handleChange = async (value: string) => {
    setSearch(value)
    if (indexes[locale]) {
      await doSearch(value)
    } else {
      setLoading(true)
      try {
        const workerIndexes = await loadIndexes(basePath, locale)
        indexes[locale] = workerIndexes
        await doSearch(value)
      } catch {
        setError(true)
      }
      setLoading(false)
    }
  }

  useEffect(() => {
    preload(true)
  }, [preload])

  return (
    <Search
      loading={loading}
      error={error}
      value={search}
      onChange={handleChange}
      className={className}
      overlayClassName="nx-w-screen nx-min-h-[100px] nx-max-w-[min(calc(100vw-2rem),calc(100%+20rem))]"
      results={results}
    />
  )
}
