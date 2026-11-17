<template>
	<!-- 迭代记录弹窗：时间线或空状态 -->
	<ZDialog v-model:visible="visible" title="迭代记录" width="560px" :close-on-click-modal="false">
		<div class="iter-body">
			<ZTimeline v-if="iterationRecord.length" :items="timelineItems">
				<template #default="{ item }">
					<div v-for="(c, i) in item.content" :key="i">{{ c }}</div>
				</template>
			</ZTimeline>
			<ZEmpty v-else description="暂无数据" />
		</div>
	</ZDialog>
</template>

<script lang="ts" src="./index.ts"></script>

<style scoped>
.iter-body {
	max-height: 400px;
	overflow: auto;
	padding: var(--space-sm);
}
</style>
