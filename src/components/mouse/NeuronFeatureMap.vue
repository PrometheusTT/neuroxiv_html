<template>
  <div class="multi-neurons-viewer-container">
    <div class="right-side">
      <NeuronScene
        ref="neuronScene"
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

import neuronViewerBaseData from './surf_tree.json'

import neuronViewerBaseDataFMost from './surf_tree_fmost.json'
const rootId = neuronViewerBaseData[0].id
const rootIdFMost = neuronViewerBaseDataFMost[0].id

@Component<NeuronInfo>({
  mounted () {
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
