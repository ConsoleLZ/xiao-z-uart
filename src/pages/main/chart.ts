export const initChart = (verticalSections = 5) => {
	const referenceLines: { line: HTMLElement; label: HTMLElement }[] = [];

	const smoothie = new SmoothieChart({
		// 按画布在布局中的实际尺寸自适应（含高 DPI 缩放），避免手动按窗口宽度设画布导致溢出容器、右侧 y 轴刻度被裁剪
		responsive: true,
		maxValueScale: 1.5,
		minValueScale: 1.5,
		grid: {
			verticalSections,
			strokeStyle: 'rgb(54, 53, 53)',
			fillStyle: '#221f22',
			lineWidth: 1,
			borderVisible: false
		},
		nonRealtimeData: true,
		tooltip: true, // 启用原生 tooltip
		timestampFormatter: SmoothieChart.timeFormatter,
		labels: {
			showIntermediateLabels: true,
			fillStyle: '#fff',
			precision: 0
		}
	});

	const canvas = document.getElementById('smoothieChart') as HTMLCanvasElement;
	if (!canvas) throw new Error('#smoothieChart not found');

	const parent = canvas.parentElement;
	if (!parent) throw new Error('Canvas must be in a container');
	parent.style.position = 'relative';

	// 创建 overlay 用于参考线和标签
	const overlay = document.createElement('div');
	overlay.style.cssText = `
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    z-index: 10;
  `;
	parent.appendChild(overlay);

	smoothie.streamTo(canvas, 1000);

	// 双击创建参考线
	canvas.addEventListener('click', function (e) {
		const isOpenPort = JSON.parse(localStorage.getItem('isOpenPort'));
		if (isOpenPort) return;
		// 获取当前 tooltip 内容（必须确保 tooltip 存在且已更新）
		const tooltip = document.querySelector('.smoothie-chart-tooltip') as HTMLElement;
		if (!tooltip || tooltip.style.display === 'none') return;

		const tooltipText = tooltip.textContent?.trim().substring(8) || '无数据';
		const x = e.offsetX;

		// 创建参考线
		const line = document.createElement('div');
		line.style.cssText = `
      position: absolute;
      top: 0; bottom: 0;
      left: ${x}px;
      width: 1px;
      background: #bebebeff;
      pointer-events: auto; /* 允许点击删除等 */
    `;

		// 创建标签
		const label = document.createElement('div');
		label.textContent = tooltipText;
		label.style.cssText = `
      position: absolute;
      left: ${x + 5}px;
      top: 10px;
      background: rgba(255,255,255,1);
      color: #000;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      pointer-events: auto;
      cursor: pointer;
    `;

		overlay.appendChild(line);
		overlay.appendChild(label);

		referenceLines.push({ line, label });

		// 点击标签可删除
		label.addEventListener('click', ev => {
			ev.stopPropagation();
			line.remove();
			label.remove();
			const idx = referenceLines.findIndex(r => r.label === label);
			if (idx >= 0) referenceLines.splice(idx, 1);
		});
	});

	return {
		smoothie,
		clearReferenceLines: () => {
			referenceLines.forEach(({ line, label }) => {
				line.remove();
				label.remove();
			});
			referenceLines.length = 0;
		}
	};
};
