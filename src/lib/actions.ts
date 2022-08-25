import { getContext } from 'svelte'
import { writable } from 'svelte/store'

import type { Readable, Writable } from 'svelte/store'
import type { MaybePromise } from '@sveltejs/kit/types/private'

export type PageActionHandlers<PageData> = Record<string, PageActionHandler<PageData>>
export type PageActionHandler<PageData> = (event: PageActionEvent<PageData>) => MaybePromise<{
  result?: Record<string, any>
  errors?: Record<string, any>
  location?: string
} | void>
export type PageActionEvent<PageData> = {
  // The key for this action, if it has been set.
  key: string | null
  // The page data is provided to the event as a writable store. Changing the
  // value of this store will synchronously pass an updated `data` prop to the
  // page.
  data: Writable<PageData>
  // The form that is being submitted.
  form: HTMLFormElement
  // A snapshot of the formData.
  fields: FormData
  // Utility function to call the server action and unwrap it's data. If no
  // matching server action is defined it should immediately resolve with a
  // sensible default value, probably `{ result: {} }`.
  //
  // Ideally `result` and `errors` can be automatically typed in `./$types`.
  submit: (data: FormData) => Promise<{
    result?: Record<string, any>
    errors?: Record<string, any>
    location?: string
  }>

  // This should probably also include `fetch`, `params`, `url`, and `routeId` from LoadEvent
}

export type PageActions = Readable<Record<string, PageAction>>
export type PageAction = {
  // The full path of this action, including the query param
  path: string
  // A submit handler callback usable with `on:submit` or
  handle(this: HTMLFormElement, event: SubmitEvent): void
  // Any errors this action generated the last time it was submitted
  errors?: Record<string, string>
  // Derive a new keyed action, allowing the same handler to be used multiple
  // times on a single page.
  //
  // This method could use a better name.
  key(key: string): PageAction
}

export function createActions<PageData>(
  basePath: string,
  handlers: PageActionHandlers<PageData>,
): PageActions {
  const store = writable<Record<string, PageAction>>({})

  store.set(
    Object.fromEntries(
      Object.entries(handlers).map(([name, handler]) => [
        name,
        createAction(basePath, name, null, handler, store),
      ]),
    ),
  )

  return { subscribe: store.subscribe }
}

export function createAction<PageData>(
  basePath: string,
  name: string,
  key: string | null,
  handler: PageActionHandler<PageData>,
  store: Writable<Record<string, PageAction>>,
): PageAction {
  const data = getContext<Writable<PageData>>('PAGE_DATA_STORE')

  const path = key ? `${basePath}?action.${name}=${key}` : `${basePath}?action.${name}`

  function setErrors(errors: Record<string, string> | undefined) {
    store.update(($actions) => {
      if (errors) {
        $actions[name].errors = {
          ...$actions[name].errors,
          ...errors,
        }
      } else {
        delete $actions[name].errors
      }

      return $actions
    })
  }

  return {
    path,

    async handle(event) {
      event.preventDefault()
      setErrors(undefined)

      const fields = new FormData(this)

      async function submit(body: FormData) {
        const response = await fetch(path, {
          method: 'POST',
          headers: { accept: 'application/json' },
          body,
        })

        // Abusing the existing server API to mock the new one
        const result = (await response.json())?.errors ?? { result: {} }

        if (result.errors) {
          setErrors(result.errors)
        }

        return result
      }

      const result = await handler({ key, data, submit, fields, form: this })

      if (result?.errors) {
        setErrors(result.errors)
      }
    },

    key(key: string) {
      return createAction(basePath, name, key, handler, store)
    },
  }
}
