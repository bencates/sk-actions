<script lang="ts">
	import type { FormAction } from '$lib/index.js'

	export let actions: Record<string, FormAction>
</script>

<form data-testid="hello-world" action={actions.helloWorld.path} />
