<template>
  <div class="home">
    <SmallScreenAlert />
    <el-container class="app-container">
      <el-header height="auto">
        <header-bar
          ref="headBar"
          @clickSearchButton="searchDialogVisible = true"
          @clickSearchByIDButton="searchByIDHandler"
          @clickSearchByLLMButton="openAIDialog"
          @clickUploadNeuron="uploadNeuronHandler"
          @switchAtlas="switchAtlas($event)"
        />
      </el-header>
      <el-container>
        <el-main>
          <div class="main-content">
            <NeuronDetail
              v-if="reFresh"
              ref="neuronDetail"
              :load-first-neuron="loadFirstNeuron"
              :neurons-list="neuronsList"
              :is-initial-state="isInitialState"
              @checkConnectedNeurons="updateNeuronAnalysis($event, true)"
              @searchSimilarNeurons="searchSimilarNeurons($event)"
              @searchROINeurons="searchROINeurons($event)"
              @neuronView="updateCurrentNeuronInfo"
              @viewNeurons="viewNeurons"
              @showNeuronMap="showNeuronMap"
              @setVisualizedAxon="setVisualizedAxon"
              @setVisualizedBasal="setVisualizedBasal"
              @setVisualizedApical="setVisualizedApical"
              @setVisualizedSoma="setVisualizedSoma"
              @changeResolution="changeResolution"
            />
          </div>
        </el-main>
        <el-aside width="auto">
          <NeuronList
            ref="neuronList"
            @neuronView="updateCurrentNeuronInfo"
            @neuronAnalysis="updateNeuronAnalysis"
            @checkNeuron="checkNeuron"
            @viewNeurons="viewNeurons"
          />
        </el-aside>
      </el-container>
    </el-container>
    <!-- 神经元搜索对话框 -->
    <el-dialog
      title="Neuron Search"
      :visible.sync="searchDialogVisible"
      width="90%"
      top="10vh"
      :close-on-click-modal="false"
    >
      <NeuronSearch
        ref="neuronSearch"
        @neuronAnalysis="updateNeuronAnalysis"
        @criteriaEmpty="handleCriteriaEmpty"
      />
      <span
        slot="footer"
        class="dialog-footer"
      >
        <el-button @click="searchDialogVisible = false">Cancel</el-button>
        <el-button
          type="primary"
          @click="Reset"
        >Reset</el-button>
        <el-button
          type="primary"
          @click="searchNeurons()"
        >Confirm</el-button>
      </span>
    </el-dialog>
    <!-- AI搜索对话框 -->
    <el-dialog
      ref="AIWindowDialog"
      title="AIPOM"
      custom-class="AIWindow"
      :visible.sync="LLMDialogVisible"
      width="50%"
      top="7vh"
      :close-on-click-modal="false"
      :modal="false"
      :append-to-body="true"
    >
      <template #title>
        <div
          id="draggable-dialog-title"
          class="draggable-dialog-title"
          style="cursor: move; display: flex; align-items: center;"
        >
          <!-- AIPOM 标题部分 -->
          <span style="font-size: 18px; font-weight: bold;">AIPOM</span>
          <!-- 问号图标 -->
          <el-tooltip
            class="item"
            effect="dark"
            content="Instructions"
            placement="top"
            style="margin-top: 5px"
          >
            <div
              class="icon-container"
              style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin-left: 5px;"
              @click="showUsageExamples"
            >
              <i
                class="el-icon-question"
                style="font-size: 14px; color: #666;"
              />
            </div>
          </el-tooltip>
          <el-tooltip
            :content="isPreciseSearch ? 'Search neuron based on exactly matching of CCFv3 ontology' : 'Search neuron based on fuzzy matching of CCFv3 ontology'"
            placement="top"
            style="margin-left: 20px"
          >
            <el-switch
              v-model="isPreciseSearch"
              active-text="Precise Search"
              @change="handleSwitchChange"
            />
          </el-tooltip>
        </div>
        <!-- 描述内容 -->
        <div style="font-size: 14px; margin-top: 14px; color: gray;">
          You are viewing an AWS-compromised AIPOM. You can search for neurons using natural language, such as: 'search MOp neurons from SEU-ALLEN.' Due to limitations on AWS servers, many AI features are only accessible through a customized deployment of NeuroXiv on dedicated servers. Click the '?' button for more details. Contact us if you have any questions.
        </div>
      </template>
      <div
        v-if="isModelLoading"
        class="inline-loading"
      >
        <i class="el-icon-loading" />
        <p>Model is loading, please wait...</p>
      </div>
      <AISearchWindow
        ref="aiSearchWindow"
        @AISearch="AISearch"
      />
      <span
        slot="footer"
        class="dialog-footer"
      >
        <el-button @click="LLMDialogVisible = false">
          Cancel
        </el-button>
        <el-button
          type="primary"
          @click="ClearMessage()"
        >Clear</el-button>
        <el-button
          type="primary"
          @click="AISearch()"
        >Confirm</el-button>
      </span>
    </el-dialog>>
    <el-dialog
      title="Instructions"
      :visible.sync="usageExamplesVisible"
      width="40%"
    >
      <div style="max-height: 60vh; overflow-y: auto;">
        <p style="font-size: 16px; margin-bottom: 10px;">
          You can search for neurons based on an exact match with the CCFv3 ontology when the "Precise Search" option is turned on, and perform a fuzzy search based on the CCFv3 ontology when the option is turned off. Enabling the "Precise Search" option means users need to use the full names as defined in the Allen Mouse Brain Common Coordinate Framework Version 3 (CCFv3) for each brain region. Of course, we have also included other full names commonly used by researchers.  When the "Precise Search" option is turned off, users don't need to be overly concerned with the completeness of the expression and the order of words. However, please note that some inaccuracies may occur in the latter case.
        </p>

        <!-- 副标题 -->
        <p style="font-size: 16px; margin-bottom: 10px;">
          Below are some usage examples:
        </p>
        <!-- 使用 ul 和 li 正确显示 -->
        <ul>
          <div
            v-for="(example, index) in usageExamples"
            :key="index"
          >
            <li style="font-size: 16px">
              <b>{{ index + 1 }}:</b> {{ example }}
            </li>
          </div>
        </ul>
        <p style="font-size: 16px; margin: 20px 0 10px;">
          Functions of Brain Regions:
          <span style="font-size: 14px; margin-left: 5px; color: #1f77d3;">
            (<a
              href="https://download.neuroxiv.org/brain_regions_functions.csv"
              target="_blank"
              style="color: #1f77d3; text-decoration: none;"
            >
              see details at https://download.neuroxiv.org/brain_regions_functions.csv
            </a>)
          </span>
        </p>
        <div style="width: 100%; border: 1px solid #dcdfe6;">
          <el-row :gutter="10">
            <el-col
              v-for="(feature, index) in supportedFeatures"
              :key="index"
              :span="8"
              style="text-align: center; padding: 10px; border: 1px solid #dcdfe6; margin-bottom: 10px;"
            >
              {{ feature }}
            </el-col>
          </el-row>
        </div>

        <!-- 底部关闭按钮 -->
      </div>
      <span
        slot="footer"
        class="dialog-footer"
      >
        <el-button @click="usageExamplesVisible = false">Close</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Ref, Watch, Prop } from 'vue-property-decorator'
import HeaderBar from '@/components/mouse/HeaderBar.vue'
import NeuronList from '@/components/mouse/NeuronList.vue'
import NeuronDetail from '@/components/mouse/NeuronDetail.vue'
import NeuronSearch from '@/components/mouse/NeuronSearch.vue'
import {
  getNeuronInfo,
  searchNeurons,
  searchSimilarNeuron,
  uploadNeuron,
  searchROINeuron,
  AIChat,
  getSearchIntent,
  ArticleSearch,
  CodeGenerator,
  executeCode,
  AI_RAG,
  getSearchCondition
} from '@/request/apis/mouse/Neuron'
import SmallScreenAlert from '@/components/common/SmallScreenAlert.vue'
import NeuronLLM from '@/components/mouse/NeuronLLM.vue'
import AISearchWindow from '@/components/mouse/AISearchWindow.vue'
import { getCachedData, setCachedData, deleteCachedData } from '@/utils/indexedDB'
import { result } from 'lodash'
import NeuronLists from '@/components/mouse/NeuronLists.vue'
import NlpHelper from '@/utils/nlpHelper'
import LlmHelper from '@/utils/LlmHelper'

@Component({
  components: {
    NeuronLLM,
    SmallScreenAlert,
    NeuronSearch,
    NeuronDetail,
    NeuronList,
    HeaderBar,
    AISearchWindow
  }
})

