<template>
  <div class="multi-neurons-viewer-container">
    <div class="left-side">
      <el-tabs
        v-model="selectedTab"
        :stretch="true"
        class="full-height"
      >
        <el-tab-pane
          label="viewer property"
          name="viewer property"
        >
          <div>
            <el-collapse v-model="activeNames">
              <el-collapse-item
                title="brain"
                name="brain"
              >
                <el-input
                  v-model="searchKeyword"
                  placeholder="Search"
                  style="margin-bottom: 10px;"
                  @input="filterTree"
                />
                <el-tree
                  ref="brainTree"
                  :data="filteredData"
                  :render-after-expand="false"
                  show-checkbox
                  node-key="id"
                  :props="{ label: 'acronym' }"
                  :check-strictly="true"
                  @check-change="checkBrainTreeCallback"
                >
                  <template
                    slot-scope="{ node, data }"
                  >
                    <el-tooltip
                      effect="dark"
                      :content="data.name"
                      placement="right"
                    >
                      <span>{{ node.label }}</span>
                    </el-tooltip>
                  </template>
                </el-tree>
              </el-collapse-item>
              <el-collapse-item
                title="slice"
                name="slice"
              >
                <SliceSection
                  slice-name="Sagittal"
                  :max-value="sagittalMax"
                  :value-step="step"
                  :_switch-change="switchChange"
                  :_slider-change="sliderChange"
                />
                <SliceSection
                  slice-name="Axial"
                  :max-value="AxialMax"
                  :value-step="step"
                  :_switch-change="switchChange"
                  :_slider-change="sliderChange"
                />
                <SliceSection
                  slice-name="Coronal"
                  :max-value="coronalMax"
                  :value-step="step"
                  :_switch-change="switchChange"
                  :_slider-change="sliderChange"
                />
              </el-collapse-item>
              <el-collapse-item
                title="roi"
                name="roi"
              >
                <ROI
                  ref="ROI"
                  :_show-r-o-i="showROI"
                  :_hide-r-o-i="hideROI"
                  :_update-r-o-i-ball="updateROIBall"
                  @searchROINeurons="$emit('searchROINeurons', $event)"
                />
              </el-collapse-item>
              <el-collapse-item
                title="visualized structures"
                name="visualized structures"
              >
                <el-checkbox
                  v-model="showAllSoma"
                  label="soma"
                  name="soma"
                  @change="setSoma"
                />
                <el-checkbox
                  v-model="showAllAxon"
                  label="axon"
                  name="axon"
                  @change="setAxon"
                />
                <el-checkbox
                  v-model="showAllBasal"
                  label="basal dendrite"
                  name="basal dendrite"
                  @change="setBasal"
                />
                <el-checkbox
                  v-model="showAllApical"
                  label="apical dendrite"
                  name="apical dendrite"
                  @change="setApical"
                />
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <div class="separator" />
    <div class="right-side">
      <NeuronScene
        ref="neuronScene"
        @dblclick.native="handleDBClick"
        @neuronView="$emit('neuronView', $event)"
      />
    </div>
    <div class="right-top">
      <el-button
        @click="Rotate"
      >
        Animation
      </el-button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import NeuronScene from '@/components/mouse/NeuronScene.vue'
import SliceSection from '@/components/mouse/SliceSection.vue'
import ROI from '@/components/mouse/ROI.vue'
import { showLoading, increaseLoadingCount, decreaseLoadingCount, LoadingZero } from '@/request/RequestWrapper'

import neuronViewerBaseData from './surf_tree_ccf-me.json'

import neuronViewerBaseDataFMost from './surf_tree_fmost.json'
const rootId = neuronViewerBaseData[0].id
const rootIdFMost = neuronViewerBaseDataFMost[0].id
const SliceAtlas = 'CCFv3'
const SliceAtlasfMOST = 'fMOST'

