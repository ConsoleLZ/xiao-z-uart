import { defineComponent, reactive, toRefs } from 'vue';
import { ZMessage } from '@/components/ZMessage';
import ZDialog from '@/components/ZDialog/index.vue';
import ZButton from '@/components/ZButton/index.vue';
import ZInputNumber from '@/components/ZInputNumber/index.vue';

export default defineComponent({
	components: { ZDialog, ZButton, ZInputNumber },
	setup(_props, { emit }) {
		const state = reactive({
			visible: false,
			stateForm: {
				showByteNumMax: null,
				fontSize: null
			}
		});

		const methods = {
			show() {
				state.visible = true;
				methods.init();
			},
			init() {
				state.stateForm.showByteNumMax = JSON.parse(localStorage.getItem('showByteNumMax'));
				state.stateForm.fontSize = JSON.parse(localStorage.getItem('fontSize'));
			},
			// 保存
			onConfirm() {
				const stateForm = state.stateForm;

				localStorage.setItem('showByteNumMax', JSON.stringify(stateForm.showByteNumMax));
				localStorage.setItem('fontSize', JSON.stringify(stateForm.fontSize));

				state.visible = false;
				ZMessage.success('保存成功');

				emit('confirm');
			}
		};

		return {
			...toRefs(state),
			...methods
		};
	}
});
