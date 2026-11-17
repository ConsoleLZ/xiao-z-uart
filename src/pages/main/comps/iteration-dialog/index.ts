import { defineComponent, reactive, toRefs, computed } from 'vue';
import { iterationRecord } from './constants';
import ZDialog from '@/components/ZDialog/index.vue';
import ZTimeline from '@/components/ZTimeline/index.vue';
import ZEmpty from '@/components/ZEmpty/index.vue';

export default defineComponent({
	components: { ZDialog, ZTimeline, ZEmpty },
	setup() {
		const state = reactive({
			visible: false
		});

		// 转为时间线格式（timestamp + text）
		const timelineItems = computed(() =>
			iterationRecord.map(item => ({
				timestamp: item.version,
				text: '',
				content: item.content
			}))
		);

		const methods = {
			show() {
				state.visible = true;
			}
		};

		return {
			iterationRecord,
			timelineItems,
			...toRefs(state),
			...methods
		};
	}
});
