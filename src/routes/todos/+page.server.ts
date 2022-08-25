import { error } from '@sveltejs/kit'
import { api } from './api'
import type { PageServerLoad, Action } from './$types'

export type Todo = {
  uid: string
  created_at: Date
  text: string
  done: boolean
  pending_delete: boolean
}

export const load: PageServerLoad = async ({ locals }) => {
  // locals.userid comes from src/hooks.js
  const response = await api('GET', `todos/${locals.userid}`)

  if (response.status === 404) {
    // user hasn't created a todo list.
    // start with an empty array
    return {
      todos: [] as Todo[],
    }
  }

  if (response.status === 200) {
    return {
      todos: (await response.json()) as Todo[],
    }
  }

  throw error(response.status)
}

import type { RequestEvent } from '@sveltejs/kit'
import type { MaybePromise } from '@sveltejs/kit/types/private'
type ServerFormAction = (
  event: RequestEvent & { key: string | null; fields: FormData },
) => MaybePromise<{
  result?: Record<string, any>
  errors?: Record<string, any>
  location?: string
} | void>

// Quick & dirty mockup of the proposed server actions API
const actions: Record<string, ServerFormAction> = {
  async create({ fields, locals }) {
    const res = await api('POST', `todos/${locals.userid}`, {
      text: fields.get('text'),
    })

    if (res.ok) {
      return { result: await res.json() }
    }
  },

  async toggle({ key, fields, locals }) {
    await api('PATCH', `todos/${locals.userid}/${key}`, {
      done: fields.has('done') ? !!fields.get('done') : undefined,
    })
  },

  async edit({ key, fields, locals }) {
    await api('PATCH', `todos/${locals.userid}/${key}`, {
      text: fields.has('text') ? fields.get('text') : undefined,
    })
  },

  async delete({ key, locals }) {
    await api('DELETE', `todos/${locals.userid}/${key}`)
  },
}

export const POST: Action = async (event) => {
  const { request, url } = event
  const action = Object.entries(actions).find(([name]) => url.searchParams.has(`action.${name}`))

  if (action) {
    const [name, handler] = action
    const key = url.searchParams.get(`action.${name}`)
    const fields = await request.formData()

    const response = await handler({ key, fields, ...event })

    // Returning an "error" since the current API doesn't allow returning results
    return { errors: response ?? { result: {} }, status: 200 }
  }
}
