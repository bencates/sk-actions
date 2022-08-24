import type { PageActionHandlers } from '$lib/actions'
import type { PageData } from './$types'

export const actions: PageActionHandlers<PageData> = {
  async create({ post, fields, form }) {
    const res = await post(fields)

    form.reset()

    return res
  },

  async toggle({ key, data, post, fields }) {
    data.update(($data) => {
      const todo = $data.todos.find((todo) => todo.uid === key)
      if (todo) todo.done = !!fields.get('done')
      return $data
    })

    return post(fields)
  },

  async edit({ post, fields }) {
    return post(fields)
  },

  async delete({ key, data, post, fields }) {
    data.update(($data) => {
      const todo = $data.todos.find((todo) => todo.uid === key)
      if (todo) todo.pending_delete = true
      return $data
    })

    return post(fields)
  },
}