export default class Container extends Vue {
  @Ref('neuronDetail') readonly neuronDetail!: NeuronDetail
  @Ref('neuronSearch') readonly neuronSearch!: NeuronSearch
  @Ref('neuronList') readonly neuronList!: NeuronList
  // @Ref('neuronLists') readonly neuronLists!: NeuronLists
  @Ref('neuronLLM') readonly neuronLLM!: NeuronLLM
  @Ref('headBar') readonly headBar!: HeaderBar
  @Ref('aiSearchWindow') readonly aiSearchWindow!: AISearchWindow
  @Ref('AIWindowDialog') readonly AIWindowDialog!: any;
  private searchDialogVisible: boolean = false
  private LLMDialogVisible: boolean = false
  private reFresh: boolean = true
  private fullMorphNeurons:any[] = []
  private localMorphNeurons:any[] = []
  public neuronsList:any[] = []
  private nlpHelper: NlpHelper = new NlpHelper();
  private isModelLoading: boolean = true;
  private isModelLoaded: boolean = false;
  public isInitialState: boolean = false;
  private useRawObj: boolean = true;
  private llmHelper: any = null
  private usageExamplesVisible: boolean = false
  private isPreciseSearch:boolean = true
  // 查询示例数据
  public usageExamples = [
    'Search/Find/Look for/Show neurons with/without apical dendrite.',
    'Search/Find/Look for/Show neurons that have/don’t have apical dendrite.',
    'Search/Find/Look for/Show neurons with/without dendrite.',
    'Search/Find/Look for/Show neurons that have/don’t have dendrite.',
    'Search/Find/Look for/Show neurons with/without axon.',
    'Search/Find/Look for/Show neurons that have/don’t have axon.',
    'Do neurons with/without apical dendrite exist?',
    'Do neurons that have/don’t have apical dendrite exist?',
    'Are there neurons with/without apical dendrite?',
    'Are there neurons that have/don’t have apical dendrite?',
    'Do neurons with/without dendrite exist?',
    'Do neurons that have/don’t have dendrite exist?',
    'Are there neurons with/without dendrite?',
    'Are there neurons that have/don’t have dendrite?',
    'Do neurons with/without axon exist?',
    'Do neurons that have/don’t have axon exist?',
    'Are there neurons with/without axon?',
    'Are there neurons that have/don’t have axon?',
    'Search neurons that project/extend/elongate to [region/area].',
    'Search neurons with projection/extension/elongation to [region/area].',
    'Search neurons that arborize/extend/elongate/traverse in [region/area].',
    'Search neurons with arborization/extensions/elongation/traversal in [region/area].',
    'Search neurons that project/arborize/extend/elongate/traverse into [region/area].',
    'Search neurons with projection/arborization/extension/elongation/traversal into [region/area].',
    'Search neurons that project/arborize/extend/elongate/traverse toward [region/area].',
    'Search neurons with projection/arborization/extensions/elongation/traversal toward [region/area].',
    'Search neurons involved in [functions]'
  ];
    public supportedFeatures = ['Feeling', 'Emotion', 'Motion', 'Attention', 'Memory', 'Cognition', 'Behavior', 'Learning', 'Perception', 'Hearing', 'Metabolism', 'Smell', 'Vision', 'Taste', 'Regulation', 'Sleeping', 'Supporting', 'Eating', 'Pronunciation', 'Visceral activity', 'Coordination', 'Individual survival', 'Racial reproduction', 'Pressure', 'Awareness', 'Regulation of circadian rhythm', 'Secretion activity', 'Water electrolyte balance', 'Drinking', 'Weight', 'Blood sugar balance', 'Temperature', 'Endocrine activity', 'Body balance', 'Eye movements', 'Deliver information', 'Adjusting the core', 'Facial expression', 'Masticatory muscle movement', 'Breathing', 'Cardiovascular activity', 'Digestion', 'Immunity', 'Lingual muscle movement']
    private showUsageExamples () {
      this.usageExamplesVisible = true // 打开使用案例弹窗
    }
    private handleClose () {
      this.usageExamplesVisible = false
    }

    public handleCriteriaEmpty () {
      console.log('handleCriteriaEmpty')
      this.isInitialState = true
    }
    /**
   * 更新当前显示的 neuron info 信息
   * @param neuronDetail neuron detail
   * @private
   */
    private async updateCurrentNeuronInfo (neuronDetail: any) {
      this.neuronDetail.selectedTab = 'neuronInfo'
      await this.$nextTick()
      this.neuronDetail.neuronInfo.clearReconstruction()
      this.neuronDetail.neuronInfo.hideSoma()
      this.neuronDetail.neuronInfo.isUploadData = false
      await this.$nextTick()
      const needClear = !!this.neuronDetail.neuronInfo.neuronInfoData.id
      // console.log(this.neuronDetail.neuronInfo.neuronInfoData.id + '--need-clear:' + needClear)
      const neuronInfo = await getNeuronInfo(document.body, neuronDetail.id, this.$store.state.atlas).start()
      this.neuronDetail.neuronInfo.neuronInfoData = neuronInfo
      if (this.neuronDetail.neuronInfo.roiShown) {
        this.neuronDetail.neuronInfo.ROI.setROI(Math.round(neuronInfo.soma[0]), Math.round(neuronInfo.soma[1]), Math.round(neuronInfo.soma[2]))
      }
      if (this.neuronDetail.neuronInfo.somaShown) {
        this.neuronDetail.neuronInfo.Soma.setSoma(Math.round(neuronInfo.soma[0]), Math.round(neuronInfo.soma[1]), Math.round(neuronInfo.soma[2]))
      }
      // this.neuronDetail.neuronInfo.showSoma(100)
      // console.log('soma loaded')
      // this.neuronDetail.neuronInfo.neuronScene.updateSomaBall(Math.round(neuronInfo.soma[0]), Math.round(neuronInfo.soma[1]), Math.round(neuronInfo.soma[2]), 100)
      this.neuronDetail.neuronInfo.neuronViewerReconstructionData = neuronInfo.viewer_info
      await this.neuronDetail.neuronInfo.updateReconstruction(needClear)
      await this.$nextTick()
      this.neuronDetail.neuronInfo.showSoma(100)
    }
    /**
     * 更新当前显示的 neuron info 信息
     * @param neuronDetail neuron detail
     * @private
     */

    /**
     * 更新AI模型返回答案
     */
    private async getAIAdvice (neuronDetail: any) {
      this.neuronDetail.selectedTab = 'neuronInfo'
      await this.$nextTick()
      // this.neuronDetail.neuronInfo.clearReconstruction()
      // await this.$nextTick()
      // const needClear = !!this.neuronDetail.neuronInfo.neuronInfoData.id
      const AIAdvice = await AIChat(document.body, neuronDetail.question).start()
    // this.neuronDetail.neuronInfo.neuronInfoData = neuronInfo
    // this.neuronDetail.neuronInfo.neuronViewerReconstructionData = neuronInfo.viewer_info
    // await this.neuronDetail.neuronInfo.updateReconstruction(needClear)
    }

    /**
   * 根据神经元 ID 搜索
   */
    private async searchByIDHandler () {
      try {
        const id = (await this.$prompt('Please input a neuron id', {
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          closeOnClickModal: false
        // @ts-ignore
        })).value
        await this.updateCurrentNeuronInfo({ id })
      } catch (e) {}
    }

    /**
   * 根据选择的 neuron id 更新统计信息
   * @param neuronIds 选择的 neuron id
   * @param updateNeuronList 是否更新右侧神经元列表
   * @private
   */
    private async updateNeuronAnalysis (neuronIds: string[], updateNeuronList: boolean = false) {
      try {
        console.log('updateNeuronAnalysis')
        console.log(neuronIds)
        // eslint-disable-next-line camelcase
        const { basic_info, morpho_info, plot, proj_info, neurons } = await searchNeurons(document.body, { id_list: neuronIds }).start()
        this.neuronsList = neurons
        this.neuronDetail.selectedTab = 'neuronStates'
        this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
        await this.$nextTick()
        this.neuronDetail.neuronStates.featurePlot.renderChart()
        this.neuronDetail.neuronStates.histogramBars.renderChart()
        if (updateNeuronList) {
          this.neuronList.setListData(neurons)
        }
        this.searchDialogVisible = false
      } catch (e) {
        console.error(e)
      }
    }

