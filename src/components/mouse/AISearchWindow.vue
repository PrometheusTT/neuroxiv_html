<template>
  <div class="chat-window">
    <div class="chat-messages">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message-container"
        :class="{'user-message-container': message.isUser, 'system-message-container': !message.isUser}"
      >
        <img
          v-if="!message.isUser"
          src="../../../public/img/SystemAvtar.jpg"
          alt="System Avatar"
          class="avatar system-avatar"
        >
        <div
          class="message-bubble"
          :class="{'user-message': message.isUser, 'system-message': !message.isUser}"
        >
          <span v-html="message.text" />
          <button
            v-if="isPythonCode(message.text)"
            class="execute-code-btn"
            @click="executePythonCode(message.text)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="icon-play"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
          <div class="message-timestamp">
            {{ message.timestamp }}
          </div> <!-- 时间戳 -->
        </div>
        <img
          v-if="message.isUser"
          src="../../../public/img/User.png"
          alt="User Avatar"
          class="avatar user-avatar"
        >
      </div>
    </div>
    <input
      v-model="userInput"
      placeholder="Type a message..."
      class="input-box"
      @keyup.enter="$emit('AISearch')"
    >
  </div>
</template>

<script lang="ts">

import { Component, Vue } from 'vue-property-decorator'
const searchConditions = require('./search_conditions.json')
@Component

export default class AISearchWindow extends Vue {
  public messages: {text: string, isUser: Boolean, timestamp: string}[] = []
  private userInput: string = ''
  public lastInput: string = ''
  private Conditions: any[] = searchConditions.children
  private pyodide:any = null
  public code:string = ''

  public scrollToBottom () {
    this.$nextTick(() => {
      const container = this.$el.querySelector('.chat-messages')
      if (container) { // 检查 container 是否为 null
        container.scrollTop = container.scrollHeight
      }
    })
  }

  public sendMessage () {
    const userMessage = this.userInput
    if (userMessage) {
      const currentTime = new Date() // 获取当前时间
      // 格式化时间为 HH:MM 格式
      const timestamp = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0')

      this.messages.push({
        text: userMessage,
        isUser: true,
        timestamp: timestamp // 添加时间戳属性
      })
      this.lastInput = userMessage
      this.userInput = ''
      // this.addResponseFromAPI(userMessage)
      this.scrollToBottom()
    }
  }
  public setCode (code: string) {
    this.code = code
  }

  public isPythonCode (text: string): boolean {
    return text.trim().includes('import')
  }

  public async executePythonCode (code: string) {
    this.$emit('executeCode')
  }

