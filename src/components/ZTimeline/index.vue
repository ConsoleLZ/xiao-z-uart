<template>
	<!-- 时间线：磷光绿节点 + 竖线，替代 el-timeline -->
	<ul class="z-timeline">
		<li
			v-for="(item, i) in items"
			:key="i"
			class="z-timeline__item"
			:class="{ 'z-timeline__item--primary': i === 0 }"
		>
			<div class="z-timeline__dot"></div>
			<div class="z-timeline__content">
				<div class="z-timeline__time">{{ item.timestamp }}</div>
				<div class="z-timeline__body"><slot :item="item" :index="i">{{ item.text }}</slot></div>
			</div>
		</li>
	</ul>
</template>

<script lang="ts" setup>
import { type PropType } from 'vue';

interface TimelineItem {
	timestamp: string;
	text?: string;
	[key: string]: any;
}

defineProps({
	// 时间线条目列表
	items: { type: Array as PropType<TimelineItem[]>, default: () => [] }
});
</script>

<style scoped>
/* —— 时间线：竖向列表，左侧磷光绿节点 —— */
.z-timeline {
	list-style: none;
	position: relative;
	padding-left: var(--space-lg);
}
/* 竖线 */
.z-timeline::before {
	content: '';
	position: absolute;
	left: 5px;
	top: 6px;
	bottom: 6px;
	width: 1px;
	background: var(--color-border);
}
.z-timeline__item {
	position: relative;
	padding-bottom: var(--space-xl);
}
.z-timeline__item:last-child {
	padding-bottom: 0;
}
/* 节点圆点 */
.z-timeline__dot {
	position: absolute;
	left: -15px;
	top: 4px;
	width: 11px;
	height: 11px;
	border-radius: 50%;
	background: var(--color-paper-2);
	border: 2px solid var(--color-border);
	box-sizing: border-box;
}
/* 首项高亮：磷光绿 */
.z-timeline__item--primary .z-timeline__dot {
	border-color: var(--color-accent);
	background: var(--color-accent-deep);
	box-shadow: 0 0 6px -1px var(--color-accent);
}
.z-timeline__time {
	font-family: var(--font-display);
	font-size: var(--text-sm);
	color: var(--color-accent-ink);
	margin-bottom: var(--space-2xs);
	letter-spacing: 0.02em;
}
.z-timeline__body {
	color: var(--color-ink);
	font-size: var(--text-sm);
	line-height: 1.6;
}
</style>
