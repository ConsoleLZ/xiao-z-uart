export const baudRateOptions = [
	{
		value: 4800,
		label: '4800'
	},
	{
		value: 9600,
		label: '9600'
	},
	{
		value: 38400,
		label: '38400'
	},
	{
		value: 115200,
		label: '115200'
	}
];

export enum VerifyEnum {
	NONE = 'none',
	ODD = 'odd',
	EVEN = 'even'
}

export const verifyOptions = [
	{
		value: VerifyEnum.NONE,
		label: '不校验'
	},
	{
		value: VerifyEnum.ODD,
		label: '奇校验'
	},
	{
		value: VerifyEnum.EVEN,
		label: '偶校验'
	}
];

// 接收区文本解码方式（下位机常见编码是 GBK，故默认放首位）
export const receiveEncodingOptions = [
	{
		value: 'gbk',
		label: 'GBK'
	},
	{
		value: 'utf-8',
		label: 'UTF-8'
	}
];