  formatTimestamp (date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  // public addResponseFromAPI (Response: string) {
  //   // Simulate a response from an API (replace with your actual API call)
  //   if (Response !== this.lastInput) {
  //     const responseMessage = 'SEU-Allen: ' + Response
  //     const currentTime = new Date() // 获取当前时间
  //     // 格式化时间为 HH:MM 格式
  //     const timestamp = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0')
  //     this.messages.push({ text: responseMessage, isUser: false, timestamp: timestamp })
  //   }
  // }

  public addResponseFromAPI (data: any) {
    // 获取当前时间戳
    const currentTime = new Date() // 获取当前时间
    //     // 格式化时间为 HH:MM 格式
    const timestamp = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0')

    // 如果传入的是字符串（原有需求）
    if (typeof data === 'string') {
      this.messages.push({
        text: data, isUser: false, timestamp
      })
      // eslint-disable-next-line brace-style
    }
    // 如果传入的是对象数组（新需求）
    else if (Array.isArray(data) && data.length > 0) {
      data.forEach((article: { title: string; summary: string; link: string }, index: number) => {
        let responseMessage = `<span style="font-weight: bold; font-size: larger;">${index + 1}. Article Title:</span> ${article.title}<br>
  <span style="font-weight: bold; font-size: larger;">Summary:</span> ${article.summary}<br>
  <span style="font-weight: bold; font-size: larger;">Link:</span> <a href="${article.link}" target="_blank" style="text-decoration: underline; color: #007bff">${article.link}</a>`
        this.messages.push({ text: responseMessage, isUser: false, timestamp })
      })
      // eslint-disable-next-line brace-style
    }
    // 如果数组为空，表示没有搜索到结果
    else if (Array.isArray(data) && data.length === 0) {
      this.messages.push({ text: 'No results found.', isUser: false, timestamp })
    }
  }
  public confirmSearch () {
    this.$emit('AISearch')
  }

  public GetIntent (question:string, searchIntent:string) {
    let conditions:any = {}
    for (const index in conditions) {
      console.log(index)
      // for (const sc in conditions[index].children) {
      //   console.log(sc)
      // }
    }
    // 定义用于搜索意图的关键词
    const searchKeywords = ['search', 'find', 'query', 'inquire', 'look for']
    const altasKeywords = ['fMOST', 'CCFv3']
    const dataSourceKeywords = ['SEU', 'AIBS', 'Mouselight']
    const ReconMethodKeywords = [
      'auto_r',
      'semi_r',
      'manual'
    ]
    const brainRigionKeywords = [
      'FRP',
      'FRP Layer1',
      'FRP Layer5',
      'FRP Layer6a',
      'MOp',
      'MOp Layer1',
      'MOp Layer2/3',
      'MOp Layer5',
      'MOp Layer6',
      'MOp Layer6a',
      'MOp Layer6b',
      'MOs',
      'MOs Layer1',
      'MOs Layer2/3',
      'MOs Layer5',
      'MOs Layer6',
      'MOs Layer6a',
      'MOs Layer6b',
      'SSp Layer6',
      'SSp-n',
      'SSp-n Layer1',
      'SSp-n Layer2/3',
      'SSp-n Layer4',
      'SSp-n Layer5',
      'SSp-n Layer6',
      'SSp-n Layer6a',
      'SSp-n Layer6b',
      'SSp-bfd',
      'SSp-bfd Layer1',
      'SSp-bfd Layer2/3',
      'SSp-bfd Layer4',
      'SSp-bfd Layer5',
      'SSp-bfd Layer6',
      'SSp-bfd Layer6a',
      'SSp-bfd Layer6b',
      'SSp-ll',
      'SSp-ll Layer1',
      'SSp-ll Layer2/3',
      'SSp-ll Layer4',
      'SSp-ll Layer5',
      'SSp-ll Layer6',
      'SSp-ll Layer6a',
      'SSp-m',
      'SSp-m Layer1',
      'SSp-m Layer2/3',
      'SSp-m Layer4',
      'SSp-m Layer5',
      'SSp-m Layer6',
      'SSp-m Layer6a',
      'SSp-m Layer6b',
      'SSp-ul',
      'SSp-ul Layer1',
      'SSp-ul Layer2/3',
      'SSp-ul Layer4',
      'SSp-ul Layer5',
      'SSp-ul Layer6a',
      'SSp-tr',
      'SSp-tr Layer1',
      'SSp-tr Layer2/3',
      'SSp-tr Layer4',
      'SSp-tr Layer5',
      'SSp-tr Layer6a',
      'SSp-un',
      'SSp-un Layer1',
      'SSp-un Layer2/3',
      'SSp-un Layer4',
      'SSp-un Layer5',
      'SSp-un Layer6',
      'SSp-un Layer6a',
      'SSp-un Layer6b',
      'SSs',
      'SSs Layer1',
      'SSs Layer2/3',
      'SSs Layer4',
      'SSs Layer5',
      'SSs Layer6',
      'SSs Layer6a',
      'SSs Layer6b',
      'GU',
      'GU Layer1',
      'GU Layer2/3',
      'GU Layer4',
      'GU Layer5',
      'GU Layer6',
      'GU Layer6a',
      'GU Layer6b',
      'VISC',
      'VISC Layer1',
      'VISC Layer2/3',
      'VISC Layer4',
      'VISC Layer5',
      'VISC Layer6',
      'VISC Layer6a',
      'VISC Layer6b',
      'AUDd',
      'AUDd Layer1',
      'AUDd Layer2/3',
      'AUDd Layer4',
      'AUDd Layer5',
      'AUDd Layer6',
      'AUDd Layer6a',
      'AUDp',
      'AUDp Layer1',
      'AUDp Layer2/3',
      'AUDp Layer4',
      'AUDp Layer5',
      'AUDp Layer6',
      'AUDp Layer6a',
      'AUDpo',
      'AUDpo Layer1',
      'AUDpo Layer2/3',
      'AUDpo Layer4',
      'AUDpo Layer5',
      'AUDpo Layer6',
      'AUDv',
      'AUDv Layer1',
      'AUDv Layer2/3',
      'AUDv Layer4',
      'AUDv Layer5',
      'AUDv Layer6',
      'AUDv Layer6a',
      'VISal',
      'VISal Layer1',
      'VISal Layer2/3',
      'VISal Layer4',
      'VISal Layer5',
      'VISal Layer6',
      'VISal Layer6a',
      'VISam',
      'VISam Layer2/3',
      'VISam Layer4',
      'VISam Layer5',
      'VISam Layer6a',
      'VISl',
      'VISl Layer1',
      'VISl Layer2/3',
      'VISl Layer4',
      'VISl Layer5',
      'VISl Layer6',
      'VISl Layer6a',
      'VISl Layer6b',
      'VISp',
      'VISp Layer1',
      'VISp Layer2/3',
      'VISp Layer4',
      'VISp Layer5',
      'VISp Layer6',
      'VISp Layer6a',
      'VISp Layer6b',
      'VISpl',
      'VISpl Layer1',
      'VISpl Layer2/3',
      'VISpl Layer4',
      'VISpl Layer5',
      'VISpl Layer6a',
      'VISpm',
      'VISpm Layer1',
      'VISpm Layer2/3',
      'VISpm Layer4',
      'VISpm Layer5',
      'VISpm Layer6a',
      'VISli',
      'VISli Layer1',
      'VISli Layer2/3',
      'VISli Layer4',
      'VISli Layer5',
      'VISli Layer6a',
      'VISpor',
      'VISpor Layer1',
      'VISpor Layer2/3',
      'VISpor Layer4',
      'VISpor Layer5',
      'VISpor Layer6a',
      'ACAd',
      'ACAd Layer1',
      'ACAd Layer2/3',
      'ACAd Layer5',
      'ACAd Layer6',
      'ACAd Layer6a',
      'ACAv',
      'ACAv Layer1',
      'ACAv Layer2/3',
      'ACAv Layer5',
      'ACAv Layer6a',
      'PL',
      'PL Layer1',
      'PL Layer2/3',
      'PL Layer5',
      'PL Layer6a',
      'ILA',
      'ILA Layer2/3',
      'ILA Layer5',
      'ORBl',
      'ORBl Layer1',
      'ORBl Layer2/3',
      'ORBl Layer5',
      'ORBl Layer6',
      'ORBl Layer6a',
      'ORBl Layer6b',
      'ORBm',
      'ORBm Layer1',
      'ORBm Layer2/3',
      'ORBm Layer5',
      'ORBvl',
      'ORBvl Layer1',
      'ORBvl Layer2/3',
      'ORBvl Layer5',
      'ORBvl Layer6a',
      'AId',
      'AId Layer1',
      'AId Layer2/3',
      'AId Layer5',
      'AId Layer6',
      'AId Layer6a',
      'AId Layer6b',
      'AIp',
      'AIp Layer1',
      'AIp Layer2/3',
      'AIp Layer5',
      'AIp Layer6',
      'AIp Layer6a',
      'AIv',
      'AIv Layer1',
      'AIv Layer2/3',
      'AIv Layer5',
      'AIv Layer6a',
      'RSPagl',
      'RSPagl Layer1',
      'RSPagl Layer2/3',
      'RSPagl Layer5',
      'RSPagl Layer6a',
      'RSPd',
      'RSPd Layer1',
      'RSPd Layer2/3',
      'RSPd Layer5',
      'RSPd Layer6a',
      'RSPv',
      'RSPv Layer1',
      'RSPv Layer2/3',
      'RSPv Layer5',
      'RSPv Layer6a',
      'VISa',
      'VISa Layer1',
      'VISa Layer2/3',
      'VISa Layer4',
      'VISa Layer5',
      'VISrl',
      'VISrl Layer1',
      'VISrl Layer2/3',
      'VISrl Layer4',
      'VISrl Layer5',
      'VISrl Layer6',
      'VISrl Layer6a',
      'TEa',
      'TEa Layer1',
      'TEa Layer2/3',
      'TEa Layer4',
      'TEa Layer5',
      'TEa Layer6',
      'TEa Layer6a',
      'PERI',
      'PERI Layer2/3',
      'PERI Layer5',
      'PERI Layer6a',
      'ECT',
      'ECT Layer1',
      'ECT Layer2/3',
      'ECT Layer5',
      'ECT Layer6',
      'ECT Layer6a',
      'ECT Layer6b',
      'MOB',
      'AOB',
      'AON',
      'TT',
      'DP',
      'PIR',
      'NLOT',
      'COAa',
      'COAp',
      'PAA',
      'TR',
      'HPF',
      'CA1',
      'CA2',
      'CA3',
      'DG',
      'IG',
      'ENTl',
      'ENTm',
      'PAR',
      'POST',
      'PRE',
      'SUB',
      'ProS',
      'HATA',
      'APr',
      'CLA',
      'EPd',
      'EPv',
      'LA',
      'BLA',
      'BMA',
      'PA',
      'CP',
      'ACB',
      'FS',
      'OT',
      'LSc',
      'LSr',
      'LSv',
      'SF',
      'AAA',
      'CEA',
      'IA',
      'MEA',
      'PAL',
      'GPe',
      'GPi',
      'SI',
      'MA',
      'MS',
      'NDB',
      'TRS',
      'BST',
      'BS',
      'TH',
      'VAL',
      'VM',
      'VPL',
      'VPLpc',
      'VPM',
      'VPMpc',
      'PoT',
      'SPFp',
      'PP',
      'MG',
      'LGd',
      'LP',
      'PO',
      'POL',
      'SGN',
      'AV',
      'AM',
      'AD',
      'IAD',
      'LD',
      'IMD',
      'MD',
      'SMT',
      'PR',
      'PVT',
      'PT',
      'RE',
      'Xi',
      'CM',
      'PCN',
      'CL',
      'PF',
      'PIL',
      'RT',
      'IGL',
      'LGv',
      'HY',
      'PVH',
      'PVi',
      'ARH',
      'DMH',
      'MPO',
      'SBPV',
      'SCH',
      'AHN',
      'MM',
      'Mmme',
      'Mml',
      'Mmd',
      'SUM',
      'TMv',
      'MPN',
      'PMd',
      'VMH',
      'PH',
      'LHA',
      'LPO',
      'PSTN',
      'PeF',
      'TU',
      'ZI',
      'MB',
      'SCs',
      'IC',
      'SNr',
      'VTA',
      'MRN',
      'SCm',
      'PAG',
      'APN',
      'NOT',
      'NPC',
      'PPT',
      'CUN',
      'RN',
      'AT',
      'SNc',
      'PPN',
      'IPN',
      'DR',
      'P',
      'NLL',
      'PSV',
      'PB',
      'SOC',
      'B',
      'DTN',
      'PCG',
      'PG',
      'PRNc',
      'SUT',
      'TRN',
      'V',
      'P5',
      'PC5',
      'CS',
      'LDT',
      'NI',
      'PRNr',
      'RPO',
      'MY',
      'DCO',
      'VCO',
      'CU',
      'SPVC',
      'SPVI',
      'VII',
      'DMX',
      'GRN',
      'IO',
      'IRN',
      'LRN',
      'MARN',
      'MDRN',
      'MDRNd',
      'MDRNv',
      'PARN',
      'PGRNd',
      'PGRNl',
      'PRP',
      'PPY',
      'LAV',
      'MV',
      'SPIV',
      'SUV',
      'RM',
      'CENT',
      'CUL',
      'CUL4, 5',
      'DEC',
      'FOTU',
      'PYR',
      'UVU',
      'NOD',
      'SIM',
      'AN',
      'PRM',
      'COPY',
      'PFL',
      'FL',
      'FN',
      'fiber tracts',
      'mlf',
      'll',
      'arb',
      'fa',
      'ccg',
      'fp',
      'ccb',
      'int',
      'or',
      'nst',
      'tspc',
      'cing',
      'alv',
      'fi',
      'fx',
      'dhc',
      'mfb',
      'pm',
      'mtt',
      'sm',
      'fr',
      'unknown'
    ]
    const projKeywords = [
      'FRP',
      'FRP Layer1',
      'FRP Layer5',
      'FRP Layer6a',
      'MOp',
      'MOp Layer1',
      'MOp Layer2/3',
      'MOp Layer5',
      'MOp Layer6',
      'MOp Layer6a',
      'MOp Layer6b',
      'MOs',
      'MOs Layer1',
      'MOs Layer2/3',
      'MOs Layer5',
      'MOs Layer6',
      'MOs Layer6a',
      'MOs Layer6b',
      'SSp Layer6',
      'SSp-n',
      'SSp-n Layer1',
      'SSp-n Layer2/3',
      'SSp-n Layer4',
      'SSp-n Layer5',
      'SSp-n Layer6',
      'SSp-n Layer6a',
      'SSp-n Layer6b',
      'SSp-bfd',
      'SSp-bfd Layer1',
      'SSp-bfd Layer2/3',
      'SSp-bfd Layer4',
      'SSp-bfd Layer5',
      'SSp-bfd Layer6',
      'SSp-bfd Layer6a',
      'SSp-bfd Layer6b',
      'SSp-ll',
      'SSp-ll Layer1',
      'SSp-ll Layer2/3',
      'SSp-ll Layer4',
      'SSp-ll Layer5',
      'SSp-ll Layer6',
      'SSp-ll Layer6a',
      'SSp-m',
      'SSp-m Layer1',
      'SSp-m Layer2/3',
      'SSp-m Layer4',
      'SSp-m Layer5',
      'SSp-m Layer6',
      'SSp-m Layer6a',
      'SSp-m Layer6b',
      'SSp-ul',
      'SSp-ul Layer1',
      'SSp-ul Layer2/3',
      'SSp-ul Layer4',
      'SSp-ul Layer5',
      'SSp-ul Layer6a',
      'SSp-tr',
      'SSp-tr Layer1',
      'SSp-tr Layer2/3',
      'SSp-tr Layer4',
      'SSp-tr Layer5',
      'SSp-tr Layer6a',
      'SSp-un',
      'SSp-un Layer1',
      'SSp-un Layer2/3',
      'SSp-un Layer4',
      'SSp-un Layer5',
      'SSp-un Layer6',
      'SSp-un Layer6a',
      'SSp-un Layer6b',
      'SSs',
      'SSs Layer1',
      'SSs Layer2/3',
      'SSs Layer4',
      'SSs Layer5',
      'SSs Layer6',
      'SSs Layer6a',
      'SSs Layer6b',
      'GU',
      'GU Layer1',
      'GU Layer2/3',
      'GU Layer4',
      'GU Layer5',
      'GU Layer6',
      'GU Layer6a',
      'GU Layer6b',
      'VISC',
      'VISC Layer1',
      'VISC Layer2/3',
      'VISC Layer4',
      'VISC Layer5',
      'VISC Layer6',
      'VISC Layer6a',
      'VISC Layer6b',
      'AUDd',
      'AUDd Layer1',
      'AUDd Layer2/3',
      'AUDd Layer4',
      'AUDd Layer5',
      'AUDd Layer6',
      'AUDd Layer6a',
      'AUDp',
      'AUDp Layer1',
      'AUDp Layer2/3',
      'AUDp Layer4',
      'AUDp Layer5',
      'AUDp Layer6',
      'AUDp Layer6a',
      'AUDpo',
      'AUDpo Layer1',
      'AUDpo Layer2/3',
      'AUDpo Layer4',
      'AUDpo Layer5',
      'AUDpo Layer6',
      'AUDv',
      'AUDv Layer1',
      'AUDv Layer2/3',
      'AUDv Layer4',
      'AUDv Layer5',
      'AUDv Layer6',
      'AUDv Layer6a',
      'VISal',
      'VISal Layer1',
      'VISal Layer2/3',
      'VISal Layer4',
      'VISal Layer5',
      'VISal Layer6',
      'VISal Layer6a',
      'VISam',
      'VISam Layer2/3',
      'VISam Layer4',
      'VISam Layer5',
      'VISam Layer6a',
      'VISl',
      'VISl Layer1',
      'VISl Layer2/3',
      'VISl Layer4',
      'VISl Layer5',
      'VISl Layer6',
      'VISl Layer6a',
      'VISl Layer6b',
      'VISp',
      'VISp Layer1',
      'VISp Layer2/3',
      'VISp Layer4',
      'VISp Layer5',
      'VISp Layer6',
      'VISp Layer6a',
      'VISp Layer6b',
      'VISpl',
      'VISpl Layer1',
      'VISpl Layer2/3',
      'VISpl Layer4',
      'VISpl Layer5',
      'VISpl Layer6a',
      'VISpm',
      'VISpm Layer1',
      'VISpm Layer2/3',
      'VISpm Layer4',
      'VISpm Layer5',
      'VISpm Layer6a',
      'VISli',
      'VISli Layer1',
      'VISli Layer2/3',
      'VISli Layer4',
      'VISli Layer5',
      'VISli Layer6a',
      'VISpor',
      'VISpor Layer1',
      'VISpor Layer2/3',
      'VISpor Layer4',
      'VISpor Layer5',
      'VISpor Layer6a',
      'ACAd',
      'ACAd Layer1',
      'ACAd Layer2/3',
      'ACAd Layer5',
      'ACAd Layer6',
      'ACAd Layer6a',
      'ACAv',
      'ACAv Layer1',
      'ACAv Layer2/3',
      'ACAv Layer5',
      'ACAv Layer6a',
      'PL',
      'PL Layer1',
      'PL Layer2/3',
      'PL Layer5',
      'PL Layer6a',
      'ILA',
      'ILA Layer2/3',
      'ILA Layer5',
      'ORBl',
      'ORBl Layer1',
      'ORBl Layer2/3',
      'ORBl Layer5',
      'ORBl Layer6',
      'ORBl Layer6a',
      'ORBl Layer6b',
      'ORBm',
      'ORBm Layer1',
      'ORBm Layer2/3',
      'ORBm Layer5',
      'ORBvl',
      'ORBvl Layer1',
      'ORBvl Layer2/3',
      'ORBvl Layer5',
      'ORBvl Layer6a',
      'AId',
      'AId Layer1',
      'AId Layer2/3',
      'AId Layer5',
      'AId Layer6',
      'AId Layer6a',
      'AId Layer6b',
      'AIp',
      'AIp Layer1',
      'AIp Layer2/3',
      'AIp Layer5',
      'AIp Layer6',
      'AIp Layer6a',
      'AIv',
      'AIv Layer1',
      'AIv Layer2/3',
      'AIv Layer5',
      'AIv Layer6a',
      'RSPagl',
      'RSPagl Layer1',
      'RSPagl Layer2/3',
      'RSPagl Layer5',
      'RSPagl Layer6a',
      'RSPd',
      'RSPd Layer1',
      'RSPd Layer2/3',
      'RSPd Layer5',
      'RSPd Layer6a',
      'RSPv',
      'RSPv Layer1',
      'RSPv Layer2/3',
      'RSPv Layer5',
      'RSPv Layer6a',
      'VISa',
      'VISa Layer1',
      'VISa Layer2/3',
      'VISa Layer4',
      'VISa Layer5',
      'VISrl',
      'VISrl Layer1',
      'VISrl Layer2/3',
      'VISrl Layer4',
      'VISrl Layer5',
      'VISrl Layer6',
      'VISrl Layer6a',
      'TEa',
      'TEa Layer1',
      'TEa Layer2/3',
      'TEa Layer4',
      'TEa Layer5',
      'TEa Layer6',
      'TEa Layer6a',
      'PERI',
      'PERI Layer2/3',
      'PERI Layer5',
      'PERI Layer6a',
      'ECT',
      'ECT Layer1',
      'ECT Layer2/3',
      'ECT Layer5',
      'ECT Layer6',
      'ECT Layer6a',
      'ECT Layer6b',
      'MOB',
      'AOB',
      'AON',
      'TT',
      'DP',
      'PIR',
      'NLOT',
      'COAa',
      'COAp',
      'PAA',
      'TR',
      'HPF',
      'CA1',
      'CA2',
      'CA3',
      'DG',
      'IG',
      'ENTl',
      'ENTm',
      'PAR',
      'POST',
      'PRE',
      'SUB',
      'ProS',
      'HATA',
      'APr',
      'CLA',
      'EPd',
      'EPv',
      'LA',
      'BLA',
      'BMA',
      'PA',
      'CP',
      'ACB',
      'FS',
      'OT',
      'LSc',
      'LSr',
      'LSv',
      'SF',
      'AAA',
      'CEA',
      'IA',
      'MEA',
      'PAL',
      'GPe',
      'GPi',
      'SI',
      'MA',
      'MS',
      'NDB',
      'TRS',
      'BST',
      'BS',
      'TH',
      'VAL',
      'VM',
      'VPL',
      'VPLpc',
      'VPM',
      'VPMpc',
      'PoT',
      'SPFp',
      'PP',
      'MG',
      'LGd',
      'LP',
      'PO',
      'POL',
      'SGN',
      'AV',
      'AM',
      'AD',
      'IAD',
      'LD',
      'IMD',
      'MD',
      'SMT',
      'PR',
      'PVT',
      'PT',
      'RE',
      'Xi',
      'CM',
      'PCN',
      'CL',
      'PF',
      'PIL',
      'RT',
      'IGL',
      'LGv',
      'HY',
      'PVH',
      'PVi',
      'ARH',
      'DMH',
      'MPO',
      'SBPV',
      'SCH',
      'AHN',
      'MM',
      'Mmme',
      'Mml',
      'Mmd',
      'SUM',
      'TMv',
      'MPN',
      'PMd',
      'VMH',
      'PH',
      'LHA',
      'LPO',
      'PSTN',
      'PeF',
      'TU',
      'ZI',
      'MB',
      'SCs',
      'IC',
      'SNr',
      'VTA',
      'MRN',
      'SCm',
      'PAG',
      'APN',
      'NOT',
      'NPC',
      'PPT',
      'CUN',
      'RN',
      'AT',
      'SNc',
      'PPN',
      'IPN',
      'DR',
      'P',
      'NLL',
      'PSV',
      'PB',
      'SOC',
      'B',
      'DTN',
      'PCG',
      'PG',
      'PRNc',
      'SUT',
      'TRN',
      'V',
      'P5',
      'PC5',
      'CS',
      'LDT',
      'NI',
      'PRNr',
      'RPO',
      'MY',
      'DCO',
      'VCO',
      'CU',
      'SPVC',
      'SPVI',
      'VII',
      'DMX',
      'GRN',
      'IO',
      'IRN',
      'LRN',
      'MARN',
      'MDRN',
      'MDRNd',
      'MDRNv',
      'PARN',
      'PGRNd',
      'PGRNl',
      'PRP',
      'PPY',
      'LAV',
      'MV',
      'SPIV',
      'SUV',
      'RM',
      'CENT',
      'CUL',
      'CUL4, 5',
      'DEC',
      'FOTU',
      'PYR',
      'UVU',
      'NOD',
      'SIM',
      'AN',
      'PRM',
      'COPY',
      'PFL',
      'FL',
      'FN',
      'fiber tracts',
      'mlf',
      'll',
      'arb',
      'fa',
      'ccg',
      'fp',
      'ccb',
      'int',
      'or',
      'nst',
      'tspc',
      'cing',
      'alv',
      'fi',
      'fx',
      'dhc',
      'mfb',
      'pm',
      'mtt',
      'sm',
      'fr',
      'unknown'
    ]
    // const dataSourceKeywords = ['SEU', 'AIBS', 'Mouselight']

    // 初始化意图和参数
    // let searchIntent = 'unknown intent'
    let searchQuery = question.trim()
    let criteria = {}

    // 遍历搜索关键词，检查用户输入是否包含搜索意图

    if (searchIntent === 'search') {
    // 从用户输入中去除搜索关键词以获取搜索参数
    //   searchQuery = question.replace(keyword, '').trim()
      for (const keyword of altasKeywords) {
        if (question.includes(keyword)) {
          this.$set(criteria, 'brain_altas', [keyword])
        // criteria['brain_atlas'] = [keyword]
        }
      }
      for (const keyword of dataSourceKeywords) {
        if (question.includes(keyword)) {
          this.$set(criteria, 'data_source', [keyword])
        }
      }

      if (question.includes('AutoArbor')) {
        this.$set(criteria, 'has_ab', true)
      }
      if (question.includes('have reconstructed axon')) {
        this.$set(criteria, 'has_recon_axon', true)
      }
      if (question.includes('projection' || 'project to')) {
        for (const keyword of projKeywords) {
          const regex = new RegExp(`\\b${keyword}\\b`)
          if (regex.test(question)) {
            this.$set(criteria, 'proj_den_' + keyword + '_rela', [0, 1])
          }
        }
      } else {
        for (const keyword of brainRigionKeywords) {
          const regex = new RegExp(`\\b${keyword}\\b`)
          if (regex.test(question)) {
            this.$set(criteria, 'celltype', [keyword])
          }
        }
      }
      if (question.includes('have reconstructed dendrite')) {
        this.$set(criteria, 'has_recon_den', true)
      }
    }

    return { searchIntent, criteria }
  }
}
</script>

<style scoped>
.chat-window {
  width: 100%; /* 聊天窗口宽度自适应父元素 */
  max-width: 768px; /* 控制最大宽度 */
  border-radius: 16px; /* 圆角边框 */
  overflow: hidden; /* 防止子元素溢出边框 */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* 更轻的阴影，增加立体感 */
  background: #ffffff; /* 纯白背景 */
  margin: auto; /* 居中显示 */
  display: flex;
  flex-direction: column; /* 垂直布局 */
  max-height: 90vh; /* 最大高度不超过视口的90% */
  min-height: 300px; /* 最小高度 */
  overflow: hidden; /* 内容溢出时隐藏 */
}

.chat-messages {
  flex: 1; /* 让消息列表填充所有可用空间 */
  padding: 20px; /* 增加内部间距 */
  background: #f7f7f7; /* 淡灰色背景 */
  overflow-y: auto; /* 自动显示滚动条 */
}

.message-bubble {
  background: #e1e1e1; /* 统一气泡背景色 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); /* 轻微阴影 */
  border-radius: 20px; /* 圆角 */
  margin: 4px 0; /* 消息间距 */
  padding: 10px 20px; /* 内边距 */
  display: inline-block; /* 保证气泡根据内容扩展 */
  max-width: 70%; /* 控制气泡宽度 */
}

.user-message {
  background: #007bff; /* 用户消息颜色 */
  color: white; /* 用户消息文字颜色 */
  float: right; /* 靠右浮动 */
  clear: both; /* 避免相邻元素的浮动 */
  margin-right: 20px; /* 与窗口边缘的间距 */
}

.system-message {
  background: #e1e1e1; /* 系统消息颜色 */
  color: black; /* 系统消息文字颜色 */
  float: left; /* 靠左浮动 */
  clear: both; /* 避免相邻元素的浮动 */
  margin-left: 20px; /* 与窗口边缘的间距 */
}

input {
  padding: 12px 20px; /* 输入框内边距 */
  border-radius: 30px; /* 圆角边框 */
  border: 2px solid #007bff; /* 边框颜色与用户消息气泡一致 */
  margin: 10px 20px; /* 边距 */
  width: calc(100% - 40px); /* 输入框宽度 */
  box-sizing: border-box; /* 边框盒模型 */
}

/* 自适应滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 10px; /* 圆角滚动条 */
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 10px;
}
/* 时间戳样式 */
.message-timestamp {
  font-size: 0.75em;
  margin-top: 5px;
  color: #999;
  text-align: right;
}
.avatar {
    width: 40px; /* 设置头像宽度 */
    height: 40px; /* 设置头像高度 */
    border-radius: 50%; /* 圆形头像 */
    object-fit: cover; /* 保持图片比例 */
    margin: 4px; /* 头像与气泡间隔 */
}