    // eslint-disable-next-line camelcase
    // private sendData (basic_info: any, morpho_info: any, proj_info: any) {
    //   const data = {
    //     basic_info: basic_info, // Replace with actual data
    //     morpho_info: morpho_info, // Replace with actual data
    //     proj_info: proj_info // Replace with actual data
    //   }
    //
    //   fetch('http://10.192.40.36:5000/api/stream', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify(data)
    //   }).then(response => {
    //     console.log('Data sent successfully')
    //     // this.neuronDetail.neuronStates.neuronStatesDesc.restartSSE() // Start receiving stream data
    //     // this.neuronDetail.neuronStates.neuronStatesDesc.hasStartedSSE = true
    //   }).catch(error => {
    //     console.error('Error sending data:', error)
    //   })
    // }

    /**
   * 搜索神经元
   * @param criteria 搜索条件
   * @param ids 神经元 ID 列表
   * @param func 回调函数
   * @private
   */
    // private async searchNeurons (criteria: any = undefined, ids: string[] | undefined = undefined, func: any = () => {}) {
    //   if (!criteria) {
    //     criteria = this.neuronSearch.getSearchCriteria()
    //   }
    //   criteria['brain_atlas'] = [this.$store.state.atlas]
    //   const condition = ids ? { id_list: ids } : { criteria: criteria }
    //   // console.log(condition)
    //   try {
    //     // eslint-disable-next-line camelcase
    //     const { neurons, basic_info, morpho_info, plot, proj_info } = await searchNeurons(document.body, condition).start()
    //     this.neuronDetail.selectedTab = 'neuronStates'
    //     this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
    //     await this.$nextTick()
    //     this.neuronDetail.neuronStates.featurePlot.renderChart()
    //     this.neuronDetail.neuronStates.histogramBars.renderChart()
    //     this.searchDialogVisible = false
    //     this.neuronList.setListData(neurons)
    //     this.neuronsList = neurons
    //     // this.neuronLists.neuronListLocal.setListData(this.localMorphNeurons)
    //     func()
    //   } catch (e) {
    //     console.error(e)
    //   }
    //   await this.setVisualizedSoma()
    // }
    private async searchNeurons (criteria: any = undefined, ids: string[] | undefined = undefined, func: any = () => {}) {
      if (!criteria) {
        criteria = this.neuronSearch.getSearchCriteria()
      }
      criteria['brain_atlas'] = [this.$store.state.atlas]
      const condition = ids ? { id_list: ids } : { criteria: criteria }

      const cacheKey = ids ? `neurons_ids_${ids.join('_')}` : `neurons_criteria_${JSON.stringify(criteria)}`
      console.log(criteria)
      // 设置缓存有效期为1小时
      const CACHE_DURATION = 604800000

      // 检查缓存
      const cachedData = await getCachedData(cacheKey)
      if (cachedData) {
        console.log('have cache')
        const currentTime = new Date().getTime()
        if (currentTime - cachedData.timestamp < CACHE_DURATION) {
          console.log('use cache')
          // eslint-disable-next-line camelcase
          const { neurons, basic_info, morpho_info, plot, proj_info } = cachedData
          this.neuronsList = neurons
          console.log('cache neurons')
          console.log(neurons)
          await this.useNeuronData(neurons, basic_info, morpho_info, plot, proj_info)
          func()
          return
        } else {
          await deleteCachedData(cacheKey) // 缓存过期，移除缓存
        }
      }

      try {
        console.log('no cache')
        const response = await searchNeurons(document.body, condition).start()
        // eslint-disable-next-line camelcase
        const { neurons, basic_info, morpho_info, plot, proj_info } = response as any
        this.neuronsList = neurons
        console.log('no cache neurons')
        console.log(neurons)
        await this.useNeuronData(neurons, basic_info, morpho_info, plot, proj_info)

        // 缓存数据，附带时间戳
        console.log('make cache')
        const dataToCache = {
          timestamp: new Date().getTime(),
          neurons,
          basic_info,
          morpho_info,
          plot,
          proj_info
        }
        await setCachedData(cacheKey, dataToCache)

        func()
      } catch (e) {
        console.error(e)
      }
      await this.setVisualizedSoma()
    }

    // eslint-disable-next-line camelcase
    private async useNeuronData (neurons: any, basic_info: any, morpho_info: any, plot: any, proj_info: any) {
      this.neuronDetail.selectedTab = 'neuronStates'
      this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
      await this.$nextTick()
      this.neuronDetail.neuronStates.featurePlot.renderChart()
      this.neuronDetail.neuronStates.histogramBars.renderChart()
      this.searchDialogVisible = false
      this.neuronList.setListData(neurons)
      this.neuronsList = neurons
    }

