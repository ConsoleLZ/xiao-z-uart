/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
	let timeoutId;

	return function (...args) {
		// 清除之前的定时器
		clearTimeout(timeoutId);

		// 设置新的定时器
		timeoutId = setTimeout(() => {
			func.apply(this, args);
		}, wait);
	};
}
