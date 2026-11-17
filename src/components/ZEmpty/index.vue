<template>
	<!-- 空状态：磷光绿占位符，替代 el-empty -->
	<div class="z-empty">
		<div class="z-empty__icon"></div>
		<div class="z-empty__text"><slot>{{ description }}</slot></div>
	</div>
</template>

<script lang="ts" setup>
defineProps({
	// 描述文字
	description: { type: String, default: '暂无数据' }
});
</script>

<style scoped>
/* —— 空状态：居中，磷光绿虚框图标 —— */
.z-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--space-md);
	padding: var(--space-3xl) var(--space-lg);
	color: var(--color-ink-faint);
	font-size: var(--text-sm);
}
.z-empty__icon {
	width: 48px;
	height: 48px;
	border: 1px dashed var(--color-border-light);
	border-radius: var(--radius-md);
	position: relative;
}
.z-empty__icon::before,
.z-empty__icon::after {
	content: '';
	position: absolute;
	background: var(--color-border-light);
}
/* 简单的空白页图标：一条斜线 */
.z-empty__icon::before {
	left: 50%;
	top: 25%;
	bottom: 25%;
	width: 1px;
	transform: translateX(-50%);
}
.z-empty__icon::after {
	left: 25%;
	right: 25%;
	top: 50%;
	height: 1px;
	transform: translateY(-50%);
}
.z-empty__text {
	letter-spacing: 0.02em;
}
</style>
