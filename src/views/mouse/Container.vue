<template>
  <div class="home">
    <SmallScreenAlert />
    <el-container class="app-container">
      <el-header height="auto">
        <header-bar
          ref="headBar"
          @clickSearchButton="searchDialogVisible = true"
          @clickSearchByIDButton="searchByIDHandler"
          @clickSearchByLLMButton="LLMDialogVisible = true"
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
              @checkConnectedNeurons="updateNeuronAnalysis($event, true)"
              @searchSimilarNeurons="searchSimilarNeurons($event)"
              @searchROINeurons="searchROINeurons($event)"
              @neuronView="updateCurrentNeuronInfo"
              @viewNeurons="viewNeurons"
              @showNeuronMap="showNeuronMap"
            />
          </div>
        </el-main>
        <el-aside width="auto">
          <NeuronLists
            ref="neuronLists"
            @neuronView="updateCurrentNeuronInfo"
            @neuronAnalysis="updateNeuronAnalysis"
            @checkNeuron="checkNeuron"
            @viewNeurons="viewNeurons"
            @switchLocalAndFull="switchLocalAndFull($event)"
          />
        </el-aside>
      </el-container>
    </el-container>
    <!-- 神经元搜索对话框 -->
    <el-dialog
      title="Neuron Search"
      class="AIWindow"
      :visible.sync="searchDialogVisible"
      width="90%"
      top="10vh"
      :close-on-click-modal="false"
    >
      <NeuronSearch ref="neuronSearch" />
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
      title="Neuron GPT"
      custom-class="AIWindow"
      :visible.sync="LLMDialogVisible"
      width="50%"
      top="20vh"
      :close-on-click-modal="false"
    >
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
  </div>
</template>

<script lang="ts">
import { Component, Vue, Ref } from 'vue-property-decorator'
import HeaderBar from '@/components/mouse/HeaderBar.vue'
import NeuronList from '@/components/mouse/NeuronList.vue'
import NeuronDetail from '@/components/mouse/NeuronDetail.vue'
import NeuronSearch from '@/components/mouse/NeuronSearch.vue'
import { getNeuronInfo, searchNeurons, searchSimilarNeuron, uploadNeuron, searchROINeuron, AISearch, getSearchIntent } from '@/request/apis/mouse/Neuron'
import SmallScreenAlert from '@/components/common/SmallScreenAlert.vue'
import NeuronLLM from '@/components/mouse/NeuronLLM.vue'
import AISearchWindow from '@/components/mouse/AISearchWindow.vue'
import { result } from 'lodash'
import NeuronLists from '@/components/mouse/NeuronLists.vue'