    private async executeCode (func: any = () => {}) {
      const code = this.aiSearchWindow.code
      console.log('code is: ' + code)
      func()
      try {
      // eslint-disable-next-line camelcase
        const response = await executeCode(document.body).start()
        // let res = JSON.parse(response)
        console.log(response)
        this.aiSearchWindow.addResponseFromAPI(response.response)
        func()
      } catch (e) {
        console.error(e)
      }
    }
    // private async AISearch (func: any = () => {}) {
    //   console.time('startSearchTime')
    //   this.aiSearchWindow.sendMessage()
    //   let question = this.aiSearchWindow.lastInput
    //   console.log('question is: ' + question)
    //   let searchIntent = 'unknown intent'
    //   let searchConditions = {}
    //
    //   // try {
    //   //   const response = await CodeGenerator(document.body, question).start()
    //   //   console.log(response)
    //   //   this.aiSearchWindow.addResponseFromAPI(response.response)
    //   //   func()
    //   // } catch (e) {
    //   //   console.error(e)
    //   // }
    //   const intentMatch = question.match(/^\[(search|chat|retrieval|article)\]:\s*(.+)/i)
    //   if (intentMatch) {
    //     searchIntent = intentMatch[1].trim().toLowerCase()
    //     question = question.split(':')[1]
    //     console.log('Extracted intent: ' + searchIntent)
    //   } else {
    //     try {
    //       let response = await getSearchIntent(document.body, question).start()
    //       searchIntent = response.response.replace(/^'|'$/g, '')
    //       console.log(searchIntent)
    //       this.aiSearchWindow.addResponseFromAPI('I guess you want to ' + searchIntent + ', is that right?')
    //       func()
    //     } catch (e) {
    //       console.error(e)
    //     }
    //   }
    //   searchIntent = 'search'
    //   if (searchIntent === 'search') {
    //     // let result = this.aiSearchWindow.GetIntent(question)
    //     // console.log(result)
    //     const response = await getSearchCondition(document.body, question).start()
    //     console.log(response)
    //     let result = response.response
    //     result = JSON.parse(result.replace(/'/g, '"'))
    //     const condition = { criteria: result }
    //     console.log(result)
    //     searchConditions = condition
    //     console.log(condition)
    //     try {
    //       // eslint-disable-next-line camelcase
    //       const { neurons, basic_info, morpho_info, plot, proj_info } = await searchNeurons(document.body, searchConditions).start()
    //       this.neuronList.setListData(neurons)
    //       this.neuronDetail.selectedTab = 'neuronStates'
    //       this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
    //       await this.$nextTick()
    //       this.neuronDetail.neuronStates.featurePlot.renderChart()
    //       this.neuronDetail.neuronStates.histogramBars.renderChart()
    //       this.LLMDialogVisible = false
    //       this.aiSearchWindow.addResponseFromAPI('I have found ' + neurons.length + ' neurons')
    //       // this.aiSearchWindow.addResponseFromAPI('Are these the results you are looking for? If not please tell me more information')
    //       func()
    //     } catch (e) {
    //       this.aiSearchWindow.addResponseFromAPI('There are some issues, please try again later.')
    //       console.error(e)
    //     }
    //   }
    //   console.log('SearchTime')
    //   console.timeEnd('startSearchTime')
    // }
    private handleSwitchChange () {
      this.nlpHelper.setfuzzyMatchEnabled(!this.isPreciseSearch)
      console.log('isFuzz   ' + this.nlpHelper.fuzzyMatchEnabled)
    }
    private async AISearch (func: any = () => {}) {
      console.time('startSearchTime')
      this.aiSearchWindow.sendMessage()
      let question = this.aiSearchWindow.lastInput
      console.log('question is: ' + question)
      let searchIntent = 'unknown intent'
      let searchConditions = {}
      searchIntent = 'search'
      // if (searchIntent === 'search') {
      //   if (!this.llmHelper) {
      //     alert('LLM model is not initialized.')
      //     return
      //   }
      //
      //   try {
      //     let result = await this.llmHelper.processQuery(question)
      //     this.aiSearchWindow.addResponseFromAPI(result)
      //   } catch (error) {
      //     console.error('Error processing query:', error)
      //   }
      // }
      if (searchIntent === 'search') {
        const result = await this.nlpHelper.processQuery(question)
        console.log('decision tree:')
        console.log(result)
        const condition: Record<string, string[]> = {}

        // 遍历结果数组，将值添加到相应的键中
        result.value.forEach((item: { [x: string]: any }) => {
          const key = Object.keys(item)[0] // 获取对象中的键
          const value = item[key] // 获取对象中的值

          // 如果条件对象中已经存在该键，则将值添加到数组中；否则，创建一个新的数组
          if (condition[key]) {
            if (Array.isArray(value)) {
            // If the value is an array (e.g., range [min, max]), spread it into the array
              condition[key].push(...value)
            } else {
              condition[key].push(value)
            }
          } else {
            condition[key] = Array.isArray(value) ? [...value] : [value] // Initialize with value or spread array
          }
        })

        // 添加其他查询条件（例如，brain_atlas）并初始化为空数组
        if (!condition['brain_atlas']) {
          condition['brain_atlas'] = [this.$store.state.atlas.toString()] // 你可以根据需求添加默认值或其他逻辑
        }
        searchConditions = { criteria: condition }
        this.aiSearchWindow.addResponseFromAPI('AIPOM is searching data by: ' + JSON.stringify(condition))
        console.log(searchConditions)
        try {
        // eslint-disable-next-line camelcase
          const { neurons, basic_info, morpho_info, plot, proj_info, overview } = await searchNeurons(document.body, searchConditions).start()
          this.neuronList.setListData(neurons)
          this.neuronsList = neurons
          this.neuronDetail.selectedTab = 'neuronStates'
          this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
          await this.$nextTick()
          this.neuronDetail.neuronStates.featurePlot.renderChart()
          this.neuronDetail.neuronStates.histogramBars.renderChart()
          // this.LLMDialogVisible = false
          this.aiSearchWindow.addResponseFromAPI('I have found ' + neurons.length + ' neurons')
          this.aiSearchWindow.addResponseFromAPI('Data Overview: \n' + overview)
          func()
        } catch (e) {
          this.aiSearchWindow.addResponseFromAPI('There are some issues, please try again later.')
          console.error(e)
        }
      }

      // try {
      //   const response = await CodeGenerator(document.body, question).start()
      //   console.log(response)
      //   this.aiSearchWindow.addResponseFromAPI(response.response)
      //   func()
      // } catch (e) {
      //   console.error(e)
      // }

      // 检查用户输入是否为 [Intent]: query 形式并验证意图
      // const intentMatch = question.match(/^\[(search|chat|retrieval|article)\]:\s*(.+)/i)
      // if (intentMatch) {
      //   searchIntent = intentMatch[1].trim().toLowerCase()
      //   question = question.split(':')[1]
      //   console.log('Extracted intent: ' + searchIntent)
      // } else {
      //   try {
      //     let response = await getSearchIntent(document.body, question).start()
      //     searchIntent = response.response.replace(/^'|'$/g, '')
      //     console.log(searchIntent)
      //     this.aiSearchWindow.addResponseFromAPI('I guess you want to ' + searchIntent + ', is that right?')
      //     func()
      //   } catch (e) {
      //     console.error(e)
      //   }
      // }
      // if (searchIntent === 'article') {
      //   try {
      //     const response = await ArticleSearch(document.body, question).start()
      //     console.log(response)
      //     this.aiSearchWindow.addResponseFromAPI(response.response.articles)
      //     func()
      //   } catch (e) {
      //     console.error(e)
      //   }
      // }
      // searchIntent = 'search'
      // if (searchIntent === 'search') {
      //   // let result = this.aiSearchWindow.GetIntent(question)
      //   // console.log(result)
      //   const response = await getSearchCondition(document.body, question).start()
      //   let result = response.response
      //   result = JSON.parse(result.replace(/'/g, '"'))
      //   const condition = { criteria: result }
      //   searchConditions = condition
      //   console.log(condition)
      //   try {
      //     // eslint-disable-next-line camelcase
      //     const { neurons, basic_info, morpho_info, plot, proj_info } = await searchNeurons(document.body, searchConditions).start()
      //     this.neuronList.setListData(neurons)
      //     this.neuronDetail.selectedTab = 'neuronStates'
      //     this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
      //     await this.$nextTick()
      //     this.neuronDetail.neuronStates.featurePlot.renderChart()
      //     this.neuronDetail.neuronStates.histogramBars.renderChart()
      //     this.LLMDialogVisible = false
      //     this.aiSearchWindow.addResponseFromAPI('I have found ' + neurons.length + ' neurons')
      //     // this.aiSearchWindow.addResponseFromAPI('Are these the results you are looking for? If not please tell me more information')
      //     func()
      //   } catch (e) {
      //     this.aiSearchWindow.addResponseFromAPI('There are some issues, please try again later.')
      //     console.error(e)
      //   }
      // }

      // if (searchIntent === 'chat') {
      //   try {
      //     const response = await AIChat(document.body, question).start()
      //     console.log(response)
      //     const formattedResponse = response.response.replace(/\n/g, '<br>')
      //     this.aiSearchWindow.addResponseFromAPI(formattedResponse)
      //     this.aiSearchWindow.addResponseFromAPI('Did you get the results you wanted? If not please enrich your question!')
      //     func()
      //   } catch (e) {
      //     console.error(e)
      //   }
      // }

    // if (searchIntent === 'retrieval') {
    //   try {
    //     const response = await AI_RAG(document.body, question).start()
    //     console.log(response)
    //     const formattedResponse = response.response.replace(/\n/g, '<br>')
    //     this.aiSearchWindow.addResponseFromAPI(formattedResponse)
    //     this.aiSearchWindow.addResponseFromAPI('Did you get the results you wanted? If not please enrich your question!')
    //     func()
    //   } catch (e) {
    //     console.error(e)
    //   }
    // }
    // console.timeEnd('startSearchTime')
    }

    // private async AISearch (func: any = () => {}) {
    //   this.aiSearchWindow.sendMessage()
    //   const question = this.aiSearchWindow.lastInput
    //   console.log('question is: ' + question)
    //   let searchIntent = 'unknown intent'
    //   let searchConditions = {}
    //   try {
    //     let response = await getSearchIntent(document.body, question).start()
    //     searchIntent = response.response.replace(/^'|'$/g, '')
    //     console.log(searchIntent)
    //     this.aiSearchWindow.addResponseFromAPI('I guess you want to ' + searchIntent + ', is that right?')
    //     func()
    //     if (searchIntent === 'search articles') {
    //       try {
    //         const response = await ArticleSearch(document.body, question).start()
    //         // let res = JSON.parse(response)
    //         console.log(response)
    //         this.aiSearchWindow.addResponseFromAPI(response.response.articles)
    //         // this.aiSearchWindow.addResponseFromAPI('Did you get the results you wanted? If not please enrich your question!')
    //         func()
    //       } catch (e) {
    //         console.error(e)
    //       }
    //     }
    //     if (searchIntent === 'search neuron data') {
    //       let result = this.aiSearchWindow.GetIntent(question)
    //       const condition = { criteria: result }
    //       searchConditions = condition
    //       console.log(condition)
    //       try {
    //         // eslint-disable-next-line camelcase
    //         const { neurons, basic_info, morpho_info, plot, proj_info } = await searchNeurons(document.body, searchConditions).start()
    //         this.neuronList.setListData(neurons)
    //         this.neuronDetail.selectedTab = 'neuronStates'
    //         this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
    //         await this.$nextTick()
    //         this.neuronDetail.neuronStates.featurePlot.renderChart()
    //         this.neuronDetail.neuronStates.histogramBars.renderChart()
    //         this.LLMDialogVisible = false
    //         this.aiSearchWindow.addResponseFromAPI('I have found ' + neurons.length + ' neurons')
    //         this.aiSearchWindow.addResponseFromAPI('Are these the results you are looking for? If not please tell me more information')
    //         func()
    //       } catch (e) {
    //         console.error(e)
    //       }
    //     }
    //     if (searchIntent === 'chat with neuroxiv website') {
    //       try {
    //         // eslint-disable-next-line camelcase
    //         const response = await AIChat(document.body, question).start()
    //         // let res = JSON.parse(response)
    //         console.log(response)
    //         const formattedResponse = response.response.replace(/\n/g, '<br>')
    //         this.aiSearchWindow.addResponseFromAPI(formattedResponse)
    //         // this.aiSearchWindow.addResponseFromAPI(response.response)
    //         this.aiSearchWindow.addResponseFromAPI('Did you get the results you wanted? If not please enrich your question!')
    //         func()
    //       } catch (e) {
    //         console.error(e)
    //       }
    //     }
    //     if (searchIntent === 'summary') {
    //       try {
    //         // eslint-disable-next-line camelcase
    //         const response = await AIChat(document.body, question).start()
    //         // let res = JSON.parse(response)
    //         console.log(response)
    //         const formattedResponse = response.response.replace(/\n/g, '<br>')
    //         this.aiSearchWindow.addResponseFromAPI(formattedResponse)
    //         // this.aiSearchWindow.addResponseFromAPI(response.response)
    //         this.aiSearchWindow.addResponseFromAPI('Did you get the results you wanted? If not please enrich your question!')
    //         func()
    //       } catch (e) {
    //         console.error(e)
    //       }
    //       this.aiSearchWindow.addResponseFromAPI('NeuAgent didn\'t understand what you meant, can you ask it differently?')
    //     }
    //   } catch (e) {
    //     console.error(e)
    //   }
    // }

