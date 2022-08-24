import { getContext } from 'svelte'
import type { Writable } from 'svelte/store'

export type PageActionHandlers<PageData> = Record<string, PageActionHandler<PageData>>
export type PageActionHandler<PageData> = (event: PageActionEvent<PageData>) => void
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

export type PageActions = Record<string, PageAction>
export type PageAction = {
  // The full path of this action, including the query param
  path: string
  // A submit handler callback usable with `on:submit` or
  handle(this: HTMLFormElement, event: SubmitEvent): void
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

    async handle(event) {
      event.preventDefault()

      const fields = new FormData(this)

      async function submit(body: FormData) {
        const res = await fetch(path, {
          method: 'POST',
          headers: { accept: 'application/json' },
          body,
        })

        // Abusing the existing server API to mock the new one
        return (await res.json()).errors
      }

      await handler({ key, data, submit, fields, form: this })
    },

    key(key: string) {
      return createAction(basePath, name, key, handler)
    },
  }
}