@Component({
  components: {
    NeuronLists,
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
  // @Ref('neuronList') readonly neuronList!: NeuronList
  @Ref('neuronLists') readonly neuronLists!: NeuronLists
  @Ref('neuronLLM') readonly neuronLLM!: NeuronLLM
  @Ref('headBar') readonly headBar!: HeaderBar
  @Ref('aiSearchWindow') readonly aiSearchWindow!: AISearchWindow
  private searchDialogVisible: boolean = false
  private LLMDialogVisible: boolean = false
  private reFresh: boolean = true
  private fullMorphNeurons:any[] = []
  private localMorphNeurons:any[] = []
  private arborColor:any[] = [
    [6, 194, 172],
    [70, 85, 140],
    [159, 205, 99],
    [253, 242, 208]
  ]

  /**
   * 更新当前显示的 neuron info 信息
   * @param neuronDetail neuron detail
   * @private
   */
  private async updateCurrentNeuronInfo (neuronDetail: any) {
    this.neuronDetail.selectedTab = 'neuronInfo'
    await this.$nextTick()
    this.neuronDetail.neuronInfo.clearReconstruction()
    await this.$nextTick()
    const needClear = !!this.neuronDetail.neuronInfo.neuronInfoData.id
    console.log('needClear')
    console.log(needClear)
    const neuronInfo = await getNeuronInfo(document.body, neuronDetail.id, this.$store.state.atlas).start()
    // console.log(neuronInfo)
    this.neuronDetail.neuronInfo.neuronInfoData = neuronInfo
    this.neuronDetail.neuronInfo.neuronViewerReconstructionData = neuronInfo.viewer_info
    // console.log(this.neuronDetail.neuronInfo.neuronViewerReconstructionData)
    await this.neuronDetail.neuronInfo.updateReconstruction(needClear)
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
    const AIAdvice = await AISearch(document.body, neuronDetail.question).start()
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
      // eslint-disable-next-line camelcase
      const { basic_info, morpho_info, plot, proj_info, neurons } = await searchNeurons(document.body, { id_list: neuronIds }).start()
      console.log(document.body)
      this.neuronDetail.selectedTab = 'neuronStates'
      this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
      await this.$nextTick()
      this.neuronDetail.neuronStates.featurePlot.renderChart()
      this.neuronDetail.neuronStates.histogramBars.renderChart()
      if (updateNeuronList) {
        // console.log(neurons)
        this.neuronLists.neuronList.setListData(neurons)
      }
    } catch (e) {
      console.error(e)
    }
  }

  /**
   * 搜索神经元
   * @param criteria 搜索条件
   * @param ids 神经元 ID 列表
   * @param func 回调函数
   * @private
   */
  private async searchNeurons (criteria: any = undefined, ids: string[] | undefined = undefined, func: any = () => {}) {
    if (!criteria) {
      criteria = this.neuronSearch.getSearchCriteria()
    }
    criteria['brain_atlas'] = [this.$store.state.atlas]
    const condition = ids ? { id_list: ids } : { criteria: criteria }
    // console.log(condition)
    try {
      // eslint-disable-next-line camelcase
      const { neurons, basic_info, morpho_info, plot, proj_info } = await searchNeurons(document.body, condition).start()
      // 初始化两个空数组用于存放数据
      // 遍历neurons数组，根据名字分配到对应数组
      this.fullMorphNeurons = []
      this.localMorphNeurons = []
      neurons.forEach((neuron: { id: string | string[] }) => {
        if (neuron.id.includes('full')) {
          this.fullMorphNeurons.push(neuron)
        } else if (neuron.id.includes('local')) {
          this.localMorphNeurons.push(neuron)
        }
      })
      // this.neuronList.setListData(neurons)
      // if (this.neuronLists.selectedTab === 'fullMorph') {
      //   this.neuronLists.neuronList.setListData(this.fullMorphNeurons)
      // } else {
      //   this.neuronLists.neuronListLocal.setListData(this.localMorphNeurons)
      // }
      this.neuronLists.neuronList.setListData(this.fullMorphNeurons)
      this.neuronLists.neuronListLocal.setListData(this.localMorphNeurons)
      this.neuronDetail.selectedTab = 'neuronStates'
      this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
      await this.$nextTick()
      this.neuronDetail.neuronStates.featurePlot.renderChart()
      this.neuronDetail.neuronStates.histogramBars.renderChart()
      this.searchDialogVisible = false
      func()
    } catch (e) {
      console.error(e)
    }
  }

  private async AISearch (func: any = () => {}) {
    this.aiSearchWindow.sendMessage()
    const question = this.aiSearchWindow.lastInput
    console.log('question is: ' + question)
    let searchIntent = 'unknown intent'
    let searchConditions = {}
    try {
      // eslint-disable-next-line camelcase
      const response = await getSearchIntent(document.body, question).start()
      // let res = JSON.parse(response)
      console.log(response.response)
      searchIntent = response.response.toString()
      func()
      if (searchIntent === 'search') {
        let result = this.aiSearchWindow.GetIntent(question, searchIntent)
        console.log(result)
        const condition = { criteria: result.criteria }
        searchConditions = condition
        console.log(condition)
        try {
          // eslint-disable-next-line camelcase
          const { neurons, basic_info, morpho_info, plot, proj_info } = await searchNeurons(document.body, searchConditions).start()
          console.log(neurons)
          this.neuronLists.neuronList.setListData(neurons)
          this.neuronDetail.selectedTab = 'neuronStates'
          this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
          await this.$nextTick()
          this.neuronDetail.neuronStates.featurePlot.renderChart()
          this.neuronDetail.neuronStates.histogramBars.renderChart()
          this.LLMDialogVisible = false
          this.aiSearchWindow.addResponseFromAPI('Are these the results you are looking for? If not please send me more information')
          func()
        } catch (e) {
          console.error(e)
        }
      } else {
        try {
          // eslint-disable-next-line camelcase
          const response = await AISearch(document.body, question).start()
          // let res = JSON.parse(response)
          console.log(response)
          this.aiSearchWindow.addResponseFromAPI(response.response.response)
          this.aiSearchWindow.addResponseFromAPI('Did you get the results you wanted? If not please enrich your question!')

          func()
        } catch (e) {
          console.error(e)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }
  private async ClearMessage (func: any = () => {}) {
    this.aiSearchWindow.messages = []
  }

  /**
   * 上传神经元并计算神经元特征
   * @param param 通过该参数获得要上传的文件
   */
  private async uploadNeuronHandler (param: any) {
    try {
      this.neuronDetail.selectedTab = 'neuronInfo'
      await this.$nextTick()
      const needClear = !!this.neuronDetail.neuronInfo.neuronInfoData.id
      const form = new FormData()
      form.append('file', param.file)
      const neuronInfo = await uploadNeuron(document.body, form).start()
      this.neuronDetail.neuronInfo.clearReconstruction()
      await this.$nextTick()
      this.neuronDetail.neuronInfo.neuronInfoData = neuronInfo
      this.neuronDetail.neuronInfo.neuronViewerReconstructionData = neuronInfo.viewer_info
      console.log(this.neuronDetail.neuronInfo.neuronViewerReconstructionData)
      await this.neuronDetail.neuronInfo.updateReconstruction(needClear)
    } catch (e) {
      console.error(e)
    }
  }

  /**
   * 清空搜索条件
   * @constructor
   * @private
   */
  private Reset () {
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
      this.fullMorphNeurons = []
      this.localMorphNeurons = []
      neurons.forEach((neuron: { id: string | string[] }) => {
        if (neuron.id.includes('full')) {
          this.fullMorphNeurons.push(neuron)
        } else if (neuron.id.includes('local')) {
          this.localMorphNeurons.push(neuron)
        }
      })
      // this.neuronList.setListData(neurons)
      if (this.neuronLists.selectedTab === 'fullMorph') {
        this.neuronLists.neuronList.setListData(this.fullMorphNeurons)
      } else {
        this.neuronLists.neuronListLocal.setListData(this.localMorphNeurons)
      }
      // this.neuronLists.neuronList.setListData(neurons)
      this.neuronDetail.selectedTab = 'neuronStates'
      this.neuronDetail.neuronStates.neuronStatesData = { basic_info: basic_info.counts, morpho_info, plot, proj_info }
      await this.$nextTick()
      this.neuronDetail.neuronStates.featurePlot.renderChart()
      this.neuronDetail.neuronStates.histogramBars.renderChart()
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * 选中或取消右方神经元列表中的神经元的神经元的回调函数，用于在3D viewer里展示
   * @param neuronDetail 神经元的具体信息，包括是否有dendrite、axon，id以及是否选中
   * @param switchTab 是否要主动切换到3D viewer栏
   */
  public async checkNeuron (neuronDetail: any, switchTab: boolean = false) {
    if (switchTab && this.neuronDetail.selectedTab !== 'multiNeuronsViewer') {
      this.neuronDetail.selectedTab = 'multiNeuronsViewer'
      await this.$nextTick()
    }
    await this.$nextTick()
    if (this.neuronDetail.selectedTab === 'multiNeuronsViewer') {
      if (this.neuronLists.selectedTab === 'fullMorph') {
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

        let arborData = {
          id: neuronDetail.id + '_arbor',
          name: neuronDetail.id + '_arbor',
          src: '',
          // eslint-disable-next-line camelcase
          rgb_triplet: [6, 194, 172],
          info: {
            id: neuronDetail.id,
            cellType: neuronDetail.celltype
          },
          count: 0
        }

        if (this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(dendriteData) ||
          this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(axonData) || this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(apicalData) ||
          !neuronDetail.selected) {
          if (neuronDetail['has_dendrite']) {
            this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(dendriteData, neuronDetail.selected)
          }
          if (neuronDetail['has_axon']) {
            this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(axonData, neuronDetail.selected)
          }
          if (neuronDetail['has_apical']) {
            this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(apicalData, neuronDetail.selected)
          }
          if (neuronDetail['has_arbor']) {
            let arborCount = arborData.count || 4 // 如果没有提供arborCount，默认为4
            for (let i = 0; i < arborCount; i++) {
              // 创建一个新的arborData对象，以避免修改原始对象
              let newArborData = {
                ...arborData, // 使用对象展开运算符克隆arborData
                id: `${arborData.id.split('arbor')[0]}${i}`,
                name: `${arborData.name.split('arbor')[0]}${i}`,
                src: `${arborData.src.split('.obj')[0]}${i}.obj`,
                rgb_triplet: this.arborColor[i]
              }
              this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(arborData, neuronDetail.selected)
            }
          }
        } else {
          const neuronInfo = await getNeuronInfo(document.body, neuronDetail.id, this.$store.state.atlas).start()
          dendriteData.src = neuronInfo.viewer_info[0].children[0].src
          axonData.src = neuronInfo.viewer_info[0].children[1].src
          apicalData.src = neuronInfo.viewer_info[0].children[2].src
          arborData.src = neuronInfo.viewer_info[0].children[5].src
          if (neuronDetail['has_dendrite']) {
            await this.neuronDetail.multiNeuronsViewer.neuronScene.loadObj(dendriteData)
          }
          if (neuronDetail['has_axon']) {
            await this.neuronDetail.multiNeuronsViewer.neuronScene.loadObj(axonData)
          }
          if (neuronDetail['has_apical']) {
            await this.neuronDetail.multiNeuronsViewer.neuronScene.loadObj(apicalData)
          }
          if (neuronDetail['has_arbor']) {
            let arborCount = arborData.count || 4 // 如果没有提供arborCount，默认为4
            for (let i = 0; i < arborCount; i++) {
              // 创建一个新的arborData对象，以避免修改原始对象
              let newArborData = {
                ...arborData, // 使用对象展开运算符克隆arborData
                id: `${arborData.id.split('arbor')[0]}${i}`,
                name: `${arborData.name.split('arbor')[0]}${i}`,
                src: `${arborData.src.split('.obj')[0]}${i}.obj`,
                rgb_triplet: this.arborColor[i]
              }
              await this.neuronDetail.multiNeuronsViewer.neuronScene.loadObj(newArborData)
            }
          }
        }
      } else {
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
        if (this.neuronDetail.multiNeuronsViewer.neuronScene.checkLoadComponent(localData) ||
          !neuronDetail.selected) {
          if (neuronDetail['has_local']) {
            this.neuronDetail.multiNeuronsViewer.neuronScene.setComponentVisible(localData, neuronDetail.selected)
          }
        } else {
          const neuronInfo = await getNeuronInfo(document.body, neuronDetail.id, this.$store.state.atlas).start()
          localData.src = neuronInfo.viewer_info[0].children[3].src
          if (neuronDetail['has_local']) {
            await this.neuronDetail.multiNeuronsViewer.neuronScene.loadObj(localData)
          }
        }
      }
    }
  }

  /**
   * 将神经元列表中勾选的的神经元进行展示
   */
  public async viewNeurons () {
    let neuronsDetail = this.neuronLists.neuronList.getSelectedItems()
    this.neuronDetail.multiNeuronsViewer.neuronScene.setAllNeuronsVisible(false)
    neuronsDetail.forEach((neuronDetail: any) => {
      this.checkNeuron(neuronDetail, true)
    })
  }

  /**
   * 加载神经元列表第一个神经元
   */
  public async loadFirstNeuron () {
    await this.updateCurrentNeuronInfo(this.neuronLists.neuronList.getFirstItem())
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
    this.headBar.setAtlas(atlas)
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

  public async switchLocalAndFull (recDegree: string) {
    // location.reload()
    this.neuronLists.setRecDegree(recDegree)
    this.reFresh = true
    // this.reFresh = true
    // this.$nextTick(() => {
    //   this.reFresh = true
    //   let criteria = {
    //     brain_atlas: [this.$store.state.atlas]
    //   }
    //   this.searchNeurons(criteria, undefined, () => {
    //     this.neuronDetail.selectedTab = 'multiNeuronsViewer'
    //   })
    // })
  }

  mounted () {
    setTimeout(() => {
      console.log('----------route----------', this.$route.query)
      if (this.$route.query.hasOwnProperty('brainRegion') && this.$route.query.hasOwnProperty('atlasName')) {
        // @ts-ignore
        // this.switchAtlas(this.$route.query['atlasName'])
        this.headBar.setAtlas(this.$route.query['atlasName'])
        // @ts-ignore
        this.$store.commit('updateAtlas', this.$route.query['atlasName'])
        this.$nextTick(() => {
          let criteria = {
            brain_atlas: [this.$store.state.atlas],
            celltype: [this.$route.query['brainRegion']]
          }
          this.searchNeurons(criteria)
        })
      } else {
        // console.log('mounted atlas', this.$store.state.atlas)
        let criteria = {
          brain_atlas: [this.$store.state.atlas]
        }
        this.searchNeurons(criteria, undefined, () => {
          this.neuronDetail.selectedTab = 'multiNeuronsViewer'
        })
      }
    }, 2000, {})
  }
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
.AIWindow{

}
</style>
