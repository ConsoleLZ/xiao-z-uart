<template>
	<!-- 下拉选择：自定义弹层，磷光绿高亮，原 element-plus 的 :options 写法兼容 -->
	<div class="z-select" :class="{ 'z-select--open': open, 'z-select--disabled': disabled }" ref="rootRef">
		<div class="z-select__field" @click="toggle" tabindex="0" @keydown.enter.prevent="toggle" @keydown.space.prevent="toggle">
			<span class="z-select__value" :class="{ 'z-select__value--placeholder': !selectedLabel }">
				{{ selectedLabel || placeholder }}
			</span>
			<span class="z-select__caret">▾</span>
		</div>
		<Teleport to="body">
			<div
				v-if="open"
				class="z-select__dropdown"
				:style="dropdownStyle"
				@click.self="close"
			>
				<div
					v-for="opt in options"
					:key="String(opt.value)"
					class="z-select__option"
					:class="{ 'is-selected': opt.value === modelValue }"
					@click="onPick(opt)"
				>
					<span class="z-select__option-label">{{ opt.label }}</span>
					<span v-if="opt.value === modelValue" class="z-select__check">●</span>
				</div>
				<div v-if="!options.length" class="z-select__empty">无选项</div>
			</div>
		</Teleport>
	</div>
</template>

<script lang="ts" setup>
import { ref, computed, onUnmounted, nextTick, type PropType } from 'vue';
import type { SelectOptionsModel } from '@/utils/types';

const props = defineProps({
	// v-model 绑定值
	modelValue: { type: [String, Number] as PropType<string | number | null>, default: null },
	// 选项列表：兼容原 element-plus 的 :options 写法
	options: { type: Array as PropType<SelectOptionsModel[]>, default: () => [] },
	// 占位符
	placeholder: { type: String, default: '请选择' },
	// 禁用
	disabled: { type: Boolean, default: false },
	// 宽度
	width: { type: [String, Number], default: '100%' }
});

const emit = defineEmits(['update:modelValue', 'change']);

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
// 弹层定位（含 maxHeight 防止超出视口）
const dropdownStyle = ref<{ left: string; top: string; width: string; maxHeight?: string }>({ left: '0px', top: '0px', width: '0px' });

// 当前选中项的 label
const selectedLabel = computed(() => {
	const found = props.options.find(o => o.value === props.modelValue);
	return found ? found.label : '';
});

function toggle() {
	if (props.disabled) return;
	if (open.value) close();
	else openDropdown();
}

function openDropdown() {
	open.value = true;
	nextTick(() => {
		positionDropdown();
		window.addEventListener('click', onDocClick, true);
		window.addEventListener('scroll', positionDropdown, true);
		window.addEventListener('resize', positionDropdown);
	});
}

function positionDropdown() {
	const root = rootRef.value;
	if (!root) return;
	const rect = root.getBoundingClientRect();
	// 视口可用空间（留 8px 安全边距）
	const GAP = 8;
	const spaceBelow = window.innerHeight - rect.bottom - GAP;
	const spaceAbove = rect.top - GAP;

	// 读取弹层内容自然高度（scrollHeight 不受 max-height 限制，更稳定）
	const dropdownEl = document.querySelector('.z-select__dropdown') as HTMLElement | null;
	const naturalHeight = dropdownEl ? dropdownEl.scrollHeight : 260;

	// 判定翻转：下方放不下且上方空间更大 → 向上展开
	const flipUp = spaceBelow < naturalHeight && spaceAbove > spaceBelow;

	let top: number;
	let maxHeight: number;
	if (flipUp) {
		// 向上：弹层底边贴字段顶边
		top = rect.top - Math.min(naturalHeight, spaceAbove) - 1;
		maxHeight = spaceAbove;
	} else {
		// 向下：弹层顶边贴字段底边
		top = rect.bottom + 1;
		maxHeight = spaceBelow;
	}
	// 兜底：任一方向都极窄时，给一个最小可滚动高度
	if (maxHeight < 80) maxHeight = Math.max(spaceBelow, spaceAbove, 80);

	dropdownStyle.value = {
		left: rect.left + 'px',
		top: top + 'px',
		width: rect.width + 'px',
		maxHeight: maxHeight + 'px'
	};
}

