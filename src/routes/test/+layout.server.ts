export {}

// import type { Action } from './$types';

// import type { RequestEvent, AwaitedProperties } from '@sveltejs/kit'
// // import type { MaybePromise } from '@sveltejs/kit/types/private';
// type ServerFormAction = (event: RequestEvent & { key: string | null; fields: FormData }) =>
// 	| AwaitedProperties<{
// 			result?: Record<string, any>
// 			errors?: Record<string, any>
// 			location?: string
// 	  }>
// 	| Promise<void>
// 	| void

// const actions: Record<string, ServerFormAction> = {
// 	async helloWorld() {
// 		return
// 	},
// }

// // Quick & dirty mockup of the proposed server actions API
// export const POST /*: Action */ = async (event: any) => {
// 	const { request, url } = event
// 	const action = Object.entries(actions).find(([name]) => url.searchParams.has(`action.${name}`))

// 	if (action) {
// 		const [name, handler] = action
// 		const key = url.searchParams.get(`action.${name}`)
// 		const fields = await request.formData()

// 		const response = await handler({ key, fields, ...event })

// 		// Returning an "error" since the current API doesn't allow returning results
// 		return { errors: response ?? { result: {} }, status: 200 }
// 	}
// }
