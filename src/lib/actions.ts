import { enhance } from '$lib/form'

export type PageActionHandlers = Record<string, PageActionHandler>
export type PageActionHandler = () => void

export type PageActions = Record<string, PageAction>
export type PageAction = {
  path: string
  form: typeof enhance
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
  return {
    path,
    form: enhance,
    key(key: string) {
      return createAction(`${path}=${key}`, handler)
    },
  }
}
