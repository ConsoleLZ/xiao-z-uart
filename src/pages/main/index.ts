import { defineComponent, onMounted, reactive, toRefs, ref, nextTick, onUnmounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { baudRateOptions, verifyOptions, VerifyEnum, receiveEncodingOptions } from './constants';
import { StateModel } from './types';
import { ZMessage } from '@/components/ZMessage';
import SetDialogComp from './comps/set-dialog/index.vue';
import { initChart } from './chart.ts';
import FrameDialogComp from './comps/frame-dialog/index.vue';
import AboutDialogComp from './comps/about-dialog/index.vue';
import { debounce } from '@/utils/utils.ts';
// —— 自研基础组件 ——
import ZButton from '@/components/ZButton/index.vue';
import ZInput from '@/components/ZInput/index.vue';
import ZTextarea from '@/components/ZTextarea/index.vue';
import ZInputNumber from '@/components/ZInputNumber/index.vue';
import ZSelect from '@/components/ZSelect/index.vue';
import ZCheckbox from '@/components/ZCheckbox/index.vue';

export default defineComponent({
	components: {
		SetDialogComp,
		FrameDialogComp,
		AboutDialogComp,
		ZButton,
		ZInput,
		ZTextarea,
		ZInputNumber,
		ZSelect,
		ZCheckbox
	},
	setup() {
		const state = reactive<StateModel>({
			receiveData: null,
			sendData: null,
			portValue: null, // 端口号
			baudRateValue: null, // 波特率
			isCustomBaudRate: false, // 自定义波特率
			portOptions: [],
			isOpenPort: false, // 是否打开串口
			isSend16: false, // 发送16进制数据
			isReceive16: false, // 接收16进制数据
			isDividePacket: true, // 分包显示
			showByteNumMax: null, // 接收区最多显示的字符数量（分包和不分包判断逻辑不同，分包的话判断行数）
			fontSize: null, // 字体大小设置
			mode: false, // 模式（true: 图形，false: 文字）
			isFrameAnalysis: false, // 帧解析
			uartVerify: VerifyEnum.NONE,
			receiveEncoding: 'gbk', // 接收文本解码：'gbk' | 'utf-8'，默认 GBK（国内单片机/串口设备主流编码）
			chartLine: []
		});

		// 帧配置缓存
		let frameConfigsCache: any[] = [];

		let chart;
		const chartInitialized = ref(false); // 跟踪图表是否已初始化
		const constants = {
			baudRateOptions,
			verifyOptions,
			receiveEncodingOptions
		};
		let verticalSections;

		const components = {
			receiveTextareaRef: ref(null),
			setDialogRef: ref(null),
			frameDialogRef: ref(null),
			receiveListRef: ref(null),
			aboutDialogRef: ref(null)
		};

		// 流式解码器：缓存被数据包截断的多字节序列，保证中文能完整显示
		// 编码跟随 state.receiveEncoding（GBK / UTF-8）切换
		let receiveDecoder = new TextDecoder('gbk');

		// 非帧模式解码：stream: true 跨包缓存不完整多字节序列
		const decodeReceiveBytes = (bytes: number[]) => {
			return receiveDecoder.decode(new Uint8Array(bytes), { stream: true });
		};

		// 帧模式解码：每帧独立，避免上一帧缓存的半截字节污染下一帧
		const decodeFrameBytes = (bytes: number[]) => {
			return new TextDecoder(state.receiveEncoding).decode(new Uint8Array(bytes));
		};

		// 重置解码器，丢弃缓存的半截字符（清空数据、切换编码、切换显示模式时调用）
		const resetReceiveDecoder = () => {
			receiveDecoder = new TextDecoder(state.receiveEncoding);
		};

		// 记录按键数据（excel表格格式）
		const excelData: any = {
			sheets: [],
			file_name: '小z串口助手数据记录.xlsx'
		};

		// 保存历史数值用于波动分析（按帧头为key）
		const numericDataHistory: { [key: string]: number[] } = {};

		// 数据波动分析算法
		const calculateFluctuationMetrics = (values: number[]) => {
			if (!values || values.length === 0) {
				return {
					mean: 0,
					variance: 0,
					stdDev: 0,
					range: 0,
					cv: 0,
					min: 0,
					max: 0,
					count: 0
				};
			}

			const count = values.length;
			const min = Math.min(...values);
			const max = Math.max(...values);
			const range = max - min;

			// 计算均值
			const sum = values.reduce((acc, val) => acc + val, 0);
			const mean = sum / count;

			// 计算方差和标准差
			const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
			const avgSquaredDiff = squaredDifferences.reduce((acc, val) => acc + val, 0) / count;
			const variance = avgSquaredDiff;
			const stdDev = Math.sqrt(variance);

			// 变异系数（标准差/均值）
			const cv = mean !== 0 ? stdDev / mean : 0;

			return {
				mean,
				variance,
				stdDev,
				range,
				cv,
				min,
				max,
				count
			};
		};

		// 记录按键数据（txt格式）
		const txtData: any = {
			content: '',
			file_name: '小z串口助手数据记录.txt'
		};

		const methods = {
			changeUi(mode = true) {
				// 字体大小已通过 ZTextarea 的 fontSize prop 绑定，无需手动 DOM
				if (mode) {
					// 图形模式下：调整发送区文本域高度与操作区一致
					const textareaSendDom = document.querySelector(
						'.send-area__input .z-textarea'
					) as HTMLElement | null;
					const mainActionDom = document.querySelector('.main-action') as HTMLElement | null;

					// 画布尺寸由 smoothie 的 responsive 模式按实际布局自适应，这里只估算网格段数
					// （原先按 window.innerWidth 设画布宽度会超出容器，右侧 y 轴刻度被裁掉）
					if (mainActionDom) {
						const chartHeight = window.innerHeight - mainActionDom.offsetHeight - 100;
						verticalSections = Math.floor(chartHeight / 60);
					}
					if (textareaSendDom && mainActionDom) {
						textareaSendDom.style.height = mainActionDom.offsetHeight + 'px';
					}
				}
			},
			init() {
				const isSend16 = JSON.parse(localStorage.getItem('isSend16')) || false;
				const isReceive16 = JSON.parse(localStorage.getItem('isReceive16')) || false;
				const isCustomBaudRate = JSON.parse(localStorage.getItem('isCustomBaudRate')) || false;
				const baudRateValue = JSON.parse(localStorage.getItem('baudRateValue')) || 9600;
				const isDividePacket = JSON.parse(localStorage.getItem('isDividePacket'));
				const showByteNumMax = JSON.parse(localStorage.getItem('showByteNumMax'));
				const fontSize = JSON.parse(localStorage.getItem('fontSize'));
				const isFrameAnalysis = JSON.parse(localStorage.getItem('isFrameAnalysis'));
				const mode = JSON.parse(localStorage.getItem('mode'));
				const receiveEncoding = localStorage.getItem('receiveEncoding') || 'gbk';

				state.isSend16 = isSend16;
				state.isReceive16 = isReceive16;
				state.baudRateValue = baudRateValue;
				state.isCustomBaudRate = isCustomBaudRate;
				state.isFrameAnalysis = isFrameAnalysis;
				state.mode = mode;
				state.receiveEncoding = receiveEncoding;

				// 加载帧配置
				frameConfigsCache = JSON.parse(localStorage.getItem('frame')) || [];

				if (isDividePacket != null) {
					state.isDividePacket = isDividePacket;
				} else {
					state.isDividePacket = true;
				}
				if (state.isDividePacket) {
					state.receiveData = [];
				} else {
					state.receiveData = '';
				}

				if (showByteNumMax != null) {
					state.showByteNumMax = showByteNumMax;
				} else {
					state.showByteNumMax = 2000;
					localStorage.setItem('showByteNumMax', JSON.stringify(state.showByteNumMax));
				}

				if (fontSize != null) {
					state.fontSize = fontSize;
				} else {
					state.fontSize = 14;
					localStorage.setItem('fontSize', JSON.stringify(state.fontSize));
				}

				methods.changeUi();
				const frameConfigs = JSON.parse(localStorage.getItem('frame'))?.map(item => {
					return {
						...item,
						header: item.header.split(',')
					};
				});

				// 按持久化的编码重建解码器，保证启动后立即按正确编码解码
				resetReceiveDecoder();

				if (state.mode) {
					nextTick(() => {
						// 只有在图表未初始化时才初始化图表
						if (!chartInitialized.value) {
							chart = initChart(verticalSections);
							chartInitialized.value = true;
						}
						methods.setChartLine(frameConfigs);
					});
				} else {
					state.chartLine = [];
				}
			},
			onShowAbout() {
				components.aboutDialogRef.value.show();
			},
			// 模式切换
			onChangeMode() {
				const frameConfigs = JSON.parse(localStorage.getItem('frame'))?.map(item => {
					return {
						...item,
						header: item.header.split(',')
					};
				});

				state.mode = !state.mode;
				if (state.mode) {
					nextTick(() => {
						// 只有在图表未初始化时才初始化图表
						if (!chartInitialized.value) {
							chart = initChart(verticalSections);
							chartInitialized.value = true;
						}
						methods.setChartLine(frameConfigs);
					});
				} else {
					state.chartLine = [];
				}

				localStorage.setItem('mode', JSON.stringify(state.mode));

				// 滚动
			setTimeout(() => {
				const listEl = components.receiveListRef.value;
				if (listEl) listEl.scrollTop = listEl.scrollHeight;
				components.receiveTextareaRef.value?.scrollToBottom();
			}, 10);
			},
			// 帧解析的设置
			onFrameSet() {
				components.frameDialogRef.value.show();
			},
			// 数据记录
			recordData(payload, displayText) {
				if (state.isDividePacket) {
					txtData.content += displayText + '\n';
				} else {
					txtData.content += displayText;
				}

				if (state.isFrameAnalysis) {
					const headerKey = JSON.stringify(payload.header);
					const sheetName = `帧头-${payload.header?.join(',')}`;

					if (!excelData.sheets.some(item => item.name === sheetName)) {
						excelData.sheets.push({
							name: sheetName,
							columns: [
								{
									header: '时间',
									field: 'time',
									width: 30
								},
								{
									header: '数据',
									field: headerKey,
									width: 15
								}
							],
							rows: []
						});
					}

					// 存储数值历史用于波动分析
					if (typeof payload.decimalValue === 'number' && !isNaN(payload.decimalValue)) {
						if (!numericDataHistory[headerKey]) {
							numericDataHistory[headerKey] = [];
						}
						numericDataHistory[headerKey].push(payload.decimalValue);
					}

					// 存储按键数据
					const excelRow = {
						time: new Date().toLocaleString(),
						[headerKey]: payload.decimalValue
					};
					excelData.sheets
						.find(item => item.name === sheetName)
						.rows.push(excelRow);
				}
			},
			// 设置图形显示
			setChartLine(frameConfigs) {
				state.chartLine = []; // 清空

				frameConfigs.forEach(item => {
					const line = new TimeSeries();

					state.chartLine.push({
						line,
						header: item.header
					});
					chart.smoothie.addTimeSeries(line, {
						strokeStyle: item.color,
						lineWidth: 2
					});
				});
			},
			async onChangeFrameAnalysis(value: boolean) {
				localStorage.setItem('isFrameAnalysis', JSON.stringify(value));
				const frameConfigs = JSON.parse(localStorage.getItem('frame'))?.map(item => {
					return {
						...item,
						header: item.header.split(',')
					};
				});

				// 更新帧配置缓存
				frameConfigsCache = JSON.parse(localStorage.getItem('frame')) || [];

				if (value && (!frameConfigs || !frameConfigs.length)) {
					components.frameDialogRef.value.show();
				}

				if (state.mode) {
					methods.setChartLine(frameConfigs);
				} else {
					state.chartLine = [];
				}

				// 设置帧解析
				if (state.isFrameAnalysis) {
					if (frameConfigs && frameConfigs.length) {
						await invoke('set_frame_config', { configs: frameConfigs });
					} else {
						await invoke('set_frame_config', { configs: null });
					}
				} else {
					await invoke('set_frame_config', { configs: null });
				}
			},
			// 导出txt
			async onExportTxt() {
				try {
					await invoke<string>('export_to_txt', { data: txtData });
					ZMessage.success('导出成功');
				} catch (error) {
					ZMessage.error('导出失败: ' + error);
				}
			},
			async onExportExcel() {
				try {
					// 检查是否启用帧解析且有数据
					if (state.isFrameAnalysis) {
						// 深拷贝一份数据用于导出
						const exportData = JSON.parse(JSON.stringify(excelData));

						// 为每个sheet添加波动分析
						exportData.sheets.forEach((sheet: any) => {
							// 找到数据列的field（排除时间列）
							const dataColumnField = sheet.columns.find((col: any) => col.header === '数据')?.field;
							if (!dataColumnField) return;

							// 获取历史数据
							const values = numericDataHistory[dataColumnField];
							if (!values || values.length === 0) return;

							// 计算波动指标
							const metrics = calculateFluctuationMetrics(values);

							// 添加波动分析列
							const fluctuationColumns = [
								{ header: '均值', field: 'fluc_mean', width: 12 },
								{ header: '最小值', field: 'fluc_min', width: 12 },
								{ header: '最大值', field: 'fluc_max', width: 12 },
								{ header: '极差', field: 'fluc_range', width: 12 },
								{ header: '方差', field: 'fluc_variance', width: 15 },
								{ header: '标准差', field: 'fluc_stdDev', width: 15 },
								{ header: '变异系数', field: 'fluc_cv', width: 15 },
								{ header: '数据量', field: 'fluc_count', width: 10 }
							];

							// 添加列到sheet
							sheet.columns = [...sheet.columns, ...fluctuationColumns];

							// 只为第一行添加波动指标，其他行留空
							sheet.rows.forEach((row: any, index: number) => {
								if (index === 0) {
									row.fluc_mean = metrics.mean;
									row.fluc_min = metrics.min;
									row.fluc_max = metrics.max;
									row.fluc_range = metrics.range;
									row.fluc_variance = metrics.variance;
									row.fluc_stdDev = metrics.stdDev;
									row.fluc_cv = metrics.cv;
									row.fluc_count = metrics.count;
								} else {
									row.fluc_mean = '';
									row.fluc_min = '';
									row.fluc_max = '';
									row.fluc_range = '';
									row.fluc_variance = '';
									row.fluc_stdDev = '';
									row.fluc_cv = '';
									row.fluc_count = '';
								}
							});

							// 添加参数说明行
							const explanationRows = [
								{ time: '', [dataColumnField]: '', fluc_mean: '--- 参数说明 ---' },
								{ time: '', [dataColumnField]: '', fluc_mean: '均值', fluc_min: '数据的平均值', fluc_max: '平均值越大，整体水平越高' },
								{ time: '', [dataColumnField]: '', fluc_mean: '最小值', fluc_min: '数据中的最小值' },
								{ time: '', [dataColumnField]: '', fluc_mean: '最大值', fluc_min: '数据中的最大值' },
								{ time: '', [dataColumnField]: '', fluc_mean: '极差', fluc_min: '最大值减最小值', fluc_max: '极差越大，波动范围越大' },
								{ time: '', [dataColumnField]: '', fluc_mean: '方差', fluc_min: '数据离散程度', fluc_max: '方差越大，数据越分散' },
								{ time: '', [dataColumnField]: '', fluc_mean: '标准差', fluc_min: '方差的平方根', fluc_max: '标准差越大，波动越大' },
								{ time: '', [dataColumnField]: '', fluc_mean: '变异系数', fluc_min: '标准差/均值', fluc_max: '用于比较不同量级数据的波动' },
								{ time: '', [dataColumnField]: '', fluc_mean: '数据量', fluc_min: '参与统计的数据点数' }
							];

							// 添加空行分隔
							sheet.rows.push({ time: '', [dataColumnField]: '', fluc_mean: '', fluc_min: '', fluc_max: '', fluc_range: '', fluc_variance: '', fluc_stdDev: '', fluc_cv: '', fluc_count: '' });

							// 添加说明行
							explanationRows.forEach(row => {
								sheet.rows.push({
									...row,
									fluc_range: '',
									fluc_variance: '',
									fluc_stdDev: '',
									fluc_cv: '',
									fluc_count: ''
								});
							});
						});

						// 如果有多个工作表，添加合并工作表
						if (exportData.sheets.length > 1) {
							const mergedSheet: any = {
								name: '合并数据',
								columns: [],
								rows: []
							};

							// 构建合并后的列
							exportData.sheets.forEach((sheet: any, sheetIndex: number) => {
								// 只保留时间和数据列，跳过波动分析列
								mergedSheet.columns.push({
									header: `${sheet.name} 时间`,
									field: `time_${sheetIndex}`,
									width: 25
								});
								mergedSheet.columns.push({
									header: `${sheet.name} 数据`,
									field: `data_${sheetIndex}`,
									width: 15
								});
							});

							// 找到最大行数
							const maxRows = Math.max(...exportData.sheets.map((sheet: any) => sheet.rows.length));

							// 构建合并后的行
							for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
								const mergedRow: any = {};

								exportData.sheets.forEach((sheet: any, sheetIndex: number) => {
									const row = sheet.rows[rowIndex];
									if (row) {
										// 找到数据列的field（排除时间列）
										const dataColumnField = sheet.columns.find((col: any) => col.header === '数据')?.field;
										mergedRow[`time_${sheetIndex}`] = row.time || '';
										mergedRow[`data_${sheetIndex}`] = row[dataColumnField] || '';
									} else {
										mergedRow[`time_${sheetIndex}`] = '';
										mergedRow[`data_${sheetIndex}`] = '';
									}
								});

								mergedSheet.rows.push(mergedRow);
							}

							// 将合并工作表添加到第一个位置
							exportData.sheets.unshift(mergedSheet);
						}

						await invoke<string>('export_to_excel', { data: exportData });
					} else {
						// 没有启用帧解析，按原有方式导出
						await invoke<string>('export_to_excel', { data: excelData });
					}

					ZMessage.success('导出成功');
				} catch (error) {
					ZMessage.error('导出失败: ' + error);
				}
			},
			clearData() {
				txtData.content = '';
				// 丢弃解码器中缓存的半截字符，避免残留字节影响下一批数据显示
				resetReceiveDecoder();
				excelData.sheets.forEach(item => {
					item.rows = [];
				});
				// 清空历史数据
				Object.keys(numericDataHistory).forEach(key => {
					delete numericDataHistory[key];
				});
			},
			onClearData() {
				methods.clearData();
				ZMessage.info('数据已清空');
			},
			onRefresh() {
				window.location.reload();
			},
			async onOpen() {
				// 更新帧配置缓存
				frameConfigsCache = JSON.parse(localStorage.getItem('frame')) || [];

				const frameConfigs = JSON.parse(localStorage.getItem('frame'))?.map(item => {
					return {
						...item,
						header: item.header.split(',')
					};
				});
				// 判断端口和波特率是否选择
				if (!state.portValue || !state.baudRateValue) {
					ZMessage.error('端口和波特率不能为空');
					return;
				}

				// 设置帧解析
				if (state.isFrameAnalysis) {
					if (frameConfigs && frameConfigs.length) {
						await invoke('set_frame_config', { configs: frameConfigs });
					} else {
						await invoke('set_frame_config', { configs: null });
					}
				} else {
					await invoke('set_frame_config', { configs: null });
				}

				if (!state.isOpenPort) {
					// 每次打开串口的时候清空数据
					methods.clearData();
					try {
						if (state.mode) {
							// 确保图表已初始化
							if (!chartInitialized.value) {
								chart = initChart(verticalSections);
								chartInitialized.value = true;
							}
							methods.setChartLine(frameConfigs);
							chart.clearReferenceLines();
						} else {
							state.chartLine = [];
						}

						await invoke('open_port', {
							portName: state.portValue,
							baudRate: state.baudRateValue,
							parity: state.uartVerify
						});
						state.isOpenPort = true;
					} catch (error) {
						ZMessage.error(`打开串口失败，${error}`);
					}
				} else {
					state.isOpenPort = false;
					await invoke('close_port');
				}

				localStorage.setItem('isOpenPort', JSON.stringify(state.isOpenPort));
			},
			async onSend() {
				if (!state.isOpenPort) {
					ZMessage.error('串口未打开');
					return;
				}

				if (state.isSend16) {
					// 16进制发送：空格隔开，无需 0x 前缀（parseInt 基数 16 兼容两种写法）
					const dataList = state.sendData
						.split(/\s+/)
						.filter(Boolean)
						.map(item => parseInt(item, 16));

					await invoke('send_data', {
						data: dataList
					});
				} else {
					await invoke('send_data', {
						data: state.sendData
					});
				}

				// 发送回显：按分包模式分支（与非分包的字符串态一致），避免 [object Object]
				if (state.isDividePacket) {
					state.receiveData = [
						...state.receiveData,
						{
							id: state.receiveData.length,
							content: `发 → ${state.sendData}`
						}
					];
				} else {
					state.receiveData += `发 → ${state.sendData}`;
				}
				// 自动滚动
				components.receiveTextareaRef.value?.scrollToBottom();
			},
			onClearReferenceLines() {
				if (chart) {
					chart.clearReferenceLines();
				}
			},
			// 显示设置
			onShowSet() {
				components.setDialogRef.value.show();
			},
			onChangeSend16() {
				localStorage.setItem('isSend16', JSON.stringify(state.isSend16));
			},
			onChangeReceive16() {
				// 切换显示模式时重置解码缓存，避免 16 进制模式下缓存的半截字符丢失或错乱
				resetReceiveDecoder();
				localStorage.setItem('isReceive16', JSON.stringify(state.isReceive16));
			},
			onChangeReceiveEncoding() {
				// 切换编码时重置流式解码器的缓存，后续收到的数据按新编码解码
				resetReceiveDecoder();
				localStorage.setItem('receiveEncoding', state.receiveEncoding);
			},
			onChangeBaudRate() {
				localStorage.setItem('baudRateValue', JSON.stringify(state.baudRateValue));
			},
			onChangeDividePacket() {
				if (state.isDividePacket) {
					state.receiveData = [];
				} else {
					state.receiveData = '';
				}

				methods.changeUi(false);

				localStorage.setItem('isDividePacket', JSON.stringify(state.isDividePacket));
			},
			// 帧对话框保存后的事件处理
			onFrameDialogSaved() {
				// 更新帧配置缓存
				frameConfigsCache = JSON.parse(localStorage.getItem('frame')) || [];
			},
			// 检查值是否在对应帧的有效范围内
			isValueValid(frameHeader: number[], value: number): boolean {
				// 如果帧解析关闭，直接返回有效
				if (!state.isFrameAnalysis) {
					return true;
				}

				// 查找对应的帧配置
				const config = frameConfigsCache.find(c => {
					try {
						const configHeader = c.header.split(',').map(h => {
							h = h.trim();
							// 处理16进制格式的帧头，如 0x01,0x02
							if (h.toLowerCase().startsWith('0x')) {
								return parseInt(h, 16);
							}
							// 处理十进制格式的帧头
							return parseInt(h, 10);
						});
						// 比较两个数组是否完全相等
						return JSON.stringify(configHeader) === JSON.stringify(frameHeader);
					} catch (e) {
						return false;
					}
				});

				// 如果没有找到配置或者没有启用抗干扰，返回有效
				if (!config || !config.antiInterference) {
					return true;
				}

				// 检查值是否在设定的阈值范围内
				return value >= (config.minValue ?? -1000000) && value <= (config.maxValue ?? 1000000);
			},
			// 清空发送区
			onClearSend() {
				state.sendData = '';
			},
			// 清空接收区
			onClearReceive() {
				resetReceiveDecoder();
				if (state.isDividePacket) {
					state.receiveData = [];
				} else {
					state.receiveData = '';
				}
				state.chartLine.forEach(item => {
					item.line.clear();
				});
			},
			// 获取端口
			async getPort() {
				const portList = (await invoke('list_ports')) as string[];
				// 默认第一个
				if (portList.length) {
					state.portValue = portList[0];
				}

				state.portOptions = portList.map(item => {
					return {
						value: item,
						label: item
					};
				});

				if (!portList.includes(state.portValue)) {
					state.portValue = null;
				}
			},
			// 自定义波特率
			onChangeRate() {
				state.baudRateValue = null;
				localStorage.setItem('isCustomBaudRate', JSON.stringify(state.isCustomBaudRate));
			},
			// 自动清空接收区
			autoClearReceive() {
				let receiveDataLength = null;
				if (state.isDividePacket) {
					receiveDataLength = state.receiveData.length;
				} else {
					receiveDataLength = state.receiveData.length / 10;
				}

				if (receiveDataLength > state.showByteNumMax) {
					const delNum = 200; // 删除的数量
					if (state.isDividePacket) {
						state.receiveData.splice(0, delNum);
					} else {
						const receiveDataSlice = state.receiveData.substring(delNum * 10);

						state.receiveData = receiveDataSlice;
					}
				}
			},
			// 设置保存触发
			onConfirmSet() {
				methods.init();
			},
			// 添加一个清理图表的方法
			destroyChart() {
				if (chart) {
					chart.clearReferenceLines();
					chart = null;
				}
				chartInitialized.value = false;
				state.chartLine = [];
			},
			// 窗口尺寸改变触发
			handleResize() {
				window.location.reload();
			}
		};

		onMounted(() => {
			const debouncedHandleResize = debounce(methods.handleResize, 300);
			methods.init();
			methods.getPort();

			window.addEventListener('resize', debouncedHandleResize);
		});

		// 组件卸载时清理
		onUnmounted(() => {
			methods.destroyChart();
		});

		listen('serial_data', e => {
			let displayText = '';
			let frame;

			const payload: any = e.payload;

			// === 数据解析逻辑 ===
			if (Array.isArray(payload)) {
				const bytes = payload as number[];
				if (state.isReceive16) {
					displayText = bytes.map(item => item.toString(16).padStart(2, '0').toUpperCase()).join(' ') + ' ';
				} else {
					// 按选择的编码（GBK/UTF-8）流式解码，跨包缓存不完整多字节序列
					displayText = decodeReceiveBytes(bytes);
				}
			} else if (payload && typeof payload === 'object') {
				frame = payload as {
					header: number[];
					payload: number[];
					decimalValue: number;
					frameType: string;
					dataLength: number;
				};

				// 抗干扰检查：如果启用了抗干扰且值不在有效范围内，直接丢弃该数据
				if (frame && typeof frame.decimalValue === 'number' && !methods.isValueValid(frame.header, frame.decimalValue)) {
					return;
				}

				if (state.isReceive16) {
					const allBytes = [...frame.header, ...frame.payload];
					displayText =
						allBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ') +
						` [Dec: ${frame.decimalValue}] `;
				} else {
					// 帧数据独立解码，避免上一帧缓存的半截字节污染下一帧
					displayText = decodeFrameBytes(frame.payload);
				}
			} else {
				displayText = `[Unknown data: ${JSON.stringify(payload)}] `;
			}

			methods.recordData(payload, displayText);
			// --- 执行具体逻辑 ---
			if (!state.mode) {
				// 【文本模式逻辑】

				if (state.isDividePacket) {
					state.receiveData = [
						...state.receiveData,
						{
							id: state.receiveData.length,
							content: `收 ← ${displayText}`
						}
					];
				} else {
					state.receiveData += displayText;
				}

				// 滚动到底部 (原生列表)
				nextTick(() => {
					const listEl = components.receiveListRef.value;
					if (listEl) listEl.scrollTop = listEl.scrollHeight;
				});

				// 滚动到底部 (ZTextarea)
				components.receiveTextareaRef.value?.scrollToBottom();
			} else {
				// 【绘图模式逻辑】
				if (state.isFrameAnalysis && frame) {
					const frameHeader = frame.header.map(item => '0x' + item.toString(16).toUpperCase());

					state.chartLine.forEach(item => {
						if (
							JSON.stringify(item.header).toUpperCase() === JSON.stringify(frameHeader).toUpperCase()
						) {
							const now = Date.now();
							item.line.append(now, frame.decimalValue);
						}
					});
				}
			}

			// --- 公共清理逻辑 ---
			methods.autoClearReceive();
		});

		return {
			...methods,
			...toRefs(state),
			...constants,
			...components,
			__APP_VERSION__
		};
	}
});
