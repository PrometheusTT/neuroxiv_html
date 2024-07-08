<template>
  <section class="feature-desc">
    <el-collapse v-model="activeSection">
      <el-collapse-item
        title="AIPOM data report"
        name="dataSummary"
      >
        <div class="summary-container">
          <p><strong>Basic Information:</strong></p>
          <ul>
            <li>{{ basicInfoSummary }}</li>
          </ul>
          <p><strong>Morphology Features:</strong></p>
          <ul>
            <li>
              {{ morphologySummaries }}
              <!--              v-for="(summary, index) in morphologySummaries"-->
              <!--              :key="index"-->
            </li>
          </ul>
          <p><strong>Projection Info:</strong></p>
          <ul>
            <li>{{ projectionInfoSummary }}</li>
          </ul>
        </div>
      </el-collapse-item>
      <el-collapse-item
        title="basic information"
        name="basicInfo"
      >
        <el-table
          :data="basicInfo"
          stripe
          style="width: 100%"
        >
          <el-table-column
            prop="name"
            label=""
          />
          <el-table-column
            prop="num"
            label="number of neurons"
          />
        </el-table>
      </el-collapse-item>
      <el-collapse-item
        title="morphology features"
        name="morphologyFeatures"
      >
        <MorphologyFeaturesTable :morpho-info="morphoInfo" />
      </el-collapse-item>
      <el-collapse-item
        title="anatomy/projection info"
        name="projectionInfo"
      >
        <ProjectionInfoTable :proj-info="projInfo" />
      </el-collapse-item>
    </el-collapse>
  </section>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import MorphologyFeaturesTable from '@/components/mouse/MorphologyFeaturesTable.vue'
import ProjectionInfoTable from '@/components/mouse/ProjectionInfoTable.vue'

@Component({
  components: {
    MorphologyFeaturesTable,
    ProjectionInfoTable
  }
})
export default class NeuronStatesDesc extends Vue {
  @Prop({ required: true }) basicInfo!: any
  @Prop({ required: true }) morphoInfo!: any
  @Prop({ required: true }) projInfo!: any
  private activeSection: string[] = ['dataSummary', 'basicInfo']
  private basicInfoSummary: string = ''
  private morphologySummaries: string = ''
  private projectionInfoSummary: string = ''

  private messageQueue: any[] = []; // 队列来保存消息
  private isProcessing: boolean = false; // 标志是否正在处理消息
  public hasStartedSSE: boolean = false;
  private eventSource: EventSource | null = null;

  @Watch('basicInfo', { immediate: true, deep: true })
  @Watch('morphoInfo', { immediate: true, deep: true })
  @Watch('projInfo', { immediate: true, deep: true })
  onDataChange () {
    this.generateDataSummary()
    this.restartSSE()
  }

  private generateDataSummary () {
    this.basicInfoSummary = ''
    this.morphologySummaries = ''
    this.projectionInfoSummary = ''
  }

  private appendTextGradually (target: 'basicInfoSummary' | 'projectionInfoSummary' | 'morphologySummaries' |string, text: string) {
    this.messageQueue.push({ target, text })
    this.processQueue()
  }

  private processQueue () {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return
    }

    this.isProcessing = true
    const { target, text } = this.messageQueue.shift()!
    let targetArray: string[] | null = null

    let targetCopy = target // 复制target变量

    // if (targetCopy.startsWith('morphologySummaries')) {
    //   const index = parseInt(targetCopy.split('[')[1].split(']')[0], 10)
    //   targetArray = this.morphologySummaries
    //   targetCopy = index.toString()
    // }

    let currentIndex = 0
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        if (targetArray) {
          Vue.set(targetArray, parseInt(targetCopy), (targetArray[parseInt(targetCopy)] || '') + text[currentIndex++])
        } else {
          Vue.set(this, targetCopy, (this as any)[targetCopy] + text[currentIndex++])
        }
      } else {
        clearInterval(intervalId)
        this.isProcessing = false
        this.processQueue() // 处理下一个消息
      }
    }, 5) // 控制字符显示速度，可以调整时间间隔
  }

  public startSSE () {
    if (this.eventSource) {
      this.eventSource.close() // 确保之前的连接已关闭
    }

    this.eventSource = new EventSource('http://10.192.40.36:5000/api/stream', { withCredentials: true }) // 替换为你的后端域名

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'basicInfo') {
        this.appendTextGradually('basicInfoSummary', data.content)
      } else if (data.type === 'morphologyFeatures') {
        this.appendTextGradually(`morphologySummaries`, data.content)
      } else if (data.type === 'projectionInfo') {
        this.appendTextGradually('projectionInfoSummary', data.content)
      }
    }

    this.eventSource.onerror = (error) => {
      console.error('EventSource failed:', error)
      this.eventSource!.close()
    }

    this.eventSource.addEventListener('end', () => {
      this.eventSource!.close()
    })
  }

  public restartSSE () {
    if (this.eventSource) {
      this.eventSource.close()
    }
    this.startSSE()
  }

  mounted () {
    this.$nextTick(() => {
      if (!this.hasStartedSSE) {
        this.startSSE()
        this.hasStartedSSE = true
      }
    })
  }

  beforeDestroy () {
    if (this.eventSource) {
      this.eventSource.close()
    }
  }

  private handleCollapseChange (val: string[]) {
    this.activeSection = val
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.summary-container {
  padding: 15px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.summary-container p {
  margin: 10px 0;
  font-size: 16px;
  color: #333;
}

.summary-container ul {
  padding-left: 20px;
  list-style-type: disc;
}

.summary-container ul li {
  margin: 5px 0;
  font-size: 14px;
  color: #555;
}

</style>
