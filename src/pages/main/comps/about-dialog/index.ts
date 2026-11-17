import { defineComponent, reactive, ref, toRefs, computed } from 'vue';
import IterationDialogComp from '../iteration-dialog/index.vue';
import ZDialog from '@/components/ZDialog/index.vue';
import ZButton from '@/components/ZButton/index.vue';
import ZDescriptions from '@/components/ZDescriptions/index.vue';

export default defineComponent({
	components: {
		IterationDialogComp,
		ZDialog,
		ZButton,
		ZDescriptions
	},
	setup() {
		const state = reactive({
			visible: false
		});

		const components = {
			iterationDialogRef: ref(null)
		};

		// 描述列表项（迭代记录行带 action）
		const descItems = computed(() => [
			{ label: '名称', value: __APP_NAME },
			{ label: '描述', value: '一个串口调试软件，配合帧解析可以查看数据波形' },
			{ label: '版本', value: `V${__APP_VERSION__}` },
			{ label: '迭代记录', value: '', action: '查看' }
		]);

		const methods = {
			show() {
				state.visible = true;
			},
			onShowIteration() {
				components.iterationDialogRef.value.show();
				// state.visible = false;
			}
		};

		return {
			__APP_VERSION__,
			__APP_NAME,
			descItems,
			...toRefs(state),
			...methods,
			...components
		};
	}
});
