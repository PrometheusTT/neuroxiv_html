<template>
  <div class="chat-window">
    <div class="chat-messages">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="{'user-message': message.isUser}"
      >
        {{ message.text }}
      </div>
    </div>
    <input
      v-model="userInput"
      placeholder="Type a message..."
      @keyup.enter="confirmSearch"
    >
  </div>
</template>

<script lang="ts">

import { Component, Vue } from 'vue-property-decorator'
const searchConditions = require('./search_conditions.json')
@Component

export default class AISearchWindow extends Vue {
  public messages: {text: string, isUser: Boolean}[] = []
  private userInput: string = ''
  public lastInput: string = ''
  private searchConditions: any[] = searchConditions.children

  public sendMessage () {
    const userMessage = this.userInput
    if (userMessage) {
      this.messages.push({ text: userMessage, isUser: true })
      this.lastInput = userMessage
      this.userInput = ''
      this.addResponseFromAPI(userMessage)
    }
  }

  public addResponseFromAPI (Response: string) {
    // Simulate a response from an API (replace with your actual API call)
    if (Response !== this.lastInput) {
      const responseMessage = 'Response: ' + Response
      this.messages.push({ text: responseMessage, isUser: false })
    }
  }

  public confirmSearch () {
    this.$emit('AISearch')
  }

  public GetIntent (question:string) {
    let conditions:any = {}
    for (const sc in this.searchConditions) {
        for()
    }
    // 定义用于搜索意图的关键词
    const searchKeywords = ['search', 'find', 'query', 'inquire', 'look for']
    const altasKeywords = ['fMOST', 'CCFv3']
    const dataSourceKeywords = ['SEU', 'AIBS', 'Mouselight']
    // const dataSourceKeywords = ['SEU', 'AIBS', 'Mouselight']

    // 初始化意图和参数
    let searchIntent = 'unknown intent'
    let searchQuery = ''
    let criteria = {}

    // 遍历搜索关键词，检查用户输入是否包含搜索意图
    for (const keyword of searchKeywords) {
      if (question.includes(keyword)) {
        searchIntent = 'Search'
        // 从用户输入中去除搜索关键词以获取搜索参数
        searchQuery = question.replace(keyword, '').trim()
        for (const keyword of altasKeywords) {
          if (searchQuery.includes(keyword)) {
            this.$set(criteria, 'brain_altas', [keyword])
            // criteria['brain_atlas'] = [keyword]
          }
        }
        for (const keyword of dataSourceKeywords) {
          if (searchQuery.includes(keyword)) {
            this.$set(criteria, 'data_source', [keyword])
          }
        }
      }
    }
    return { searchIntent, criteria }
  }
}
</script>

<style scoped>
.chat-window {
  width: 100%;
  border: 1px solid #ccc;
  padding: 10px;
}

.chat-messages {
  height: 400px;
  overflow-y: auto;
  border: 1px solid #eee;
  padding: 10px;
  margin-bottom: 5px;
}

.user-message {
  text-align: right;
  background-color: #ccf;
}

input {
  width: 100%;
  padding: 5px;
}
</style>
