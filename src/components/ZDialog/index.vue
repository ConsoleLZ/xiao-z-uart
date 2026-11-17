<template>
	<!-- 对话框：深色模态窗，磷光绿标题栏，ESC/遮罩关闭可控 -->
	<Teleport to="body">
		<Transition name="z-dialog">
			<div v-if="visible" class="z-dialog-overlay" @click.self="onOverlayClick">
				<div
					class="z-dialog"
					:class="{ 'z-dialog--no-close-on-click': !closeOnClickModal }"
					:style="{ width: typeof width === 'number' ? width + 'px' : width }"
					role="dialog"
					aria-modal="true"
				>
					<div class="z-dialog__header">
						<span class="z-dialog__title">{{ title }}</span>
						<button class="z-dialog__close" @click="onClose" aria-label="关闭">×</button>
					</div>
					<div class="z-dialog__body">
						<slot />
					</div>
					<div v-if="$slots.footer" class="z-dialog__footer">
						<slot name="footer" />
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script lang="ts" setup>
import { watch, onUnmounted, type PropType } from 'vue';

const props = defineProps({
	// 是否显示（v-model）
	visible: { type: Boolean, default: false },
	// 标题
	title: { type: String, default: '' },
	// 宽度
	width: { type: [String, Number] as PropType<string | number>, default: '50%' },
	// 点击遮罩是否关闭
	closeOnClickModal: { type: Boolean, default: true }
});

const emit = defineEmits(['update:visible', 'close']);

function onClose() {
	emit('update:visible', false);
	emit('close');
}
function onOverlayClick() {
	if (props.closeOnClickModal) onClose();
}
function onKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape' && props.visible) onClose();
}

watch(
	() => props.visible,
	v => {
		if (v) {
			window.addEventListener('keydown', onKeydown);
			document.body.style.overflow = 'hidden';
		} else {
			window.removeEventListener('keydown', onKeydown);
			document.body.style.overflow = '';
		}
	}
);

onUnmounted(() => {
	window.removeEventListener('keydown', onKeydown);
	document.body.style.overflow = '';
});
</script>

<style scoped>
/* —— 遮罩层 —— */
.z-dialog-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.55);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 2000;
}

/* —— 对话框主体：深底直角，磷光绿顶栏 —— */
.z-dialog {
	display: flex;
	flex-direction: column;
	max-height: 86vh;
	background: var(--color-paper-2);
	border: 1px solid var(--color-border);
	border-top-color: var(--color-accent);
	border-top-width: 2px;
	border-radius: var(--radius-md);
	box-shadow: 0 4px 0 0 rgba(0, 0, 0, 0.5);
	overflow: hidden;
}

/* —— 标题栏 —— */
.z-dialog__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 34px;
	padding: 0 var(--space-xs) 0 var(--space-md);
	background: linear-gradient(90deg, var(--color-paper) 0%, var(--color-paper-2) 100%);
	border-bottom: 1px solid var(--color-border);
	flex-shrink: 0;
}
.z-dialog__title {
	font-family: var(--font-display);
	font-size: var(--text-sm);
	font-weight: 600;
	color: var(--color-accent-ink);
	letter-spacing: 0.04em;
	text-transform: uppercase;
}
.z-dialog__close {
	width: 22px;
	height: 22px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: transparent;
	border: 1px solid transparent;
	color: var(--color-ink-muted);
	font-size: 18px;
	line-height: 1;
	cursor: pointer;
	border-radius: var(--radius-sm);
	transition: all var(--dur-fast) var(--ease-out);
}
.z-dialog__close:hover {
	color: var(--color-danger-ink);
	border-color: var(--color-danger);
	background: var(--color-paper-3);
}
.z-dialog__close:active {
	transform: translateY(1px);
}

/* —— 内容区 —— */
.z-dialog__body {
	flex: 1;
	padding: var(--space-lg);
	overflow: auto;
	font-family: var(--font-body);
	font-size: var(--text-base);
	color: var(--color-ink);
}

/* —— 底部 —— */
.z-dialog__footer {
	padding: var(--space-sm) var(--space-lg);
	border-top: 1px solid var(--color-border);
	background: var(--color-paper);
	display: flex;
	justify-content: flex-end;
	gap: var(--space-sm);
	flex-shrink: 0;
}

/* —— 进出场动效：仅 opacity + scale —— */
.z-dialog-enter-from,
.z-dialog-leave-to {
	opacity: 0;
}
.z-dialog-enter-from .z-dialog,
.z-dialog-leave-to .z-dialog {
	transform: scale(0.97) translateY(-4px);
}
.z-dialog-enter-active,
.z-dialog-leave-active {
	transition: opacity var(--dur-base) var(--ease-out);
}
.z-dialog-enter-active .z-dialog,
.z-dialog-leave-active .z-dialog {
	transition: transform var(--dur-base) var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
	.z-dialog-enter-active,
	.z-dialog-leave-active,
	.z-dialog-enter-active .z-dialog,
	.z-dialog-leave-active .z-dialog {
		transition-duration: var(--dur-fast);
	}
	.z-dialog-enter-from .z-dialog,
	.z-dialog-leave-to .z-dialog {
		transform: none;
	}
}
</style>
