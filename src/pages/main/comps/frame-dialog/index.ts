import { defineComponent, reactive, toRefs } from 'vue';
import { FrameTypeEnum, frameTypeOptions } from './constants';
import { ZMessage } from '@/components/ZMessage';
import ZDialog from '@/components/ZDialog/index.vue';
import ZButton from '@/components/ZButton/index.vue';
import ZInput from '@/components/ZInput/index.vue';
import ZInputNumber from '@/components/ZInputNumber/index.vue';
import ZSelect from '@/components/ZSelect/index.vue';
import ZCheckbox from '@/components/ZCheckbox/index.vue';
import ZColorPicker from '@/components/ZColorPicker/index.vue';

export default defineComponent({
	components: { ZDialog, ZButton, ZInput, ZInputNumber, ZSelect, ZCheckbox, ZColorPicker },
	emits: ['saved'],
	setup(_, { emit }) {
		const state = reactive({
			visible: false,
			stateForm: {
				frame: [] as any[]
			},
			// 每条帧的校验错误（按 index + 字段名）
			errors: {} as Record<number, Record<string, string>>
		});

		const methods = {
			show() {
				state.visible = true;
				methods.init();
			},
			init() {
				const frame = JSON.parse(localStorage.getItem('frame')) || [];
				state.stateForm.frame = frame;
				state.errors = {};
			},
			onAddFrame() {
				state.stateForm.frame.push({
					header: null,
					dataLength: null,
					type: FrameTypeEnum.HIGH_BEFORE,
					color: '#409EFF',
					antiInterference: false,
					minValue: null,
					maxValue: null
				});
			},
			onDelFrame(index: number) {
				state.stateForm.frame.splice(index, 1);
			},
			onClearFrame() {
				state.stateForm.frame = [];
			},
			// 手动校验：替代 el-form 的 rules 校验
			validate(): boolean {
				state.errors = {};
				let valid = true;
				state.stateForm.frame.forEach((item, index) => {
					const err: Record<string, string> = {};
					// 帧头必填
					if (!item.header || !String(item.header).trim()) {
						err.header = '帧头不能为空';
						valid = false;
					}
					// 数据长度必填且为数字
					if (item.dataLength === null || item.dataLength === undefined || item.dataLength === '') {
						err.dataLength = '数据长度不能为空';
						valid = false;
					} else if (typeof item.dataLength !== 'number' || Number.isNaN(item.dataLength)) {
						err.dataLength = '必须为数字';
						valid = false;
					}
					// 类型必填
					if (!item.type) {
						err.type = '类型不能为空';
						valid = false;
					}
					if (Object.keys(err).length) {
						state.errors[index] = err;
					}
				});
				return valid;
			},
			// 保存
			async onConfirm() {
				const valid = methods.validate();
				if (valid) {
					state.stateForm.frame = state.stateForm.frame.map(item => {
						return {
							...item,
							header: item.header.replace(/\s/g, '')
						};
					});

					localStorage.setItem('frame', JSON.stringify(state.stateForm.frame));
					state.visible = false;
					ZMessage.success('保存成功');
					// 发出保存成功的事件
					emit('saved');
				} else {
					ZMessage.error('请修正标红的字段');
				}
			}
		};

		return {
			frameTypeOptions,
			...toRefs(state),
			...methods
		};
	}
});
