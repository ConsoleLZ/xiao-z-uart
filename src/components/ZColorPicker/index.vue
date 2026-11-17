<template>
	<!-- 颜色选择器：色块 + 隐藏原生 input，替代 el-color-picker -->
	<label class="z-color" :title="modelValue">
		<span class="z-color__swatch" :style="{ background: modelValue || 'transparent' }">
			<span v-if="!modelValue" class="z-color__none">—</span>
		</span>
		<input
			class="z-color__input"
			type="color"
			:value="modelValue || '#000000'"
			@input="onInput"
		/>
	</label>
</template>

<script lang="ts" setup>
defineProps({
	// v-model 绑定值（hex 字符串）
	modelValue: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue']);
function onInput(e: Event) {
	emit('update:modelValue', (e.target as HTMLInputElement).value);
}
</script>

<style scoped>
/* —— 颜色选择器：方形色块 —— */
.z-color {
	display: inline-flex;
	align-items: center;
	cursor: pointer;
	position: relative;
}
.z-color__swatch {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 22px;
	border: 1px solid var(--color-border);
	border-top-color: var(--color-border-dark);
	border-left-color: var(--color-border-dark);
	border-bottom-color: var(--color-border-light);
	border-right-color: var(--color-border-light);
	border-radius: var(--radius-sm);
	transition: border-color var(--dur-fast) var(--ease-out);
}
.z-color:hover .z-color__swatch {
	border-color: var(--color-accent);
}
.z-color__none {
	color: var(--color-ink-faint);
	font-size: var(--text-xs);
}
/* 隐藏原生 input */
.z-color__input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
	pointer-events: none;
}
.z-color__input:focus-visible + .z-color__swatch {
	outline: 2px solid var(--color-focus);
	outline-offset: 1px;
}
</style>
