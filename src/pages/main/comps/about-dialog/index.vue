<template>
	<!-- 关于弹窗：logo + 描述列表 + 迭代记录入口 -->
	<ZDialog v-model:visible="visible" title="关于" width="560px" :close-on-click-modal="false">
		<div class="about">
			<img class="about__logo" src="@/assets/logo.png" width="64" height="64" alt="logo" />
			<ZDescriptions :items="descItems">
				<template #value="{ item }">
					<ZButton v-if="item.action" size="sm" @click="onShowIteration">{{ item.action }}</ZButton>
					<template v-else>{{ item.value }}</template>
				</template>
			</ZDescriptions>
		</div>

		<IterationDialogComp ref="iterationDialogRef" />
	</ZDialog>
</template>

<script lang="ts" src="./index.ts"></script>

<style scoped>
.about {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-lg);
}
.about__logo {
	border-radius: var(--radius-sm);
}
</style>
