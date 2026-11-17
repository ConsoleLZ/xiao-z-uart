import { SelectOptionsModel } from '@/utils/types';
import { VerifyEnum } from './constants';

export interface StateModel {
	receiveData: any;
	sendData: string;
	portValue: string;
	baudRateValue: number;
	isCustomBaudRate: boolean;
	portOptions: SelectOptionsModel[];
	isOpenPort: boolean;
	isSend16: boolean;
	isReceive16: boolean;
	isDividePacket: boolean;
	showByteNumMax: number;
	fontSize: number;
	mode: boolean;
	isFrameAnalysis: boolean;
	uartVerify: VerifyEnum;
	receiveEncoding: string; // 接收文本解码：'gbk' | 'utf-8'
	chartLine: any;
}
