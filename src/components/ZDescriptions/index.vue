<template>
	<!-- 描述列表：key-value 表格，磷光绿分隔行，替代 el-descriptions -->
	<dl class="z-descriptions">
		<div v-for="(item, i) in items" :key="i" class="z-descriptions__row">
			<dt class="z-descriptions__label">{{ item.label }}</dt>
			<dd class="z-descriptions__value"><slot name="value" :item="item" :index="i">{{ item.value }}</slot></dd>
		</div>
	</dl>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue';

interface DescItem {
	label: string;
	value: string | number;
}

defineProps({
	// 描述项列表
	items: { type: Array as PropType<DescItem[]>, default: () => [] }
});
</script>

<style scoped>
/* —— 描述列表：单列 key-value，磷光绿标签 —— */
.z-descriptions {
	width: 100%;
	border: 1px solid var(--color-border);
	border-radius: var(--radius-sm);
	overflow: hidden;
}
.z-descriptions__row {
	display: flex;
	align-items: stretch;
	border-bottom: 1px solid var(--color-border);
}
.z-descriptions__row:last-child {
	border-bottom: none;
}
.z-descriptions__label {
	flex: 0 0 140px;
	padding: var(--space-sm) var(--space-md);
	background: var(--color-paper);
	color: var(--color-accent-ink);
	font-family: var(--font-display);
	font-size: var(--text-sm);
	letter-spacing: 0.02em;
	border-right: 1px solid var(--color-border);
}
.z-descriptions__value {
	flex: 1;
	padding: var(--space-sm) var(--space-md);
	color: var(--color-ink);
	font-size: var(--text-base);
	word-break: break-all;
}
</style>
