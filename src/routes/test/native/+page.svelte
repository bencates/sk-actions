<script lang="ts">
	import { createActions } from '$lib/index.js'
	import { actions as actionHandlers } from '../+layout.js'
	import Test from '../test.svelte'

	const actions = createActions('/test/native', actionHandlers)
</script>

<h1>Native Test Page</h1>

<Test actions={$actions} />
