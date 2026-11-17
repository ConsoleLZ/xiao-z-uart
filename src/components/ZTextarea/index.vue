<template>
	<!-- 多行文本域：等宽字体，凹陷槽，禁用原生缩放改自定义 -->
	<textarea
		ref="taRef"
		class="z-textarea"
		:class="{ 'z-textarea--readonly': readonly }"
		:value="modelValue"
		:placeholder="placeholder"
		:disabled="disabled"
		:readonly="readonly"
		:rows="rows"
		:style="{ fontSize: typeof fontSize === 'number' ? fontSize + 'px' : undefined }"
		@input="onInput"
	></textarea>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

defineProps({
	// v-model 绑定值
	modelValue: { type: String, default: '' },
	// 占位符
	placeholder: { type: String, default: '' },
	// 禁用
	disabled: { type: Boolean, default: false },
	// 只读
	readonly: { type: Boolean, default: false },
	// 行数
	rows: { type: Number, default: 4 },
	// 字体大小（接收区可调）
	fontSize: { type: Number, default: undefined }
});

const emit = defineEmits(['update:modelValue']);
// 暴露原生元素，供父组件滚动控制
const taRef = ref<HTMLTextAreaElement | null>(null);
defineExpose({
	// 直接访问原生 textarea 元素
	get textarea() {
		return taRef.value;
	},
	// 滚动到底部
	scrollToBottom() {
		if (taRef.value) taRef.value.scrollTop = taRef.value.scrollHeight;
	}
});

function onInput(e: Event) {
	emit('update:modelValue', (e.target as HTMLTextAreaElement).value);
}
</script>

<style scoped>
/* —— 文本域：等宽字体，凹陷槽 —— */
.z-textarea {
	display: block;
	width: 100%;
	padding: var(--space-xs) var(--space-sm);
	font-family: var(--font-body);
	font-size: var(--text-md);
	line-height: 1.55;
	color: var(--color-ink);
	background: var(--color-paper-3);
	border: 1px solid var(--color-border);
	border-top-color: var(--color-border-dark);
	border-left-color: var(--color-border-dark);
	border-bottom-color: var(--color-border-light);
	border-right-color: var(--color-border-light);
	border-radius: var(--radius-sm);
	outline: none;
	resize: none;
	transition: border-color var(--dur-fast) var(--ease-out),
		box-shadow var(--dur-fast) var(--ease-out);
}
.z-textarea::placeholder {
	color: var(--color-ink-faint);
}

/* hover */
.z-textarea:hover:not(:disabled):not(:read-only) {
	border-color: var(--color-border-light);
}

/* focus：磷光绿 */
.z-textarea:focus-visible {
	outline: none;
	border-color: var(--color-accent);
	box-shadow: 0 0 0 1px var(--color-accent);
}

/* 只读态：略灰，不变高亮 */
.z-textarea--readonly:focus-visible {
	border-color: var(--color-border-light);
	box-shadow: none;
}

/* disabled */
.z-textarea:disabled {
	color: var(--color-ink-faint);
	background: var(--color-paper);
	cursor: not-allowed;
}

/* 滚动条继承全局 */

@media (prefers-reduced-motion: reduce) {
	.z-textarea {
		transition: none;
	}
}
</style>
