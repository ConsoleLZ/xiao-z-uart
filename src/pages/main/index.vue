<template>
	<div class="main-page">
		<!-- —— 顶部菜单条 —— -->
		<nav class="menu">
			<div class="menu-item">
				<span class="menu__link">文件</span>
				<div class="dropdown">
					<span class="dropdown__item" @click="onExportExcel">导出 excel</span>
					<span class="dropdown__item" @click="onExportTxt">导出 txt</span>
					<span class="dropdown__item" @click="onClearData">清空数据</span>
				</div>
			</div>
			<span class="menu__link" @click="onChangeMode">模式切换 (文字/图形)</span>
			<span class="menu__link" @click="onFrameSet">数据帧解析</span>
			<span class="menu__link" @click="onShowSet">设置</span>
			<span class="menu__link" @click="onRefresh">刷新</span>
			<span class="menu__link" @click="onShowAbout">关于</span>
			<span class="menu__status">
				<span class="menu__status-dot" :class="{ 'is-open': isOpenPort }"></span>
				{{ isOpenPort ? 'PORT OPEN' : 'PORT CLOSED' }}
			</span>
		</nav>

		<!-- —— 数据展示区 —— -->
		<section class="data-show">
			<!-- 文字模式 + 分包显示：原生滚动列表 -->
			<div v-show="!mode && isDividePacket" class="data-show__list">
				<div ref="receiveListRef" class="scroller">
					<div v-for="item in receiveData" :key="item.id" class="list__row">{{ item.content }}</div>
				</div>
			</div>
			<!-- 文字模式 + 不分包：只读文本域 -->
			<div v-show="!mode && !isDividePacket" class="data-show__text">
				<ZTextarea
					ref="receiveTextareaRef"
					class="scroller"
					:model-value="receiveData"
					readonly
					:font-size="fontSize"
				/>
			</div>
			<!-- 图形模式：smoothie 图表 -->
			<div v-show="mode" class="data-show__chart">
				<canvas id="smoothieChart"></canvas>
				<ZButton size="sm" class="chart__clear-btn" @click="onClearReferenceLines">清除参考线</ZButton>
			</div>
		</section>

		<!-- —— 选项条 —— -->
		<div class="options-bar">
			<ZCheckbox v-model="isSend16" label="16进制发送" @change="onChangeSend16" />
			<ZCheckbox v-model="isReceive16" label="16进制显示" @change="onChangeReceive16" />
			<ZCheckbox v-model="isDividePacket" label="分包显示" @change="onChangeDividePacket" />
			<ZCheckbox v-model="isFrameAnalysis" label="帧解析" @change="onChangeFrameAnalysis" />
			<ZSelect v-model="uartVerify" :options="verifyOptions" placeholder="校验" class="options-bar__select" />
			<ZSelect v-model="receiveEncoding" :options="receiveEncodingOptions" placeholder="编码" class="options-bar__select" @change="onChangeReceiveEncoding" />
		</div>

		<!-- —— 发送区 + 操作区 —— -->
		<div class="send-area">
			<div class="send-area__input">
				<ZTextarea
					v-model="sendData"
					placeholder="串口数据发送"
					:rows="3"
				/>
			</div>
			<div class="main-action">
				<ZSelect
					v-if="!isCustomBaudRate"
					v-model="baudRateValue"
					:options="baudRateOptions"
					placeholder="波特率"
					class="main-action__select"
					@change="onChangeBaudRate"
				/>
				<ZInputNumber
					v-else
					v-model="baudRateValue"
					placeholder="波特率"
					class="main-action__select"
					@blur="onChangeBaudRate"
				/>
				<ZCheckbox v-model="isCustomBaudRate" label="自定义波特率" @change="onChangeRate" />
				<ZButton variant="primary" @click="onSend">发送</ZButton>
				<ZButton v-if="!isOpenPort" variant="primary" @click="onOpen">打开串口</ZButton>
				<ZButton v-else variant="danger" @click="onOpen">关闭串口</ZButton>
				<div class="action-group">
					<ZSelect v-model="portValue" :options="portOptions" placeholder="端口号" class="main-action__select" />
					<span class="refresh" @click="getPort" title="刷新端口">
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M11.5 7a4.5 4.5 0 1 1-1.32-3.18M11.5 1.5V4H9" stroke="currentColor" stroke-width="1.2" stroke-linecap="square" />
						</svg>
					</span>
				</div>
				<ZButton @click="onClearSend">清空发送区</ZButton>
				<ZButton @click="onClearReceive">清空接收区 / 重绘图表</ZButton>
			</div>
		</div>

		<!-- —— 版本号（靠右） —— -->
		<p class="hint hint--version">v{{ __APP_VERSION__ }}</p>
	</div>

	<SetDialogComp ref="setDialogRef" @confirm="onConfirmSet" />
	<FrameDialogComp ref="frameDialogRef" @saved="onFrameDialogSaved" />
	<AboutDialogComp ref="aboutDialogRef" />
</template>

<script src="./index.ts"></script>
<style src="./index.css" scoped></style>