    private async ClearMessage (func: any = () => {}) {
      this.aiSearchWindow.messages = []
    }

    /**
   * 上传神经元并计算神经元特征
   * @param param 通过该参数获得要上传的文件
   */
    // private async uploadNeuronHandler (param: any) {
    //   try {
    //     this.neuronDetail.selectedTab = 'neuronInfo'
    //     await this.$nextTick()
    //     const needClear = !!this.neuronDetail.neuronInfo.neuronInfoData.id
    //     const form = new FormData()
    //     form.append('file', param.file)
    //     const neuronInfo = await uploadNeuron(document.body, form).start()
    //     this.neuronDetail.neuronInfo.clearReconstruction()
    //     await this.$nextTick()
    //     this.neuronDetail.neuronInfo.neuronInfoData = neuronInfo
    //     this.neuronDetail.neuronInfo.neuronViewerReconstructionData = neuronInfo.viewer_info
    //     await this.neuronDetail.neuronInfo.updateReconstruction(needClear)
    //   } catch (e) {
    //     console.error(e)
    //   }
    // }

    private async uploadNeuronHandler (param: any) {
      try {
        this.neuronDetail.selectedTab = 'neuronInfo'
        await this.$nextTick()
        const needClear = !!this.neuronDetail.neuronInfo.neuronInfoData.id
        const form = new FormData()
        form.append('file', param.file)

        // 调用实际的上传函数
        const loadingTarget = document.body
        const requestInstance = uploadNeuron(loadingTarget, form)

        // 处理请求结果
        requestInstance.start().then((neuronInfo) => {
          this.neuronDetail.neuronInfo.clearReconstruction()
          this.neuronDetail.neuronInfo.hideSoma()
          this.neuronDetail.neuronInfo.isUploadData = false
          this.$nextTick().then(() => {
            this.neuronDetail.neuronInfo.isUploadData = true
            this.neuronDetail.neuronInfo.neuronInfoData = neuronInfo
            this.neuronDetail.neuronInfo.showSoma(100)
            this.neuronDetail.neuronInfo.neuronViewerReconstructionData = neuronInfo.viewer_info
            this.neuronDetail.neuronInfo.updateReconstruction(needClear)

            // 调用成功回调
            param.onSuccess?.(neuronInfo)
          })
        }).catch((error) => {
          console.error(error)
          param.onError?.(new ErrorEvent('error', { message: '上传神经元失败' }))
        })
      } catch (e) {
        console.error(e)
        param.onError?.(new ErrorEvent('error', { message: '上传神经元失败' }))
      }
    }

    /**
   * 清空搜索条件
   * @constructor
   * @private
   */
    private async Reset () {
      this.neuronSearch.selectedConditions = []
    }

    /**
   * 搜索相似神经元，返回搜索条件
   * @param neuronInfo 神经元的信息
   * @private
   */
    private async searchSimilarNeurons (neuronInfo: any) {
      try {
        this.searchDialogVisible = true
        await this.$nextTick()
        neuronInfo['brain_atlas'] = this.$store.state.atlas
        this.neuronSearch.selectedConditions = await searchSimilarNeuron(document.body, neuronInfo).start()
        console.log(this.neuronSearch.selectedConditions)
      } catch (e) {
        console.error(e)
      }
      await this.setVisualizedSoma()
    }

    /**
   * 搜索ROI神经元
   * @param roiParameter ROI的位置与半径，用字符串表示，x_y_z_r
   * @private
   */
    private async searchROINeurons (roiParameter: string) {
      try {
      // eslint-disable-next-line camelcase
        const { neurons, basic_info, morpho_info, plot, proj_info } = await searchROINeuron(document.body, roiParameter, this.$store.state.atlas).start()
        // this.fullMorphNeurons = []
        // this.localMorphNeurons = []
        // neurons.forEach((neuron: { id: string | string[] }) => {
        //   if (neuron.id.includes('full')) {
        //     this.fullMorphNeurons.push(neuron)
        //   } else if (neuron.id.includes('local')) {
        //     this.localMorphNeurons.push(neuron)
        //   }
        // })
        this.neuronList.setListData(neurons)
        // this.neuronLists.neuronListLocal.setListData(this.localMorphNeurons)
        // this.neuronLists.neuronList.setListData(neurons)
        this.neuronDetail.selectedTab = 'neuronStates'
        this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
        await this.$nextTick()
        this.neuronDetail.neuronStates.featurePlot.renderChart()
        this.neuronDetail.neuronStates.histogramBars.renderChart()
      } catch (e) {
        console.log(e)
      }
      await this.setVisualizedSoma()
    }

