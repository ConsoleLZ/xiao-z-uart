<template>
	<!-- 设置弹窗：接收区字符数 + 字体大小 -->
	<ZDialog v-model:visible="visible" title="设置" width="560px">
		<div class="set-form">
			<div class="set-form__row">
				<label class="set-form__label">接收区字符显示数量</label>
				<ZInputNumber v-model="stateForm.showByteNumMax" :min="100" :max="3000" placeholder="请输入" />
			</div>
			<p class="set-form__hint">说明：接收区字符超出后，会自动清空</p>
			<div class="set-form__row">
				<label class="set-form__label">接收区字体大小</label>
				<ZInputNumber v-model="stateForm.fontSize" :min="1" :max="99" placeholder="请输入" />
			</div>
		</div>

		<template #footer>
			<ZButton @click="visible = false">取消</ZButton>
			<ZButton variant="primary" @click="onConfirm">保存</ZButton>
		</template>
	</ZDialog>
</template>

<script lang="ts" src="./index.ts"></script>

<style scoped>
.set-form {
	display: flex;
	flex-direction: column;
	gap: var(--space-md);
}
.set-form__row {
	display: flex;
	align-items: center;
	gap: var(--space-md);
}
.set-form__label {
	flex: 0 0 160px;
	color: var(--color-ink-muted);
	font-size: var(--text-sm);
}
.set-form__label + .z-input-number {
	width: 180px;
}
.set-form__hint {
	font-size: var(--text-xs);
	color: var(--color-ink-faint);
	padding-left: 172px;
	margin-top: -8px;
}
</style>
