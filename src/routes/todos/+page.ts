import type { PageActionHandlers } from '$lib/actions'
import type { PageData } from './$types'
import type { Todo } from './+page.server'

export const actions: PageActionHandlers<PageData> = {
  async create({ data, submit, fields, form }) {
    const { result } = await submit(fields)

    if (result) {
      data.update(($data) => {
        $data.todos.push(result as Todo)
        return $data
      })

      form.reset()
    }
  },

  toggle({ key, data, submit, fields }) {
    data.update(($data) => {
      const todo = $data.todos.find((todo) => todo.uid === key)
      if (todo) todo.done = !!fields.get('done')
      return $data
    })

    submit(fields)
  },

  edit: ({ submit, fields }) => submit(fields),

  async delete({ key, data, submit, fields }) {
    data.update(($data) => {
      const todo = $data.todos.find((todo) => todo.uid === key)
      if (todo) todo.pending_delete = true
      return $data
    })

    await submit(fields)
  },
}
