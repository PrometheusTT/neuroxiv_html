<template>
  <div class="neuron-states-container">
    <NeuronStatesDesc
      :basic-info="neuronStatesData.basic_info"
      :morpho-info="neuronStatesData.morpho_info"
      :proj-info="neuronStatesData.proj_info"
    />
    <div class="separator" />
    <section
      ref="featurePlots"
      class="feature-plots"
    >
      <div class="feature-plot-container">
        <NeuronFeaturePlots
          ref="featurePlot"
          :plot-data="neuronStatesData.plot.proj_plot"
          class="feature-plot abs-full"
        />
      </div>
      <hr class="plot-separator">
      <NeuronFeatureHistogramBars
        ref="histogramBars"
        :histogram-data="neuronStatesData.plot.hist_plot"
      />
    </section>
    <el-button
      icon="el-icon-download"
      class="download-btn"
      size="mini"
      :loading="downloading"
      @click="downloadData"
    >
      Download
    </el-button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Ref } from 'vue-property-decorator'
import NeuronStatesDesc from '@/components/mouse/NeuronStatesDesc.vue'
import NeuronFeaturePlots from '@/components/mouse/NeuronFeatureScatter.vue'
import NeuronFeatureHistogramBars from '@/components/mouse/NeuronFeatureHistogramBars.vue'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import { downloadLink, getBlobFromCanvas, sleep } from '@/utils/util'
// @ts-ignore
// import { data as plotData } from '@/assets/plot'

@Component({
  components: { NeuronFeatureHistogramBars, NeuronFeaturePlots, NeuronStatesDesc }
})
export default class NeuronStates extends Vue {
  @Ref('histogramBars') readonly histogramBars!: NeuronFeatureHistogramBars
  @Ref('featurePlots') readonly featurePlots!: HTMLElement
  @Ref('featurePlot') readonly featurePlot!: NeuronFeaturePlots

  public neuronStatesData: any = {
    basic_info: [],
    morpho_info: [],
    proj_info: [],
    plot: {
      proj_plot: [],
      hist_plot: []
    }
  }

  private downloading: boolean = false

  /**
   * 下载 neuron info json, 散点图, 柱状图
   * @private
   */
  private async downloadData () {
    this.downloading = true
    await sleep(100) // 先让 loading 动起来
    const zip = new JSZip()
    const folder = zip.folder('neuron_stats')
    try {
      // 左侧的信息 json
      // @ts-ignore
      folder.file('neuronStatesData.json', JSON.stringify({
        basic_info: this.neuronStatesData.basic_info,
        morpho_info: this.neuronStatesData.morpho_info,
        proj_info: this.neuronStatesData.proj_info
      }))
      // arbor distribution scatter
      const canvas = await html2canvas(this.featurePlot.$el as HTMLElement)
      // @ts-ignore
      folder.file('arbor_distribution.png', await getBlobFromCanvas(canvas))
      // 柱状图
      for (let i = 0; i < this.neuronStatesData.plot.hist_plot.length; i++) {
        let plotItem = this.neuronStatesData.plot.hist_plot[i]
        let plotItemCanvas = this.histogramBars.histogramItem[i].querySelector('canvas')
        // @ts-ignore
        folder.file(`${plotItem.metric}.png`, await getBlobFromCanvas(plotItemCanvas))
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      await downloadLink(url, 'neuron_stats.zip')
      URL.revokeObjectURL(url)
    } catch (e) {
      console.warn(e)
    }
    this.downloading = false
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.neuron-states-container {
  color: black;
  display: flex;
  flex-flow: row nowrap;
  border-radius: 5px;
  height: 100%;
  position: relative;
  .feature-desc, .feature-plots {
    height: 100%;
    overflow: auto;
    padding: 10px;
  }
  .feature-desc {
    width: 360px;
    flex: 0 0 auto;
  }
  .separator {
    width: 1px;
    height: 100%;
    background-color: grey;
  }
  .feature-plots {
    flex: 1 1 auto;
    overflow: auto;
    > * {
      min-width: 950px;
    }
    .feature-plot-container {
      position: relative;
      &:before {
        content: '';
        display: block;
        padding-top: 62%;
      }
      .feature-plot {
        width: 100%;
        height: 100%;
      }
    }
  }
  .plot-separator {
    border: 1px dashed grey;
    margin: 2em 0;
  }
  .download-btn {
    position: absolute;
    top: 0;
    right: 0;
  }
}
</style>
