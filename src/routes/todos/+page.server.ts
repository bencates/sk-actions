import { error } from '@sveltejs/kit'
import { api } from './api'
import type { PageServerLoad, Action } from './$types'

type Todo = {
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
type ServerFormAction = (event: RequestEvent & { fields: FormData }) => ReturnType<Action>

// Quick & dirty mockup of the proposed server actions API
const actions: Record<string, ServerFormAction> = {
  async create({ fields, locals }) {
    await api('POST', `todos/${locals.userid}`, {
      text: fields.get('text'),
    })
  },

  async toggle({ fields, locals }) {
    await api('PATCH', `todos/${locals.userid}/${fields.get('uid')}`, {
      done: fields.has('done') ? !!fields.get('done') : undefined,
    })
  },

  async edit({ fields, locals }) {
    await api('PATCH', `todos/${locals.userid}/${fields.get('uid')}`, {
      text: fields.has('text') ? fields.get('text') : undefined,
    })
  },

  async delete({ fields, locals }) {
    await api('DELETE', `todos/${locals.userid}/${fields.get('uid')}`)
  },
}

export const POST: Action = async (event) => {
  const { request, url } = event
  const action = Object.entries(actions).find(([name]) => url.searchParams.has(`action.${name}`))

  if (action) {
    const handler = action[1]
    const fields = await request.formData()

    await handler({ fields, ...event })
  }
}
