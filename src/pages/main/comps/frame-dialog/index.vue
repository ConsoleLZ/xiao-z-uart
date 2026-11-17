<template>
	<!-- 数据帧解析弹窗：可增删的多条帧配置，含手动校验 -->
	<ZDialog v-model:visible="visible" title="数据帧解析" width="760px">
		<div class="frame-list">
			<div
				v-for="(frameItem, index) in stateForm.frame"
				:key="index"
				class="frame-card"
			>
				<div class="frame-card__row">
					<div class="field field--header">
						<label class="field__label">帧头</label>
						<ZInput
							v-model="frameItem.header"
							placeholder="16进制0x开头"
							:class="{ 'is-error': errors[index]?.header }"
						/>
						<span v-if="errors[index]?.header" class="field__error">{{ errors[index].header }}</span>
					</div>
					<div class="field field--len">
						<label class="field__label">数据长度</label>
						<ZInputNumber
							v-model="frameItem.dataLength"
							placeholder="长度"
							:class="{ 'is-error': errors[index]?.dataLength }"
						/>
						<span v-if="errors[index]?.dataLength" class="field__error">{{ errors[index].dataLength }}</span>
					</div>
					<div class="field field--type">
						<label class="field__label">类型</label>
						<ZSelect
							v-model="frameItem.type"
							:options="frameTypeOptions"
							placeholder="类型"
							:class="{ 'is-error': errors[index]?.type }"
						/>
					</div>
					<div class="field field--color">
						<label class="field__label">颜色</label>
						<ZColorPicker v-model="frameItem.color" />
					</div>
					<ZButton variant="danger" size="sm" @click="onDelFrame(index)">删除</ZButton>
				</div>
				<div class="frame-card__row frame-card__row--sub">
					<ZCheckbox v-model="frameItem.antiInterference" label="启用抗干扰" />
					<ZInputNumber v-model="frameItem.minValue" placeholder="最小值" class="field--min" />
					<span class="range-sep">~</span>
					<ZInputNumber v-model="frameItem.maxValue" placeholder="最大值" class="field--max" />
				</div>
			</div>
		</div>

		<div class="frame-toolbar">
			<ZButton @click="onClearFrame">清除</ZButton>
			<ZButton variant="primary" @click="onAddFrame">添加</ZButton>
			<span class="frame-toolbar__hint">↙ 点击添加，可添加一条数据帧</span>
		</div>

		<template #footer>
			<ZButton @click="visible = false">取消</ZButton>
			<ZButton variant="primary" @click="onConfirm">保存</ZButton>
		</template>
	</ZDialog>
</template>

<script lang="ts" src="./index.ts"></script>

<style scoped>
.frame-list {
	max-height: 50vh;
	overflow: auto;
	display: flex;
	flex-direction: column;
	gap: var(--space-md);
}
.frame-card {
	display: flex;
	flex-direction: column;
	gap: var(--space-sm);
	padding: var(--space-md);
	background: var(--color-paper);
	border: 1px solid var(--color-border);
	border-radius: var(--radius-sm);
}
.frame-card__row {
	display: flex;
	align-items: flex-start;
	gap: var(--space-sm);
	flex-wrap: wrap;
}
.frame-card__row--sub {
	padding-left: var(--space-2xs);
	align-items: center;
}

.field {
	display: flex;
	flex-direction: column;
	gap: var(--space-2xs);
}
.field__label {
	font-size: var(--text-xs);
	color: var(--color-ink-muted);
	letter-spacing: 0.02em;
}
.field__error {
	font-size: var(--text-xs);
	color: var(--color-danger-ink);
}
/* 字段宽度 */
.field--header {
	width: 40%;
}
.field--len {
	width: 120px;
}
.field--type {
	width: 160px;
}
.field--color {
	width: 80px;
}
.field--min,
.field--max {
	width: 110px;
}

/* 校验失败时输入框红边 */
:deep(.is-error input),
:deep(.is-error .z-select__field) {
	border-color: var(--color-danger) !important;
}

.range-sep {
	color: var(--color-ink-muted);
	font-size: var(--text-sm);
}

.frame-toolbar {
	display: flex;
	align-items: center;
	gap: var(--space-sm);
	margin-top: var(--space-md);
}
.frame-toolbar__hint {
	font-size: var(--text-xs);
	color: var(--color-ink-faint);
}
</style>
