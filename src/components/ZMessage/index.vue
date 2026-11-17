<template>
	<!-- 消息提示容器：固定顶部居中，磷光绿装饰 -->
	<Teleport to="body">
		<div class="z-message-container">
			<TransitionGroup name="z-message">
				<div
					v-for="msg in messages"
					:key="msg.id"
					class="z-message"
					:class="`z-message--${msg.type}`"
					role="status"
				>
					<span class="z-message__dot"></span>
					<span class="z-message__text">{{ msg.message }}</span>
				</div>
			</TransitionGroup>
		</div>
	</Teleport>
</template>

<script lang="ts" setup>
import { useMessages } from './index';
const messages = useMessages();
</script>

<style scoped>
/* 容器：固定顶部居中 */
.z-message-container {
	position: fixed;
	top: var(--space-lg, 16px);
	left: 50%;
	transform: translateX(-50%);
	z-index: 3000;
	display: flex;
	flex-direction: column;
	gap: var(--space-xs, 6px);
	align-items: center;
	pointer-events: none;
}

/* 单条消息：深底直角条，左侧状态点 */
.z-message {
	display: flex;
	align-items: center;
	gap: var(--space-sm, 8px);
	padding: var(--space-sm, 8px) var(--space-lg, 16px);
	background: var(--color-paper-2);
	border: 1px solid var(--color-border);
	border-left: 3px solid var(--color-accent);
	border-radius: var(--radius-sm, 2px);
	color: var(--color-ink);
	font-family: var(--font-body);
	font-size: var(--text-sm, 12px);
	box-shadow: 0 2px 0 0 rgba(0, 0, 0, 0.4);
	pointer-events: auto;
	min-width: 180px;
}

/* 状态点：默认磷光绿 */
.z-message__dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: var(--color-accent);
	flex-shrink: 0;
	box-shadow: 0 0 6px 0 var(--color-accent);
}

/* 类型变体：仅改状态点颜色与左边框 */
.z-message--success {
	border-left-color: var(--color-success);
}
.z-message--success .z-message__dot {
	background: var(--color-success);
	box-shadow: 0 0 6px 0 var(--color-success);
}

.z-message--error {
	border-left-color: var(--color-danger);
}
.z-message--error .z-message__dot {
	background: var(--color-danger);
	box-shadow: 0 0 6px 0 var(--color-danger);
}

.z-message--warning {
	border-left-color: var(--color-warn);
}
.z-message--warning .z-message__dot {
	background: var(--color-warn);
	box-shadow: 0 0 6px 0 var(--color-warn);
}

.z-message--info {
	border-left-color: var(--color-accent);
}

/* 文字 */
.z-message__text {
	line-height: 1.4;
}

/* —— 进出动效：仅 transform/opacity，符合 reduced-motion —— */
.z-message-enter-from {
	opacity: 0;
	transform: translateY(-8px);
}
.z-message-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}
.z-message-enter-active,
.z-message-leave-active {
	transition: opacity var(--dur-base, 140ms) var(--ease-out, ease-out),
		transform var(--dur-base, 140ms) var(--ease-out, ease-out);
}

@media (prefers-reduced-motion: reduce) {
	.z-message-enter-from,
	.z-message-leave-to {
		transform: none;
	}
	.z-message-enter-active,
	.z-message-leave-active {
		transition-duration: var(--dur-fast, 90ms);
	}
}
</style>
