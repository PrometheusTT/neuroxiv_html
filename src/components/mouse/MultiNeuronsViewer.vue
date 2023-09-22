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
                <el-tree
                  ref="brainTree"
                  :data="neuronViewerData"
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
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import NeuronScene from '@/components/mouse/NeuronScene.vue'
import SliceSection from '@/components/mouse/SliceSection.vue'
import ROI from '@/components/mouse/ROI.vue'
import { showLoading, increaseLoadingCount, decreaseLoadingCount, LoadingZero } from '@/request/RequestWrapper'

import neuronViewerBaseData from './surf_tree.json'

import neuronViewerBaseDataFMost from './surf_tree_fmost.json'
const rootId = neuronViewerBaseData[0].id
const rootIdFMost = neuronViewerBaseDataFMost[0].id

@Component<NeuronInfo>({
  mounted () {
    this.loadRootComponent()
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
  public neuronViewerData: any = this.$store.state.atlas === 'CCFv3' ? neuronViewerBaseData : neuronViewerBaseDataFMost // neuronViewerBaseData
  private rootId: number = this.$store.state.atlas === 'CCFv3' ? rootId : rootIdFMost // rootId
  private activeNames: any = ['brain']
  private sagittalMax: number = 11375 // 18.20
  private AxialMax: number = 7975 // 12.76
  private coronalMax: number = 13175 // 21.08
  private step: number = 25
  public selectedTab: string = 'viewer property'

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
        this.neuronScene.loadSlice(sliceName)
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
    this.neuronScene.updateSlice(sliceName, Math.round(value / 25))
  }

  /**
   * 加载脑区的root组件
   * @private
   */
  private loadRootComponent () {
    // @ts-ignore
    let rootNode = this.$refs.brainTree.getNode(this.rootId)
    rootNode.expanded = true
    // @ts-ignore
    this.$refs.brainTree.setChecked(this.rootId, true)
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
}
</style>
