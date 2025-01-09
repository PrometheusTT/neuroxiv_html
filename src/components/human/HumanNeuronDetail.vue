<template>
  <div class="neuron-detail-tabs">
    <el-tabs
      v-model="selectedTab"
      type="border-card"
      :stretch="true"
      class="full-height"
      @tab-click="tabClickHandler"
    >
      <el-tab-pane
        label="Neurons viewer"
        name="humanMultiNeuronsViewer"
        :lazy="true"
      >
        <HumanMultiNeuronsViewer
          ref="humanMultiNeuronsViewer"
          @searchROINeurons="$emit('searchROINeurons', $event)"
          @neuronView="$emit('neuronView', $event)"
          @setVisualizedAxon="$emit('setVisualizedAxon')"
          @setVisualizedBasal="$emit('setVisualizedBasal')"
          @setVisualizedApical="$emit('setVisualizedApical')"
          @setVisualizedSoma="$emit('setVisualizedSoma')"
          @changeResolution="$emit('changeResolution')"
        />
      </el-tab-pane>
      <el-tab-pane
        label="Spatial Transcriptomics View"
        name="neuronStates"
      >
        <NeuronStates
          ref="neuronStates"
          :neurons-list="neuronsList"
          :is-initial-state="isInitialState"
        />
      </el-tab-pane>
      <el-tab-pane
        label="EEG/MEG View"
        name="neuronInfo"
        :lazy="true"
      >
        <NeuronInfo
          ref="neuronInfo"
          :neurons-list="neuronsList"
          @checkConnectedNeurons="$emit('checkConnectedNeurons', $event)"
          @searchSimilarNeurons="$emit('searchSimilarNeurons', $event)"
        />
      </el-tab-pane>
      <el-tab-pane
        label="MultiModal View"
        name="multimodalViewer"
      >
        <MultimodalViewer
          ref="multimodalViewer"
          :neurons-list="neuronsList"
          :is-initial-state="isInitialState"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Ref, Prop } from 'vue-property-decorator'
import NeuronStates from '@/components/human/NeuronStates.vue'
import NeuronInfo from '@/components/human/NeuronInfo.vue'
import HumanMultiNeuronsViewer from '@/components/human/HumanMultiNeuronsViewer.vue'
import { ElTabPane } from 'element-ui/types/tab-pane'
import NeuronFeatureMap from '@/components/human/NeuronFeatureMap.vue'
import MultimodalViewer from '@/components/human/MultimodalViewer.vue'

@Component({
  components: { MultimodalViewer, NeuronFeatureMap, NeuronInfo, NeuronStates, HumanMultiNeuronsViewer }
})
export default class HumanNeuronDetail extends Vue {
  @Ref('neuronFeatureMap') readonly neuronFeatureMap!: NeuronFeatureMap
  @Ref('neuronStates') readonly neuronStates!: NeuronStates
  @Ref('multimodalViewer') readonly multimodalViewer!: MultimodalViewer
  @Ref('neuronInfo') readonly neuronInfo!: NeuronInfo
  @Ref('humanMultiNeuronsViewer') readonly humanMultiNeuronsViewer!: HumanMultiNeuronsViewer
  @Prop({ required: true }) loadFirstNeuron!: any
  @Prop({ required: true }) readonly neuronsList!: any[]
  @Prop({ required: true }) readonly isInitialState!: boolean;

  // 此处如果初始值不为neuronInfo,neuronInfo的scene不会被渲染
  public selectedTab: string = 'humanMultiNeuronsViewer'

  /**
   * 点击切换 tab (通过改变变量的方式不会触发)
   * @param tab 当前选中的 tab
   * @private
   */
  private async tabClickHandler (tab: ElTabPane) {
    // 切换到 neuronInfo tab 的时候,如果没有神经元则加载神经元列表第一个神经元
    // 切换到 multiNeuronsViewer tab的时候，则将神经元列表勾选的神经元进行展示
    if (tab.name === 'neuronInfo') {
      await this.$nextTick()
      if (!this.neuronInfo.neuronInfoData.id) {
        this.loadFirstNeuron()
      }
    } else if (tab.name === 'multiNeuronsViewer') {
      this.$emit('viewNeurons')
    }
    // else if (tab.name === 'neuronStates') {
    //   this.$emit('checkConnectedNeurons')
    // }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.neuron-detail-tabs {
  height: 100%;
  .el-tabs {
    height: 100%;
  }
}
</style>