    /**
   * 选中或取消右方神经元列表中的神经元的神经元的回调函数，用于在3D viewer里展示
   * @param neuronDetail 神经元的具体信息，包括是否有dendrite、axon，id以及是否选中
   * @param switchTab 是否要主动切换到3D viewer栏
   */
    // public async checkNeuron (neuronDetail: any, switchTab: boolean = false) {
    //   if (switchTab && this.neuronDetail.selectedTab !== 'multiNeuronsViewer') {
    //     this.neuronDetail.selectedTab = 'multiNeuronsViewer'
    //     await this.$nextTick()
    //   }
    //   await this.$nextTick()
    //   if (this.neuronDetail.selectedTab === 'multiNeuronsViewer') {
    //     let dendriteData = {
    //       id: neuronDetail.id + '_basal',
    //       name: neuronDetail.id + '_basal',
    //       src: '',
    //       // eslint-disable-next-line camelcase
    //       rgb_triplet: [0, 0, 255],
    //       info: {
    //         id: neuronDetail.id,
    //         cellType: neuronDetail.celltype
    //       }
    //     }
    //     let apicalData = {
    //       id: neuronDetail.id + '_apical',
    //       name: neuronDetail.id + '_apical',
    //       src: '',
    //       // eslint-disable-next-line camelcase
    //       rgb_triplet: [255, 0, 255],
    //       info: {
    //         id: neuronDetail.id,
    //         cellType: neuronDetail.celltype
    //       }
    //     }
    //     let axonData = {
    //       id: neuronDetail.id + '_axon',
    //       name: neuronDetail.id + '_axon',
    //       src: '',
    //       // eslint-disable-next-line camelcase
    //       rgb_triplet: [255, 0, 0],
    //       info: {
    //         id: neuronDetail.id,
    //         cellType: neuronDetail.celltype
    //       }
    //     }
    //     let localData = {
    //       id: neuronDetail.id + '_local',
    //       name: neuronDetail.id + '_local',
    //       src: '',
    //       // eslint-disable-next-line camelcase
    //       rgb_triplet: [0, 0, 255],
    //       info: {
    //         id: neuronDetail.id,
    //         cellType: neuronDetail.celltype
    //       }
    //     }
    //     if (this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(dendriteData) ||
    //         this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(axonData) || this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(apicalData) || this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(localData) ||
    //         !neuronDetail.selected) {
    //       if (neuronDetail['has_dendrite'] && this.neuronDetail.multiNeuronsViewer.showAllBasal) {
    //         this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(dendriteData, neuronDetail.selected)
    //       }
    //       if (neuronDetail['has_axon'] && this.neuronDetail.multiNeuronsViewer.showAllAxon) {
    //         this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(axonData, neuronDetail.selected)
    //       }
    //       if (neuronDetail['has_apical'] && this.neuronDetail.multiNeuronsViewer.showAllApical) {
    //         this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(apicalData, neuronDetail.selected)
    //       }
    //       if (neuronDetail['has_local'] && this.neuronDetail.multiNeuronsViewer.showAllBasal) {
    //         this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(localData, neuronDetail.selected)
    //       }
    //     } else {
    //       const neuronInfo = await getNeuronInfo(document.body, neuronDetail.id, this.$store.state.atlas).start()
    //       console.log(neuronInfo)
    //       this.neuronDetail.multiNeuronsViewer.neuronScene.multiViewerSomaPos.set(neuronDetail.id, neuronInfo.soma)
    //       dendriteData.src = neuronInfo.viewer_info[0].children[0].src
    //       console.log(dendriteData.src)
    //       axonData.src = neuronInfo.viewer_info[0].children[1].src
    //       apicalData.src = neuronInfo.viewer_info[0].children[2].src
    //       localData.src = neuronInfo.viewer_info[0].children[3].src
    //       if (neuronDetail['has_dendrite']) {
    //         await this.neuronDetail.multiNeuronsViewer.neuronScene.loadObj(dendriteData)
    //         this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(dendriteData, this.neuronDetail.multiNeuronsViewer.showAllBasal)
    //       }
    //       if (neuronDetail['has_axon']) {
    //         await this.neuronDetail.multiNeuronsViewer.neuronScene.loadObj(axonData)
    //         this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(axonData, this.neuronDetail.multiNeuronsViewer.showAllAxon)
    //       }
    //       if (neuronDetail['has_apical']) {
    //         await this.neuronDetail.multiNeuronsViewer.neuronScene.loadObj(apicalData)
    //         this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(apicalData, this.neuronDetail.multiNeuronsViewer.showAllApical)
    //       }
    //       if (neuronDetail['has_local']) {
    //         await this.neuronDetail.multiNeuronsViewer.neuronScene.loadObj(localData)
    //         this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(localData, this.neuronDetail.multiNeuronsViewer.showAllBasal)
    //       }
    //     }
    //     await this.setVisualizedSoma()
    //   }
    // }
    public async checkNeuron (neuronDetail: any, switchTab: boolean = false) {
      if (switchTab && this.neuronDetail.selectedTab !== 'multiNeuronsViewer') {
        this.neuronDetail.selectedTab = 'multiNeuronsViewer'
        await this.$nextTick()
      }

      if (this.neuronDetail.selectedTab !== 'multiNeuronsViewer') {
        return
      }

      const baseData = {
        id: neuronDetail.id,
        name: neuronDetail.id,
        src: '',
        info: {
          id: neuronDetail.id,
          cellType: neuronDetail.celltype
        }
      }

      const dendriteData = { ...baseData, id: neuronDetail.id + '_basal', name: neuronDetail.id + '_basal', rgb_triplet: [0, 0, 255] }
      const apicalData = { ...baseData, id: neuronDetail.id + '_apical', name: neuronDetail.id + '_apical', rgb_triplet: [255, 0, 255] }
      const axonData = { ...baseData, id: neuronDetail.id + '_axon', name: neuronDetail.id + '_axon', rgb_triplet: [255, 0, 0] }
      const localData = { ...baseData, id: neuronDetail.id + '_local', name: neuronDetail.id + '_local', rgb_triplet: [0, 0, 255] }

      const neuronScene = this.neuronDetail.multiNeuronsViewer.neuronScene

      const checkLoadComponent = (data:any) => neuronScene.checkLoadComponent(data)

      if ([dendriteData, apicalData, axonData, localData].some(checkLoadComponent) || !neuronDetail.selected) {
        if (neuronDetail['has_dendrite'] && this.neuronDetail.multiNeuronsViewer.showAllBasal) {
          neuronScene.setComponentVisible(dendriteData, neuronDetail.selected)
        }
        if (neuronDetail['has_axon'] && this.neuronDetail.multiNeuronsViewer.showAllAxon) {
          neuronScene.setComponentVisible(axonData, neuronDetail.selected)
        }
        if (neuronDetail['has_apical'] && this.neuronDetail.multiNeuronsViewer.showAllApical) {
          neuronScene.setComponentVisible(apicalData, neuronDetail.selected)
        }
        if (neuronDetail['has_local'] && this.neuronDetail.multiNeuronsViewer.showAllBasal) {
          neuronScene.setComponentVisible(localData, neuronDetail.selected)
        }
      } else {
        const neuronInfo = await getNeuronInfo(document.body, neuronDetail.id, this.$store.state.atlas).start()
        console.log(neuronInfo)

        this.neuronDetail.multiNeuronsViewer.neuronScene.multiViewerSomaPos.set(neuronDetail.id, neuronInfo.soma)

        dendriteData.src = neuronInfo.viewer_info[0].children[0].src
        axonData.src = neuronInfo.viewer_info[0].children[1].src
        apicalData.src = neuronInfo.viewer_info[0].children[2].src
        localData.src = neuronInfo.viewer_info[0].children[3].src

        const loadAndSetVisible = async (data:any, condition: any, visibility: boolean) => {
          if (condition) {
            await neuronScene.loadObj(data)
            neuronScene.setComponentVisible(data, visibility)
          }
        }

        await Promise.all([
          loadAndSetVisible(dendriteData, neuronDetail['has_dendrite'], this.neuronDetail.multiNeuronsViewer.showAllBasal),
          loadAndSetVisible(axonData, neuronDetail['has_axon'], this.neuronDetail.multiNeuronsViewer.showAllAxon),
          loadAndSetVisible(apicalData, neuronDetail['has_apical'], this.neuronDetail.multiNeuronsViewer.showAllApical),
          loadAndSetVisible(localData, neuronDetail['has_local'], this.neuronDetail.multiNeuronsViewer.showAllBasal)
        ])
      }

      await this.setVisualizedSoma()
    }

    /**
   * 将神经元列表中勾选的的神经元进行展示
   */
    public async viewNeurons () {
      let neuronsDetail = this.neuronList.getSelectedItems()
      this.neuronDetail.multiNeuronsViewer.neuronScene.setAllNeuronsVisible(false)
      neuronsDetail.forEach((neuronDetail: any) => {
        this.checkNeuron(neuronDetail, true)
      })
    }

    /**
   * 将神经元列表中勾选的的神经元进行展示
   */
    public async setVisualizedSoma () {
      let neuronsDetail = this.neuronList.getSelectedItems()
      let selectedIds = new Set(neuronsDetail.map(neuronDetail => neuronDetail.id))

      // 显示选中的神经元
      neuronsDetail.forEach((neuronDetail: any) => {
        this.neuronDetail.multiNeuronsViewer.neuronScene.showMultiViewerSomaBall(neuronDetail.id, 100, this.neuronDetail.multiNeuronsViewer.showAllSoma)
      })

      // 清除Map中未被选中的神经元
      this.neuronDetail.multiNeuronsViewer.neuronScene.multiViewerSoma.forEach((value, key) => {
        if (!selectedIds.has(key)) {
          this.neuronDetail.multiNeuronsViewer.neuronScene.unloadMultiViewerSomaBalls(key)
          this.neuronDetail.multiNeuronsViewer.neuronScene.multiViewerSoma.delete(key)
        }
      })
    }
    public async setVisualizedAxon ($event: any) {
      let neuronsDetail = this.neuronList.getSelectedItems()
      neuronsDetail.forEach((neuronDetail: any) => {
        let axonData = {
          id: neuronDetail.id + '_axon',
          name: neuronDetail.id + '_axon',
          src: '',
          // eslint-disable-next-line camelcase
          rgb_triplet: [255, 0, 0],
          info: {
            id: neuronDetail.id,
            cellType: neuronDetail.celltype
          }
        }
        if (this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(axonData)) {
          if (neuronDetail['has_axon']) {
            this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(axonData, this.neuronDetail.multiNeuronsViewer.showAllAxon)
          }
        }
      })
    }
    public async setVisualizedBasal () {
      let neuronsDetail = this.neuronList.getSelectedItems()
      neuronsDetail.forEach((neuronDetail: any) => {
        let dendriteData = {
          id: neuronDetail.id + '_basal',
          name: neuronDetail.id + '_basal',
          src: '',
          // eslint-disable-next-line camelcase
          rgb_triplet: [0, 0, 255],
          info: {
            id: neuronDetail.id,
            cellType: neuronDetail.celltype
          }
        }
        let localData = {
          id: neuronDetail.id + '_local',
          name: neuronDetail.id + '_local',
          src: '',
          // eslint-disable-next-line camelcase
          rgb_triplet: [0, 0, 255],
          info: {
            id: neuronDetail.id,
            cellType: neuronDetail.celltype
          }
        }
        if (this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(dendriteData) || this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(localData)) {
          if (neuronDetail['has_dendrite']) {
            this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(dendriteData, this.neuronDetail.multiNeuronsViewer.showAllBasal)
          }
          if (neuronDetail['has_local']) {
            this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(localData, this.neuronDetail.multiNeuronsViewer.showAllBasal)
          }
        }
      })
    }
    public async setVisualizedApical () {
      let neuronsDetail = this.neuronList.getSelectedItems()
      neuronsDetail.forEach((neuronDetail: any) => {
        let apicalData = {
          id: neuronDetail.id + '_apical',
          name: neuronDetail.id + '_apical',
          src: '',
          // eslint-disable-next-line camelcase
          rgb_triplet: [255, 0, 255],
          info: {
            id: neuronDetail.id,
            cellType: neuronDetail.celltype
          }
        }
        if (this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(apicalData)) {
          if (neuronDetail['has_dendrite']) {
            this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(apicalData, this.neuronDetail.multiNeuronsViewer.showAllApical)
          }
        }
      })
    }