@Component<NeuronInfo>({
  mounted () {
    this.loadRootComponent()
    this.neuronScene.multiViewerSoma = new Map()
    this.neuronScene.multiViewerSomaPos = new Map()
  },
  components: {
    NeuronScene,
    SliceSection,
    ROI
  }
})
export default class NeuronInfo extends Vue {
  @Ref('neuronScene') neuronScene!: NeuronScene
  @Ref('ROI') ROI!: ROI
  @Ref('brainTree') brainTree!: any
  public neuronViewerData: any = this.$store.state.atlas === 'CCFv3' ? neuronViewerBaseData : neuronViewerBaseDataFMost // neuronViewerBaseData
  private rootId: number = this.$store.state.atlas === 'CCFv3' ? rootId : rootIdFMost // rootId
  private sliceAtlas: any = this.$store.state.atlas
  private activeNames: any = ['brain']
  private sagittalMax: number = 11375 // 18.20
  private AxialMax: number = 7975 // 12.76
  private coronalMax: number = 13175 // 21.08
  private step: number = 25
  public selectedTab: string = 'viewer property'
  public showAllSoma:boolean = false
  public showAllAxon:boolean = true
  public showAllBasal:boolean = true
  public showAllApical:boolean = true
  public searchKeyword: string = ''
  public filteredData: any = this.neuronViewerData

  private Rotate () {
    this.neuronScene.toggleRotation()
  }

  private setAxon () {
    this.$emit('setVisualizedAxon')
  }
  private setBasal () {
    console.log('showAllBasal')
    this.$emit('setVisualizedBasal')
  }
  private setApical () {
    console.log('showAllApical')
    this.$emit('setVisualizedApical')
  }
  private setSoma () {
    console.log('showAllSoma')
    this.$emit('setVisualizedSoma')
  }
  /**
   * 脑区el-tree节点状态改变的回调函数
   * @param data 节点数据
   * @param checked 节点是否被选中
   * @private
   */
  private async checkBrainTreeCallback (data: any, checked: boolean) {
    if (data.hasOwnProperty('src')) {
      if (checked) {
        if (this.neuronScene.checkLoadComponent(data)) {
          this.neuronScene.setComponentVisible(data, true)
        } else {
          // @ts-ignore
          let node = this.$refs.brainTree.getNode(data.id)
          node.loading = true
          let loadingInstance = showLoading(document.body)
          increaseLoadingCount()
          await this.neuronScene.loadComponent(data)
          node.loading = false
          decreaseLoadingCount()
          if (LoadingZero()) {
            loadingInstance.close()
          }
        }
      } else {
        this.neuronScene.setComponentVisible(data, false)
      }
    }
  }

  /**
   * 改变switch的回调函数，用于决定slice是否显示
   * @param isSwitch 是否显示slice
   * @param sliceName SLice的方向名称
   */
  public switchChange (isSwitch: boolean, sliceName: string) {
    if (isSwitch) {
      if (this.neuronScene.checkLoadSlice(sliceName)) {
        this.neuronScene.setSliceVisible(sliceName, true)
      } else {
        this.neuronScene.loadSlice(sliceName, this.sliceAtlas)
      }
    } else {
      this.neuronScene.setSliceVisible(sliceName, false)
    }
  }

  /**
   * 改变滑动条的回调函数，用于切换slice的位置
   * @param value slice的位置
   * @param sliceName SLice的方向名称
   */
  public sliderChange (value: number, sliceName: string) {
    this.neuronScene.updateSlice(sliceName, Math.round(value / 25), this.sliceAtlas)
  }

  /**
   * 加载脑区的root组件
   * @private
   */
  private loadRootComponent () {
    this.$nextTick(() => {
      // @ts-ignore
      let rootNode = this.$refs.brainTree.getNode(this.rootId)
      rootNode.expanded = true
      // @ts-ignore
      this.$refs.brainTree.setChecked(this.rootId, true)
    })
  }

  /**
   * 鼠标双击的回调函数，用于highlight渲染的组件，并显示出该组件的名字
   * @event 鼠标事件
   */
  private handleDBClick (event: any) {
    event.preventDefault()
    let p = this.neuronScene.handleMouseDoubleClickNeuron(event)
    this.ROI.setROI(Math.round(p[0]), Math.round(p[1]), Math.round(p[2]))
  }

