<script setup lang="ts">
import { onMounted } from 'vue';
import MainComp from './pages/main/index.vue';

onMounted(() => {
	document.addEventListener('contextmenu', event => {
		event.preventDefault();
	});
});
</script>

<template>
	<main>
		<MainComp />
	</main>
</template>
