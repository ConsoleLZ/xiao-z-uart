<template>
	<!-- 按钮组件：支持 default/primary/danger 变体，完整 8 状态 -->
	<button
		class="z-btn"
		:class="[
			`z-btn--${variant}`,
			{ 'z-btn--sm': size === 'sm' },
			{ 'is-loading': loading },
			{ 'is-success': state === 'success' },
			{ 'is-error': state === 'error' }
		]"
		:type="nativeType"
		:disabled="disabled || loading"
		:aria-invalid="state === 'error' ? 'true' : undefined"
		@click="onClick"
	>
		<span class="z-btn__label"><slot /></span>
	</button>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue';

// 按钮变体类型
type ButtonVariant = 'default' | 'primary' | 'danger';
// 按钮尺寸
type ButtonSize = 'md' | 'sm';
// 原生 type 属性
type NativeType = 'button' | 'submit' | 'reset';
// 临时状态（用于 loading/success/error）
type ButtonState = 'default' | 'success' | 'error';

const props = defineProps({
	// 变体：default 普通 / primary 主操作 / danger 危险操作
	variant: { type: String as PropType<ButtonVariant>, default: 'default' },
	// 尺寸
	size: { type: String as PropType<ButtonSize>, default: 'md' },
	// 禁用
	disabled: { type: Boolean, default: false },
	// 加载中
	loading: { type: Boolean, default: false },
	// 原生 type
	nativeType: { type: String as PropType<NativeType>, default: 'button' },
	// 临时状态：success/error
	state: { type: String as PropType<ButtonState>, default: 'default' }
});

const emit = defineEmits(['click']);
function onClick(e: MouseEvent) {
	if (props.disabled || props.loading) return;
	emit('click', e);
}
</script>

<style scoped>
/* —— 基础按钮：直角凹陷边框，深色仪器风 —— */
.z-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2xs);
	font-family: var(--font-body);
	font-size: var(--text-sm);
	font-weight: 600;
	line-height: 1;
	height: 28px;
	padding: 0 var(--space-md);
	border: 1px solid var(--color-border);
	border-top-color: var(--color-border-light);
	border-left-color: var(--color-border-light);
	border-bottom-color: var(--color-border-dark);
	border-right-color: var(--color-border-dark);
	background: var(--color-paper-2);
	color: var(--color-ink);
	border-radius: var(--radius-sm);
	cursor: pointer;
	transition: background var(--dur-fast) var(--ease-out),
		border-color var(--dur-fast) var(--ease-out),
		color var(--dur-fast) var(--ease-out);
	user-select: none;
	white-space: nowrap;
}

/* 小尺寸 */
.z-btn--sm {
	height: 22px;
	padding: 0 var(--space-sm);
	font-size: var(--text-xs);
}

/* —— hover：略亮 + 磷光绿文字 —— */
.z-btn:hover:not(:disabled):not(.is-loading) {
	background: var(--color-paper-hover);
	border-color: var(--color-accent-deep);
	color: var(--color-accent-ink);
}

/* —— focus-visible：磷光绿环 —— */
.z-btn:focus-visible {
	outline: 2px solid var(--color-focus);
	outline-offset: 1px;
}

/* —— active：下压凹陷 —— */
.z-btn:active:not(:disabled):not(.is-loading) {
	border-top-color: var(--color-border-dark);
	border-left-color: var(--color-border-dark);
	border-bottom-color: var(--color-border-light);
	border-right-color: var(--color-border-light);
	background: var(--color-paper-3);
	transform: translateY(1px);
}

/* —— disabled：灰字不可点 —— */
.z-btn:disabled {
	opacity: 1;
	color: var(--color-ink-faint);
	cursor: not-allowed;
	border-color: var(--color-border);
	background: var(--color-paper);
}

/* —— loading：加载态，凹陷 + 脉动点 —— */
.z-btn.is-loading {
	border-top-color: var(--color-border-dark);
	border-left-color: var(--color-border-dark);
	border-bottom-color: var(--color-border-light);
	border-right-color: var(--color-border-light);
	background: var(--color-paper-3);
	cursor: progress;
	color: var(--color-ink-muted);
}
.z-btn.is-loading .z-btn__label::before {
	content: '●';
	margin-right: var(--space-2xs);
	color: var(--color-accent);
	animation: z-btn-pulse 0.9s var(--ease-in-out) infinite;
	display: inline-block;
}
@keyframes z-btn-pulse {
	0%,
	100% {
		opacity: 0.3;
	}
	50% {
		opacity: 1;
	}
}

/* —— success：磷光绿描边 —— */
.z-btn.is-success {
	border-color: var(--color-success);
	color: var(--color-success);
}
/* —— error：红描边 —— */
.z-btn.is-error {
	border-color: var(--color-danger);
	color: var(--color-danger-ink);
}

/* ====== 变体 primary：磷光绿实心主操作 ====== */
.z-btn--primary {
	background: var(--color-accent-deep);
	color: var(--color-paper);
	border-color: var(--color-accent);
	border-top-color: var(--color-accent);
	border-bottom-color: var(--color-accent-deep);
}
.z-btn--primary:hover:not(:disabled):not(.is-loading) {
	background: var(--color-accent);
	color: var(--color-paper);
	filter: brightness(1.05);
}
.z-btn--primary:active:not(:disabled):not(.is-loading) {
	background: var(--color-accent-deep);
	transform: translateY(1px);
}
.z-btn--primary:disabled {
	background: var(--color-paper);
	color: var(--color-ink-faint);
	border-color: var(--color-border);
}

/* ====== 变体 danger：危险红 ====== */
.z-btn--danger {
	background: var(--color-danger);
	color: #fff;
	border-color: var(--color-danger);
}
.z-btn--danger:hover:not(:disabled):not(.is-loading) {
	filter: brightness(1.12);
}
.z-btn--danger:disabled {
	background: var(--color-paper);
	color: var(--color-ink-faint);
	border-color: var(--color-border);
}

/* reduced-motion：关闭脉动 */
@media (prefers-reduced-motion: reduce) {
	.z-btn,
	.z-btn * {
		transition: none !important;
	}
	.z-btn.is-loading .z-btn__label::before {
		animation: none;
	}
}
</style>
