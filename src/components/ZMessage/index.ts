/**
 * ZMessage —— 轻量消息提示，替代 ElMessage
 * 用法：import { ZMessage } from '@/components/ZMessage';
 *       ZMessage.success('保存成功');  ZMessage.error('失败');  ZMessage.info('提示');
 */
import { createApp, ref } from 'vue';
import ZMessageBox from './index.vue';

// 消息类型
export type MessageType = 'success' | 'error' | 'info' | 'warning';

// 单条消息数据
interface MessageItem {
	id: number;
	type: MessageType;
	message: string;
}

// 全局消息队列（由 ZMessageBox 容器组件持有）
const messages = ref<MessageItem[]>([]);
let seed = 0;

// 挂载容器（只挂一次）
let mounted = false;
function ensureContainer() {
	if (mounted) return;
	// 创建挂载点
	const el = document.createElement('div');
	el.className = 'z-message-portal';
	document.body.appendChild(el);
	const app = createApp(ZMessageBox);
	app.mount(el);
	mounted = true;
}

// 移除单条消息
function remove(id: number) {
	const idx = messages.value.findIndex(m => m.id === id);
	if (idx >= 0) messages.value.splice(idx, 1);
}

// 添加一条消息，自动消失
function add(type: MessageType, message: string, duration = 2400) {
	ensureContainer();
	const id = ++seed;
	messages.value.push({ id, type, message });
	setTimeout(() => remove(id), duration);
}

export const ZMessage = {
	success(message: string, duration?: number) {
		add('success', message, duration);
	},
	error(message: string, duration?: number) {
		add('error', message, duration ?? 3200);
	},
	info(message: string, duration?: number) {
		add('info', message, duration);
	},
	warning(message: string, duration?: number) {
		add('warning', message, duration);
	}
};

// 导出消息队列供容器组件消费
export const useMessages = () => messages;