    private changeResolution () {
      let neuronsDetail = this.neuronList.getSelectedItems()
      const showAllAxon = this.neuronDetail.multiNeuronsViewer.showAllAxon
      const showAllApical = this.neuronDetail.multiNeuronsViewer.showAllApical
      const showAllBasal = this.neuronDetail.multiNeuronsViewer.showAllBasal

      neuronsDetail.forEach((neuronDetail: any) => {
        const baseData = {
          id: neuronDetail.id,
          name: neuronDetail.id,
          src: '',
          info: {
            id: neuronDetail.id,
            cellType: neuronDetail.celltype
          }
        }

        // 生成不同文件路径的后缀名，基于标志位 `useRawObj` 判断
        const fileSuffix = this.useRawObj ? '_raw.obj' : '.obj'
        this.neuronDetail.multiNeuronsViewer.buttonText = this.useRawObj ? 'Switch to downsampled morpho' : 'Switch to raw morpho'

        // 构建 dendrite, apical, 和 axon 对象
        const dendrite = {
          ...baseData,
          id: neuronDetail.id + '_basal',
          name: neuronDetail.id + '_basal',
          rgb_triplet: [0, 0, 255],
          src: `/data/${neuronDetail.id}/${neuronDetail.id}_basal${fileSuffix}`
        }

        const apical = {
          ...baseData,
          id: neuronDetail.id + '_apical',
          name: neuronDetail.id + '_apical',
          rgb_triplet: [255, 0, 255],
          src: `/data/${neuronDetail.id}/${neuronDetail.id}_apical${fileSuffix}`
        }

        const axon = {
          ...baseData,
          id: neuronDetail.id + '_axon',
          name: neuronDetail.id + '_axon',
          rgb_triplet: [255, 0, 0],
          src: `/data/${neuronDetail.id}/${neuronDetail.id}_axon${fileSuffix}`
        }

        // 检查 has_dendrite, has_axon, 和 has_apical 是否为 1，然后有选择地加载
        if (neuronDetail['has_axon']) {
          console.log('showAllAxon')
          console.log(showAllAxon)
          this.neuronDetail.multiNeuronsViewer.neuronScene.loadObjSetVisible(axon, showAllAxon)
        }

        if (neuronDetail['has_dendrite']) {
          this.neuronDetail.multiNeuronsViewer.neuronScene.loadObjSetVisible(dendrite, showAllBasal)
        }

        if (neuronDetail['has_apical']) {
          this.neuronDetail.multiNeuronsViewer.neuronScene.loadObjSetVisible(apical, showAllApical)
        }
      })

      // 切换标志位，以便下次调用时使用不同的文件类型
      this.useRawObj = !this.useRawObj
    }

    /**
   * 加载神经元列表第一个神经元
   */
    public async loadFirstNeuron () {
      await this.updateCurrentNeuronInfo(this.neuronList.getFirstItem())
    }

    public async showNeuronMap () {
      this.neuronDetail.multiNeuronsViewer.neuronScene.showMap(10)
    }

    /**
   * 切换当前atlas
   * @param atlas
   */
    public async switchAtlas (atlas: string) {
    // location.reload()
    // this.headBar.setAtlas(atlas)
      this.$store.commit('updateAtlas', atlas)
      this.reFresh = false
      this.$nextTick(() => {
        this.reFresh = true
        let criteria = {
          brain_atlas: [this.$store.state.atlas]
        }
        this.searchNeurons(criteria, undefined, () => {
          this.neuronDetail.selectedTab = 'multiNeuronsViewer'
        })
      })
    }
    openAIDialog () {
      this.LLMDialogVisible = true // 1. 设置对话框可见

      this.$nextTick(() => { // 2. 确保DOM已更新
        if (!this.isModelLoaded) {
        // 3. 显示加载动画
          const loadingInstance = this.$loading({
            lock: true,
            text: 'Model is loading, please wait...',
            spinner: 'el-icon-loading',
            background: 'rgba(0, 0, 0, 0.7)'
          })

          // 4. 使用 requestAnimationFrame 确保渲染完成后再异步加载模型
          requestAnimationFrame(() => {
            //   setTimeout(() => { // 确保异步加载模型
            //     this.loadLocalLLMIfNeeded()
            //       .then(() => {
            //         loadingInstance.close() // 模型加载完后关闭加载动画
            //         this.isModelLoaded = true // 更新状态
            //       })
            //       .catch((error) => {
            //         loadingInstance.close() // 错误处理
            //         console.error('Error loading model:', error)
            //       })
            //   }, 10) // 延迟10毫秒，确保加载模型的操作在动画之后
            // })
            setTimeout(() => { // 确保异步加载模型
              this.loadModelIfNeeded()
                .then(() => {
                  loadingInstance.close() // 模型加载完后关闭加载动画
                  this.isModelLoaded = true // 更新状态
                })
                .catch((error) => {
                  loadingInstance.close() // 错误处理
                  console.error('Error loading model:', error)
                })
            }, 10) // 延迟10毫秒，确保加载模型的操作在动画之后
          })
        }
      })
    }

    async loadModelIfNeeded () {
      if (!this.isModelLoaded) {
        this.isModelLoading = true
        await this.loadNlpModelAsync()
        this.isModelLoaded = true // Mark model as loaded
        this.isModelLoading = false // Hide loading spinner
      }
    }

    async loadNlpModelAsync () {
      try {
        await this.nlpHelper.initializeNlp()
        console.log('NLP Helper initialized successfully.')
      } catch (error) {
        console.error('Error initializing NLP Helper:', error)
      }
    }
    async loadLocalLLMIfNeeded () {
      if (!this.isModelLoaded) {
        this.isModelLoading = true
        await this.loadLocalLLMAsync()
        this.isModelLoaded = true // Mark model as loaded
        this.isModelLoading = false // Hide loading spinner
      }
    }

    async loadLocalLLMAsync () {
      try {
        this.llmHelper = new LlmHelper('/assets/gemma-2b-it-gpu-int4.bin') // 替换为模型文件名
        await this.llmHelper.initializeLlm()
        console.log('LLM model initialized successfully.')
      } catch (error) {
        console.error('Error initializing LLM model:', error)
      }
    }

    @Watch('LLMDialogVisible') // 监听对话框的可见性变化
    onDialogVisibleChange (visible: boolean) {
      if (visible) {
        this.centerDialog() // 重置对话框位置
      }
    }

    centerDialog () {
      const dialogRef = this.$refs.AIWindowDialog as any
      if (!dialogRef || !dialogRef.$el) return

      const dialogEl = dialogRef.$el.querySelector('.el-dialog')
      if (dialogEl) {
        // 使用 fixed 定位使其相对于视口定位
        dialogEl.style.position = 'fixed'
        dialogEl.style.margin = '0' // 移除默认 margin

        // 获取窗口和对话框的宽度和高度
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const dialogWidth = dialogEl.offsetWidth
        const dialogHeight = dialogEl.offsetHeight

        // 计算对话框的中心点位置
        const centerX = (viewportWidth - dialogWidth) / 2
        const centerY = (viewportHeight - dialogHeight) / 2

        // 设置对话框位置并让其中心对齐页面中心
        dialogEl.style.left = `${centerX}px`
        dialogEl.style.top = `${centerY}px`
        dialogEl.style.transform = 'translate(-50%, -50%)' // 确保对话框的中心对齐到页面中心
      }
    }

