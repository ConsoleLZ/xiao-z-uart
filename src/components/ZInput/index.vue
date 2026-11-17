<template>
	<!-- 文本输入：直角凹陷槽，磷光绿聚焦 -->
	<input
		class="z-input"
		:class="{ 'z-input--sm': size === 'sm' }"
		:type="type"
		:value="modelValue"
		:placeholder="placeholder"
		:disabled="disabled"
		:readonly="readonly"
		:maxlength="maxlength"
		@input="onInput"
		@blur="onBlur"
	/>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue';

type InputType = 'text' | 'password' | 'number' | 'search';
type InputSize = 'md' | 'sm';

defineProps({
	// v-model 绑定值
	modelValue: { type: [String, Number] as PropType<string | number | null>, default: '' },
	// 占位符
	placeholder: { type: String, default: '' },
	// 类型
	type: { type: String as PropType<InputType>, default: 'text' },
	// 禁用
	disabled: { type: Boolean, default: false },
	// 只读
	readonly: { type: Boolean, default: false },
	// 最大长度
	maxlength: { type: Number, default: undefined },
	// 尺寸
	size: { type: String as PropType<InputSize>, default: 'md' }
});

const emit = defineEmits(['update:modelValue', 'blur']);

function onInput(e: Event) {
	const val = (e.target as HTMLInputElement).value;
	emit('update:modelValue', val);
}
function onBlur(e: FocusEvent) {
	emit('blur', e);
}
</script>

<style scoped>
/* —— 输入框：凹陷槽，深底 —— */
.z-input {
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
.z-input::placeholder {
	color: var(--color-ink-faint);
}

/* hover */
.z-input:hover:not(:disabled):not(:read-only) {
	border-color: var(--color-border-light);
}

/* focus：磷光绿环 */
.z-input:focus-visible {
	outline: none;
	border-color: var(--color-accent);
	box-shadow: 0 0 0 1px var(--color-accent), 0 0 6px -2px var(--color-accent);
}

/* disabled */
.z-input:disabled {
	color: var(--color-ink-faint);
	background: var(--color-paper);
	cursor: not-allowed;
	border-color: var(--color-border);
}

/* 小尺寸 */
.z-input--sm {
	height: 22px;
	font-size: var(--text-xs);
	padding: 0 var(--space-xs);
}

@media (prefers-reduced-motion: reduce) {
	.z-input {
		transition: none;
	}
}
</style>
