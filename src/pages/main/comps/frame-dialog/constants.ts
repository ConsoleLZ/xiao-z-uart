export enum FrameTypeEnum {
	HIGH_BEFORE = 'highBefore', // 高位在前
	LOW_BEFORE = 'lowBefore' // 低位在前
}

export const frameTypeOptions = [
	{
		value: FrameTypeEnum.HIGH_BEFORE,
		label: '高位在前'
	},
	{
		value: FrameTypeEnum.LOW_BEFORE,
		label: '低位在前'
	}
];