    initializeDraggableDialog () {
      const dialogRef = this.$refs.AIWindowDialog as any // 获取对话框 ref
      if (!dialogRef || !dialogRef.$el) return

      const dialogEl = dialogRef.$el.querySelector('.el-dialog') // 获取对话框的 DOM 元素
      const headerEl = dialogEl?.querySelector('#draggable-dialog-title') // 获取标题部分

      if (headerEl && dialogEl) {
        // 设置初始位置
        this.centerDialog()

        headerEl.onmousedown = (e: MouseEvent) => {
          e.preventDefault() // 阻止默认事件以避免选中文本

          // 获取对话框的当前矩形位置
          const dialogRect = dialogEl.getBoundingClientRect()
          // 计算鼠标点击点和对话框左上角的偏移
          const offsetX = e.clientX - dialogRect.left
          const offsetY = e.clientY - dialogRect.top

          const onMouseMove = (e: MouseEvent) => {
            // 鼠标移动时，计算新的对话框位置
            const left = e.clientX - offsetX
            const top = e.clientY - offsetY
            dialogEl.style.left = `${left}px`
            dialogEl.style.top = `${top}px`
            dialogEl.style.transform = 'translate(0, 0)' // 清除 transform 使其平滑移动
          }

          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
          }

          document.addEventListener('mousemove', onMouseMove)
          document.addEventListener('mouseup', onMouseUp)
        }
      }
    }
    @Watch('$route.query.id')
    async handleIDChange (newId: string, oldId: string) {
      if (newId && newId !== oldId) {
        await this.updateCurrentNeuronInfo({ id: newId })
      }
    }
    mounted () {
      setTimeout(async () => {
        console.log('----------route----------', this.$route.query)

        // 检查是否存在 `id` 参数
        if (this.$route.query.hasOwnProperty('id')) {
          // 如果有 `id` 参数，调用 `updateCurrentNeuronInfo`
          await this.updateCurrentNeuronInfo({ id: this.$route.query['id'] })
        } else if (this.$route.query.hasOwnProperty('brainRegion') && this.$route.query.hasOwnProperty('atlasName')) {
          // 如果没有 `id` 参数，但有 `brainRegion` 和 `atlasName` 参数
          // this.headBar.setAtlas(this.$route.query['atlasName'])
          this.$store.commit('updateAtlas', this.$route.query['atlasName'])
          this.$nextTick(() => {
            let criteria = {
              brain_atlas: [this.$store.state.atlas],
              celltype: [this.$route.query['brainRegion']]
            }
            this.searchNeurons(criteria)
          })
        } else {
          // 如果没有 `id`、`brainRegion` 和 `atlasName` 参数，按默认逻辑加载
          let criteria = {
            brain_atlas: [this.$store.state.atlas]
          }
          this.searchNeurons(criteria, undefined, () => {
            this.neuronDetail.selectedTab = 'multiNeuronsViewer'
          })
        }
      }, 2000)

      this.initializeDraggableDialog()
    }

  // mounted () {
  //   setTimeout(() => {
  //     console.log('----------route----------', this.$route.query)
  //     if (this.$route.query.hasOwnProperty('brainRegion') && this.$route.query.hasOwnProperty('atlasName')) {
  //     // @ts-ignore
  //     // this.switchAtlas(this.$route.query['atlasName'])
  //       this.headBar.setAtlas(this.$route.query['atlasName'])
  //       // @ts-ignore
  //       this.$store.commit('updateAtlas', this.$route.query['atlasName'])
  //       this.$nextTick(() => {
  //         let criteria = {
  //           brain_atlas: [this.$store.state.atlas],
  //           celltype: [this.$route.query['brainRegion']]
  //         }
  //         this.searchNeurons(criteria)
  //       })
  //     } else {
  //     // console.log('mounted atlas', this.$store.state.atlas)
  //       let criteria = {
  //         brain_atlas: [this.$store.state.atlas]
  //       }
  //       this.searchNeurons(criteria, undefined, () => {
  //         this.neuronDetail.selectedTab = 'multiNeuronsViewer'
  //       })
  //     }
  //   }, 2000, {})
  //   this.initializeDraggableDialog()
  // }
}
</script>

<style lang="less" scoped>
.home {
  overflow: auto;
  height: 100%;
}
.app-container {
  min-width: 1300px;
  height: 100%;
  .el-header {
    padding: 0;
  }
  .el-main {
    height: 100%;
    .main-content {
      height: 100%;
    }
  }
  .el-aside {
    height: 100%;
    overflow: visible;
    box-shadow: 3px 3px 8px 2px var(--shadow-color);
  }
}
.AIWindow {
  /* 调整对话框宽度，使其适应内容 */
  width: 50%;
  /* 可以调整对话框顶部的位置 */
  top: 20vh;
  z-index: 1050 !important;
}

/* 确保只有这个对话框的 wrapper 不会阻挡点击 */
.AIWindow .el-dialog__wrapper {
  pointer-events: auto;  /* 确保点击事件可以传递 */
}
.AIWindow .el-dialog__header {
  /* 对话框头部的样式，如果需要的话 */
  text-align: center;
  padding: 15px 20px;
}

.AIWindow .el-dialog {
  /* 设置对话框的背景颜色为现代的灰色，并略微调整阴影 */
  background: #f5f5f5; /* 调整为您喜欢的颜色 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.AIWindow .el-dialog__body {
  /* 对话框内容的内边距 */
  padding: 20px;
}

.AIWindow .chat-window {
  /* 移除可能影响到布局的最大宽度和阴影 */
  max-width: none;
  box-shadow: none;
  /* 设置聊天窗口的高度，这取决于您的对话框高度 */
  height: 65vh;
  /* 满宽度 */
  width: 100%;
  /* 移除边距 */
  margin: 0;
}

.AIWindow .chat-messages {
  /* 设置消息区域的样式，允许滚动 */
  overflow-y: auto;
  height: 100%; /* 或根据需要设置一个固定高度 */
}

/* 样式调整，以适应聊天窗口内的消息气泡 */
.AIWindow .user-message, .AIWindow .system-message {
  /* 限制气泡宽度，确保消息在对话框中正确显示 */
  max-width: 70%;
  margin-bottom: 10px;
  border-radius: 18px;
  padding: 10px;
}

/* 用户消息的特定样式 */
.AIWindow .user-message {
  /* 靠右浮动，背景色调整 */
  float: right;
  clear: both;
  background-color: #007bff;
  color: white;
  margin-right: 20px; /* 消息与对话框边缘的距离 */
}

/* 系统消息的特定样式 */
.AIWindow .system-message {
  /* 靠左浮动，背景色调整 */
  float: left;
  clear: both;
  background-color: #e1e1e1;
  color: black;
  margin-left: 20px; /* 消息与对话框边缘的距离 */
}

/* 输入框样式调整，以适应对话框 */
.AIWindow .input-box {
  width: calc(100% - 40px); /* 输入框的宽度减去左右边距 */
  margin: 20px; /* 输入框与对话框边缘的距离 */
  padding: 10px 15px;
  border-radius: 22px;
  border: 2px solid #007bff;
  outline: none;
}

/* 对话框底部按钮的样式 */
.AIWindow .dialog-footer {
  text-align: right; /* 按钮靠右对齐 */
  padding: 10px 20px; /* 底部内边距 */
}

/* 确保按钮具有一致的样式 */
.AIWindow .el-button {
  margin-left: 10px; /* 按钮之间的间距 */
}

/* 按钮样式 */
.AIWindow .dialog-footer .el-button {
  border: none; /* 移除边框 */
  box-shadow: none; /* 移除阴影 */
  border-radius: 4px; /* 轻微的圆角 */
  background: #007bff; /* 蓝色背景，可以根据您的品牌颜色调整 */
  color: white; /* 白色文字 */
  margin-left: 8px; /* 按钮之间的间距 */
}

.AIWindow .dialog-footer .el-button:hover {
  background: #0056b3; /* 悬浮时更深的蓝色 */
}

.AIWindow .dialog-footer .el-button:active {
  background: #003a75; /* 按下时的颜色 */
}

/* 第一个按钮使用透明背景，以区分它与其他操作按钮 */
.AIWindow .dialog-footer .el-button:first-child {
  background: transparent;
  color: #007bff;
}

.AIWindow .dialog-footer .el-button:first-child:hover {
  background: rgba(0, 123, 255, 0.1); /* 悬浮时的背景颜色 */
}
.inline-loading {
  display: flex; /* Flexbox to align spinner and text */
  align-items: center; /* Center items vertically */
  justify-content: center; /* Center items horizontally */
  margin-top: 20px; /* Space from the top */
  color: #333; /* Text color */
  font-size: 14px; /* Font size for text */
}

.inline-loading i {
  margin-right: 10px; /* Space between spinner and text */
  font-size: 20px; /* Size of the spinner icon */
}

.inline-loading p {
  margin: 0; /* No margin around text */
}
.usage-examples-container {
  padding: 20px;
}

/* 增加卡片样式 */
.example-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

/* 每个查询内容的字体样式 */
.example-content p {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin: 0;
}
</style>