function close() {
	open.value = false;
	window.removeEventListener('click', onDocClick, true);
	window.removeEventListener('scroll', positionDropdown, true);
	window.removeEventListener('resize', positionDropdown);
}

function onDocClick(e: MouseEvent) {
	const target = e.target as HTMLElement;
	// 点击根节点或弹层内部不关闭
	if (rootRef.value?.contains(target)) return;
	if (target.closest('.z-select__dropdown')) return;
	close();
}

function onPick(opt: SelectOptionsModel) {
	emit('update:modelValue', opt.value);
	emit('change', opt.value);
	close();
}

onUnmounted(() => {
	window.removeEventListener('click', onDocClick, true);
	window.removeEventListener('scroll', positionDropdown, true);
	window.removeEventListener('resize', positionDropdown);
});

// 对外暴露关闭方法
defineExpose({ close });
</script>

<style scoped>
/* —— 选择框：复用 input 视觉，右侧下拉箭头 —— */
.z-select {
	position: relative;
	display: inline-block;
	width: v-bind("typeof width === 'number' ? width + 'px' : width");
}

.z-select__field {
	display: flex;
	align-items: center;
	height: 28px;
	padding: 0 var(--space-xs) 0 var(--space-sm);
	background: var(--color-paper-3);
	border: 1px solid var(--color-border);
	border-top-color: var(--color-border-dark);
	border-left-color: var(--color-border-dark);
	border-bottom-color: var(--color-border-light);
	border-right-color: var(--color-border-light);
	border-radius: var(--radius-sm);
	cursor: pointer;
	user-select: none;
	outline: none;
	transition: border-color var(--dur-fast) var(--ease-out),
		box-shadow var(--dur-fast) var(--ease-out);
}
.z-select__field:hover {
	border-color: var(--color-border-light);
}
.z-select--open .z-select__field {
	border-color: var(--color-accent);
	box-shadow: 0 0 0 1px var(--color-accent);
}

.z-select__value {
	flex: 1;
	font-family: var(--font-body);
	font-size: var(--text-base);
	color: var(--color-ink);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.z-select__value--placeholder {
	color: var(--color-ink-faint);
}

/* 下拉箭头 */
.z-select__caret {
	color: var(--color-ink-muted);
	font-size: var(--text-xs);
	flex-shrink: 0;
	transition: transform var(--dur-fast) var(--ease-out);
}
.z-select--open .z-select__caret {
	transform: rotate(180deg);
	color: var(--color-accent);
}

/* disabled */
.z-select--disabled .z-select__field {
	background: var(--color-paper);
	cursor: not-allowed;
	border-color: var(--color-border);
}
.z-select--disabled .z-select__value {
	color: var(--color-ink-faint);
}
.z-select--disabled .z-select__caret {
	color: var(--color-ink-faint);
}
</style>

<style>
/* —— 弹层：全局，非 scoped（Teleport 到 body） —— */
.z-select__dropdown {
	position: fixed;
	z-index: 2500;
	background: var(--color-paper-2);
	border: 1px solid var(--color-border);
	border-top-color: var(--color-border-light);
	border-left-color: var(--color-border-light);
	border-bottom-color: var(--color-border-dark);
	border-right-color: var(--color-border-dark);
	border-radius: var(--radius-sm);
	box-shadow: 0 2px 0 0 rgba(0, 0, 0, 0.4);
	max-height: 260px;
	overflow-y: auto;
	padding: var(--space-3xs) 0;
	font-family: var(--font-body);
	font-size: var(--text-base);
}
.z-select__option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--space-xs) var(--space-md);
	color: var(--color-ink);
	cursor: pointer;
	transition: background var(--dur-fast) var(--ease-out),
		color var(--dur-fast) var(--ease-out);
}
.z-select__option:hover {
	background: var(--color-paper-hover);
	color: var(--color-accent-ink);
}
.z-select__option.is-selected {
	background: var(--color-paper-active);
	color: var(--color-accent-ink);
}
.z-select__option-label {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
.z-select__check {
	color: var(--color-accent);
	font-size: var(--text-xs);
	flex-shrink: 0;
}
.z-select__empty {
	padding: var(--space-md);
	color: var(--color-ink-faint);
	text-align: center;
	font-size: var(--text-sm);
}

@media (prefers-reduced-motion: reduce) {
	.z-select__field,
	.z-select__caret,
	.z-select__option {
		transition: none;
	}
}
</style>
