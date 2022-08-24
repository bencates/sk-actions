import { invalidate } from '$app/navigation'

export type PageActionHandlers = Record<string, PageActionHandler>
export type PageActionHandler = () => void

export type PageActions = Record<string, PageAction>
export type PageAction = {
  path: string
  handle(p: {
    pending?: ({ data, form }: { data: FormData; form: HTMLFormElement }) => void
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
    result?: ({
      data,
      form,
      response,
    }: {
      data: FormData
      response: Response
      form: HTMLFormElement
    }) => void
  }): (this: HTMLFormElement, event: SubmitEvent) => void
  key(key: string): PageAction
}

export function createActions(basePath: string, handlers: PageActionHandlers): PageActions {
  return Object.fromEntries(
    Object.entries(handlers).map(([name, handler]) => [
      name,
      createAction(`${basePath}?action.${name}`, handler),
    ]),
  )
}

export function createAction(path: string, handler: PageActionHandler): PageAction {
  let current_token: unknown

  return {
    path,

    handle({ pending, error, result }) {
      return async function (event) {
        const token = (current_token = {})

        event.preventDefault()

        const data = new FormData(this)

        if (pending) pending({ data, form: this })

        try {
          const response = await fetch(this.action, {
            method: this.method,
            headers: {
              accept: 'application/json',
            },
            body: data,
          })

          if (token !== current_token) return

          if (response.ok) {
            if (result) result({ data, form: this, response })

            const url = new URL(this.action)
            url.search = url.hash = ''
            invalidate(url.href)
          } else if (error) {
            error({ data, form: this, error: null, response })
          } else {
            console.error(await response.text())
          }
        } catch (err: unknown) {
          if (error && err instanceof Error) {
            error({ data, form: this, error: err, response: null })
          } else {
            throw err
          }
        }
      }
    },

    key(key: string) {
      return createAction(`${path}=${key}`, handler)
    },
  }
}
