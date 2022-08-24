import { invalidate } from '$app/navigation'
import { getContext } from 'svelte'

import type { Writable } from 'svelte/store'

export type PageActionHandlers<PageData> = Record<string, PageActionHandler<PageData>>
export type PageActionHandler<PageData> = (
  event: PageActionEvent<PageData>,
) => ReturnType<typeof fetch>
export type PageActionEvent<PageData> = {
  key: string | null
  data: Writable<PageData>
  form: HTMLFormElement
  fields: FormData
  post: (data: FormData) => ReturnType<typeof fetch>
}

export type PageActions = Record<string, PageAction>
export type PageAction = {
  path: string
  handle(p: {
    error?: ({
      data,
      form,
      response,
      error,
    }: {
      data: FormData
      form: HTMLFormElement
      response: Response | null
      error: Error | null
    }) => void
  }): (this: HTMLFormElement, event: SubmitEvent) => void
  key(key: string): PageAction
}

export function createActions<PageData>(
  basePath: string,
  handlers: PageActionHandlers<PageData>,
): PageActions {
  return Object.fromEntries(
    Object.entries(handlers).map(([name, handler]) => [
      name,
      createAction(basePath, name, null, handler),
    ]),
  )
}

export function createAction<PageData>(
  basePath: string,
  name: string,
  key: string | null,
  handler: PageActionHandler<PageData>,
): PageAction {
  const data = getContext<Writable<PageData>>('PAGE_DATA_STORE')

  const path = key ? `${basePath}?action.${name}=${key}` : `${basePath}?action.${name}`

  return {
    path,

    handle({ error }) {
      return async function (event) {
        event.preventDefault()

        const fields = new FormData(this)

        function post(body: FormData) {
          return fetch(path, {
            method: 'POST',
            headers: { accept: 'application/json' },
            body,
          })
        }

        try {
          const response = await handler({ key, data, post, fields, form: this })

          if (response.ok) {
            const url = new URL(this.action)
            url.search = url.hash = ''
            invalidate(url.href)
          } else if (error) {
            error({ data: fields, form: this, error: null, response })
          } else {
            console.error(await response.text())
          }
        } catch (err: unknown) {
          if (error && err instanceof Error) {
            error({ data: fields, form: this, error: err, response: null })
          } else {
            throw err
          }
        }
      }
    },

    key(key: string) {
      return createAction(basePath, name, key, handler)
    },
  }
}
