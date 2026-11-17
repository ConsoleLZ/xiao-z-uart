<template>
	<!-- 数字输入：无控制按钮，纯文本数字输入 -->
	<input
		class="z-input-number"
		:class="{ 'z-input-number--sm': size === 'sm' }"
		type="number"
		:value="modelValue"
		:placeholder="placeholder"
		:disabled="disabled"
		:min="min"
		:max="max"
		:step="step"
		@input="onInput"
		@blur="onBlur"
	/>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue';

type InputSize = 'md' | 'sm';

defineProps({
	// v-model 绑定值
	modelValue: { type: [Number, String] as PropType<number | string | null>, default: null },
	// 占位符
	placeholder: { type: String, default: '' },
	// 禁用
	disabled: { type: Boolean, default: false },
	// 最小值
	min: { type: Number, default: undefined },
	// 最大值
	max: { type: Number, default: undefined },
	// 步进
	step: { type: Number, default: 1 },
	// 尺寸
	size: { type: String as PropType<InputSize>, default: 'md' }
});

const emit = defineEmits(['update:modelValue', 'blur']);

function onInput(e: Event) {
	const raw = (e.target as HTMLInputElement).value;
	if (raw === '') {
		emit('update:modelValue', null);
		return;
	}
	const num = Number(raw);
	emit('update:modelValue', Number.isNaN(num) ? null : num);
}
function onBlur(e: FocusEvent) {
	emit('blur', e);
}
</script>

<style scoped>
/* —— 数字输入：隐藏原生控制按钮，复用 input 视觉 —— */
.z-input-number {
	display: block;
	width: 100%;
	height: 28px;
	padding: 0 var(--space-sm);
	font-family: var(--font-body);
	font-size: var(--text-base);
	color: var(--color-ink);
	background: var(--color-paper-3);
	border: 1px solid var(--color-border);
	border-top-color: var(--color-border-dark);
	border-left-color: var(--color-border-dark);
	border-bottom-color: var(--color-border-light);
	border-right-color: var(--color-border-light);
	border-radius: var(--radius-sm);
	outline: none;
	transition: border-color var(--dur-fast) var(--ease-out),
		box-shadow var(--dur-fast) var(--ease-out);
}
.z-input-number::placeholder {
	color: var(--color-ink-faint);
}
/* 隐藏原生上下箭头按钮 */
.z-input-number::-webkit-outer-spin-button,
.z-input-number::-webkit-inner-spin-button {
	-webkit-appearance: none;
	margin: 0;
}
.z-input-number {
	-moz-appearance: textfield;
}

.z-input-number:hover:not(:disabled) {
	border-color: var(--color-border-light);
}
.z-input-number:focus-visible {
	outline: none;
	border-color: var(--color-accent);
	box-shadow: 0 0 0 1px var(--color-accent);
}
.z-input-number:disabled {
	color: var(--color-ink-faint);
	background: var(--color-paper);
	cursor: not-allowed;
	border-color: var(--color-border);
}

.z-input-number--sm {
	height: 22px;
	font-size: var(--text-xs);
	padding: 0 var(--space-xs);
}

@media (prefers-reduced-motion: reduce) {
	.z-input-number {
		transition: none;
	}
}
</style>