  /**
   * 显示代表ROI的小球
   * @param r ROI的半径
   * @private
   */
  private showROI (r: number) {
    const roiInitialPosition = this.neuronScene.showROIBall(r)
    if (roiInitialPosition) {
      this.ROI.setROI(Math.round(roiInitialPosition[0]), Math.round(roiInitialPosition[1]), Math.round(roiInitialPosition[2]))
    }
  }

  /**
   * 隐藏代表ROI的小球
   * @private
   */
  private hideROI () {
    this.neuronScene.setROIBallVisible(false)
  }

  /**
   * 更新代表ROI的小球
   * @param x ROI在标准脑坐标系下的x坐标
   * @param y ROI在标准脑坐标系下的y坐标
   * @param z ROI在标准脑坐标系下的z坐标
   * @param r ROI的半径
   * @private
   */
  private updateROIBall (x: number, y: number, z: number, r: number) {
    this.neuronScene.updateROIBall(x, y, z, r)
  }

  private filterTree () {
    const checkedNodes = this.brainTree.getCheckedNodes() // 获取当前选中节点
    if (this.searchKeyword.trim() === '') {
      this.filteredData = this.neuronViewerData
      this.restoreCheckedNodes(checkedNodes) // 恢复选中节点状态
    } else {
      const keyword = this.searchKeyword.toLowerCase()
      const filtered: { acronym: string; name: string; children: any[] }[] = []
      this.neuronViewerData.forEach((node: { acronym: string; name: string; children: any[] }) => {
        const result = this.filterNode(node, keyword)
        if (result) {
          filtered.push(result)
        }
      })
      this.filteredData = filtered
      this.expandToMatch(this.filteredData, keyword)
      this.restoreCheckedNodes(checkedNodes) // 恢复选中节点状态
    }
  }

  private restoreCheckedNodes (checkedNodes: any[]) {
    checkedNodes.forEach(node => {
      this.brainTree.setChecked(node.id, true, true) // 恢复选中状态
    })
  }

  private filterNode (node: { acronym: string; name: string; children: any[] }, keyword: string) {
    if (node.acronym.toLowerCase() === keyword || node.name.toLowerCase() === keyword) {
      return node
    }
    if (node.children) {
      const filteredChildren: any[] = []
      node.children.forEach((child: any) => {
        const result = this.filterNode(child, keyword)
        if (result) {
          filteredChildren.push(result)
        }
      })
      if (filteredChildren.length > 0) {
        return { ...node, children: filteredChildren }
      }
    }
    return null
  }

  private expandToMatch (nodes: any[], keyword: string) {
    nodes.forEach(node => {
      if (node.acronym.toLowerCase() === keyword || node.name.toLowerCase() === keyword) {
        this.$nextTick(() => {
          this.brainTree.setCurrentKey(node.id) // 设置当前节点
          this.expandParentNodes(node.id) // 展开父节点
        })
      }
      if (node.children) {
        this.expandToMatch(node.children, keyword)
      }
    })
  }

  private expandParentNodes (nodeId: any) {
    let currentNode = this.brainTree.getNode(nodeId)
    while (currentNode && currentNode.parent) {
      const parentNode = this.brainTree.getNode(currentNode.parent.data.id)
      if (parentNode) {
        parentNode.expanded = true
      }
      currentNode = currentNode.parent
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.multi-neurons-viewer-container {
  height: 100%;
  color: black;
  display: flex;
  flex-flow: row nowrap;
  border-radius: 5px;
  position: relative;
  .left-side, .right-side {
    height: 100%;
    overflow: auto;
    padding: 10px;
  }
  .separator {
    width: 1px;
    height: 100%;
    background-color: lightgrey;
  }
  .left-side {
    width: 360px;
    .el-tabs {
      height: 100%;
      .el-tab-pane {
        overflow: auto;
      }
    }
  }
  .right-side {
    flex: 1;
  }
  .right-top {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1;
  }
}
</style>