.user-avatar {
    float: right; /* 用户头像靠右 */
}

.system-avatar {
    float: left; /* 系统头像靠左 */
}

.message-container {
    display: flex;
    align-items: flex-start; /* 对齐到底部 */
    clear: both; /* 清除浮动 */
}

.user-message-container {
    justify-content: flex-end; /* 用户气泡靠右 */
}

.system-message-container {
    justify-content: flex-start; /* 系统气泡靠左 */
}

.execute-code-btn {
    background-color: #007bff; /* Primary color */
    border: none; /* No border */
    border-radius: 50%; /* Circle shape */
    width: 30px; /* Diameter of the button */
    height: 30px; /* Diameter of the button */
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    right: 10px;
    bottom: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* Subtle shadow for depth */
    transition: background-color 0.2s, transform 0.2s; /* Smooth transitions for feedback */
}

.icon-play {
    fill: white; /* Icon color contrast */
    width: 20px; /* Icon size */
    height: 20px; /* Icon size */
}

.execute-code-btn:hover {
    background-color: #0056b3; /* Darker shade on hover */
}

.execute-code-btn:active {
    transform: scale(0.9); /* Slightly shrink the button when clicked */
}

.message-bubble {
    position: relative; /* Needed for absolute positioning of the button */
    padding: 10px 10px 10px 10px ; /* Adjust padding to give space for the button */
}

pre, code {
  background-color: #f4f4f4; /* 浅灰色背景，突出显示代码区域 */
  border: 1px solid #ddd; /* 边框 */
  border-radius: 5px; /* 圆角边框 */
  padding: 10px; /* 内边距 */
  overflow: auto; /* 超长代码滚动 */
  white-space: pre-wrap; /* 保持空白符 */
  word-break: break-all; /* 单词断行 */
}
</style>
