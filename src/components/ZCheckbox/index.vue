<template>
	<!-- 复选框：方框磷光绿对勾，支持自定义 label 插槽 -->
	<label class="z-checkbox" :class="{ 'z-checkbox--disabled': disabled }">
		<span class="z-checkbox__box" :class="{ 'is-checked': modelValue }">
			<span v-if="modelValue" class="z-checkbox__tick"></span>
		</span>
		<input
			class="z-checkbox__input"
			type="checkbox"
			:checked="!!modelValue"
			:disabled="disabled"
			@change="onChange"
		/>
		<span class="z-checkbox__label"><slot>{{ label }}</slot></span>
	</label>
</template>

<script lang="ts" setup>
const props = defineProps({
	// v-model 绑定值
	modelValue: { type: Boolean, default: false },
	// 禁用
	disabled: { type: Boolean, default: false },
	// 标签文本（也可用插槽）
	label: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue', 'change']);

function onChange(e: Event) {
	if (props.disabled) return;
	const val = (e.target as HTMLInputElement).checked;
	emit('update:modelValue', val);
	emit('change', val);
}
</script>

<style scoped>
/* —— 复选框：行内块，可点击 —— */
.z-checkbox {
	display: inline-flex;
	align-items: center;
	gap: var(--space-xs);
	cursor: pointer;
	user-select: none;
	font-family: var(--font-body);
	font-size: var(--text-sm);
	color: var(--color-ink);
}

.z-checkbox__box {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 14px;
	height: 14px;
	background: var(--color-paper-3);
	border: 1px solid var(--color-border);
	border-top-color: var(--color-border-dark);
	border-left-color: var(--color-border-dark);
	border-bottom-color: var(--color-border-light);
	border-right-color: var(--color-border-light);
	border-radius: var(--radius-sm);
	flex-shrink: 0;
	transition: border-color var(--dur-fast) var(--ease-out),
		background var(--dur-fast) var(--ease-out);
}
.z-checkbox:hover .z-checkbox__box {
	border-color: var(--color-accent);
}

/* 选中态：磷光绿边框 + 深底 */
.z-checkbox__box.is-checked {
	border-color: var(--color-accent);
	background: var(--color-accent-deep);
}

/* 对勾：纯 CSS 绘制，白色像素风 */
.z-checkbox__tick {
	width: 6px;
	height: 9px;
	border: 2px solid #fff;
	border-top: none;
	border-left: none;
	transform: rotate(45deg) translate(-1px, -1px);
}

.z-checkbox__label {
	line-height: 1.4;
}

/* disabled */
.z-checkbox--disabled {
	cursor: not-allowed;
	color: var(--color-ink-faint);
}
.z-checkbox--disabled .z-checkbox__box {
	background: var(--color-paper);
	border-color: var(--color-border);
}
.z-checkbox--disabled .z-checkbox__box.is-checked {
	border-color: var(--color-border-light);
	background: var(--color-border);
}
.z-checkbox--disabled .z-checkbox__tick {
	border-color: var(--color-ink-faint);
}

/* 隐藏原生 input，仅用于无障碍 */
.z-checkbox__input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
	pointer-events: none;
}
.z-checkbox__input:focus-visible + .z-checkbox__box {
	outline: 2px solid var(--color-focus);
	outline-offset: 1px;
}

@media (prefers-reduced-motion: reduce) {
	.z-checkbox__box {
		transition: none;
	}
}
</style>
