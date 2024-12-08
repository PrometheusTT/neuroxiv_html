<template>
  <div class="header-bar">
    <NeuronLogo class="neuron-logo" />

    <!-- 根据 actionsAlignment 动态设置类 -->
    <div
      :class="[
        'actions',
        actionsAlignment === 'right' ? 'actions-right' : ''
      ]"
    >
      <slot>
        <!-- 按钮内容 -->
        <el-button
          type="primary"
          plain
          class="action"
          @click="$emit('clickSearchButton')"
        >
          Search
        </el-button>
        <el-button
          type="primary"
          plain
          class="action"
          @click="$emit('clickSearchByIDButton')"
        >
          Search by ID
        </el-button>
        <el-button
          id="AIPOM_button"
          type="primary"
          plain
          class="action"
          @click="$emit('clickSearchByLLMButton')"
        >
          AIPOM
        </el-button>
        <FloatingTag
          title="Usage Tip"
          message="Click here to try AI powered mining tools!"
          target-selector="#AIPOM_button"
          :offset="{ x: 20, y: 20 }"
        />
        <el-upload
          action=""
          accept=".swc,.eswc"
          :show-file-list="false"
          :before-upload="beforeUpload"
          :http-request="uploadNeuron"
          class="action"
        >
          <el-button
            type="primary"
            plain
          >
            Upload neuron
          </el-button>
        </el-upload>
        <!--        <el-button-->
        <!--          type="primary"-->
        <!--          plain-->
        <!--          class="action"-->
        <!--          @click="openJupyterNotebook"-->
        <!--        >-->
        <!--          Open Jupyter Notebook-->
        <!--        </el-button>-->
      </slot>
    </div>

    <!-- 右侧容器 -->
    <div class="right-container">
      <slot name="video_button">
        <el-button
          v-if="showVideoButton"
          type="primary"
          plain
          class="tutorial-button"
          @click="showVideoDialog = true"
        >
          Tutorial video
        </el-button>
      </slot>
    </div>

    <!-- Tutorial video 对话框 -->
    <el-dialog
      title="Tutorial video"
      :visible.sync="showVideoDialog"
      width="50%"
    >
      <video
        controls
        width="100%"
      >
        <source
          src="https://d36ajqhpoeuszk.cloudfront.net/tutorial.mp4"
          type="video/mp4"
        >
        Your browser does not support video playback.
      </video>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator'
import RouterHelper from '@/mixins/RouterHelper.vue'
import { mapState } from 'vuex'
import NeuronLogo from '@/components/common/NeuronLogo.vue'
import FloatingTag from '@/components/mouse/FloatingTag.vue'

@Component({
  computed: {
    ...mapState(['userInfo'])
  },
  components: { FloatingTag, NeuronLogo }
})
export default class HeaderBar extends RouterHelper {
    @Prop({ default: true }) private showVideoButton!: boolean;
    @Prop({ default: 'left' }) private actionsAlignment!: string;
    private showVideoDialog: boolean = false;

    private uploadNeuron (param: any) {
      this.$emit('clickUploadNeuron', param)
    }

    openJupyterNotebook () {
      window.open('http://localhost:8888/')
    }

    private beforeUpload (file: any) {
      const fileSuffix = file.name.substring(
        file.name.lastIndexOf('.') + 1
      )
      if (fileSuffix !== 'swc' && fileSuffix !== 'eswc') {
        this.$message(
          'The upload file must be swc file or eswc file!'
        )
        return false
      }
    }
}
</script>

<style scoped lang="less">
.header-bar {
  background-color: #023793;
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 20px;

  .neuron-logo {
    margin-right: 30px;
    color: white;
  }

  .actions {
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: flex-start;

    .action {
      margin-left: 20px;
    }
  }

  .actions-right {
    justify-content: flex-end;
  }

  .right-container {
    display: flex;
    align-items: center;
  }

  .tutorial-button {
    margin-right: 20px;
  }
}
</style>

<!--<template>-->
<!--  <div class="header-bar">-->
<!--    <NeuronLogo class="neuron-logo" />-->
<!--    <div class="actions">-->
<!--      <slot>-->
<!--        <el-button-->
<!--          type="primary"-->
<!--          plain-->
<!--          class="action"-->
<!--          @click="$emit('clickSearchButton')"-->
<!--        >-->
<!--          Search-->
<!--        </el-button>-->
<!--        <el-button-->
<!--          type="primary"-->
<!--          plain-->
<!--          class="action"-->
<!--          @click="$emit('clickSearchByIDButton')"-->
<!--        >-->
<!--          Search by id-->
<!--        </el-button>-->
<!--        <el-button-->
<!--          type="primary"-->
<!--          plain-->
<!--          class="action"-->
<!--          @click="$emit('clickSearchByLLMButton')"-->
<!--        >-->
<!--          AIPOM-->
<!--        </el-button>-->
<!--        <el-upload-->
<!--          action=""-->
<!--          accept=".swc,.eswc"-->
<!--          :show-file-list="false"-->
<!--          :before-upload="beforeUpload"-->
<!--          :http-request="uploadNeuron"-->
<!--          class="action"-->
<!--        >-->
<!--          <el-button-->
<!--            type="primary"-->
<!--            plain-->
<!--          >-->
<!--            Upload neuron-->
<!--          </el-button>-->
<!--        </el-upload>-->
<!--        &lt;!&ndash;        <el-select&ndash;&gt;-->
<!--        &lt;!&ndash;          v-model="selectedAtlas"&ndash;&gt;-->
<!--        &lt;!&ndash;          placeholder="Please Select Atlas"&ndash;&gt;-->
<!--        &lt;!&ndash;          class="action"&ndash;&gt;-->
<!--        &lt;!&ndash;          @change="switchAtlas"&ndash;&gt;-->
<!--        &lt;!&ndash;        >&ndash;&gt;-->
<!--        &lt;!&ndash;          <el-option&ndash;&gt;-->
<!--        &lt;!&ndash;            v-for="item in atlases"&ndash;&gt;-->
<!--        &lt;!&ndash;            :key="item.name"&ndash;&gt;-->
<!--        &lt;!&ndash;            :label="item.name"&ndash;&gt;-->
<!--        &lt;!&ndash;            :value="item.name"&ndash;&gt;-->
<!--        &lt;!&ndash;          />&ndash;&gt;-->
<!--        &lt;!&ndash;        </el-select>&ndash;&gt;-->
<!--        <el-button-->
<!--          type="primary"-->
<!--          plain-->
<!--          class="action"-->
<!--          @click="openJupyterNotebook"-->
<!--        >-->
<!--          Open Jupyter Notebook-->
<!--        </el-button>-->
<!--      </slot>-->
<!--    </div>-->
<!--    <div class="right-container">-->
<!--      &lt;!&ndash; New Button to Open Video Tutorial near logos &ndash;&gt;-->
<!--      <slot name="video_button">-->
<!--        <el-button-->
<!--          v-if="showVideoButton"-->
<!--          type="primary"-->
<!--          plain-->
<!--          class="tutorial-button"-->
<!--          @click="showVideoDialog = true"-->
<!--        >-->
<!--          Tutorial video-->
<!--        </el-button>-->
<!--      </slot>-->

<!--      &lt;!&ndash; Logos &ndash;&gt;-->
<!--      &lt;!&ndash;      <span class="partner">&ndash;&gt;-->
<!--      &lt;!&ndash;        <span class="partner-cn">脑科学与智能技术研究院</span><br>&ndash;&gt;-->
<!--      &lt;!&ndash;        <span class="partner-en">Institute for Brain and Intelligence</span>&ndash;&gt;-->
<!--      &lt;!&ndash;      </span>&ndash;&gt;-->
<!--      &lt;!&ndash;      <img&ndash;&gt;-->
<!--      &lt;!&ndash;        src="@/assets/ailab_logo.png"&ndash;&gt;-->
<!--      &lt;!&ndash;        alt="ailab"&ndash;&gt;-->
<!--      &lt;!&ndash;        class="ailab-logo"&ndash;&gt;-->
<!--      &lt;!&ndash;      >&ndash;&gt;-->
<!--    </div>-->

<!--    <el-dialog-->
<!--      title="Tutorial video"-->
<!--      :visible.sync="showVideoDialog"-->
<!--      width="50%"-->
<!--    >-->
<!--      <video-->
<!--        controls-->
<!--        width="100%"-->
<!--      >-->
<!--        <source-->
<!--          src="https://d36ajqhpoeuszk.cloudfront.net/tutorial.mp4"-->
<!--          type="video/mp4"-->
<!--        >-->
<!--        Your browser does not support video playback.-->
<!--      </video>-->
<!--    </el-dialog>-->
<!--  </div>-->
<!--</template>-->

<!--<script lang="ts">-->
<!--import { Component, Prop } from 'vue-property-decorator'-->
<!--import RouterHelper from '@/mixins/RouterHelper.vue'-->
<!--import { mapState } from 'vuex'-->
<!--import NeuronLogo from '@/components/common/NeuronLogo.vue'-->

<!--@Component({-->
<!--  computed: {-->
<!--    ...mapState(['userInfo'])-->
<!--  },-->
<!--  components: { NeuronLogo }-->
<!--})-->
<!--export default class HeaderBar extends RouterHelper {-->
<!--  @Prop({ default: true }) private showVideoButton!: boolean; // 新增prop，用来控制按钮显示-->
<!--  private atlases = [-->
<!--    {-->
<!--      name: 'CCFv3'-->
<!--    },-->
<!--    {-->
<!--      name: 'CCF-thin'-->
<!--    }-->
<!--  ]-->
<!--  private selectedAtlas: string = 'CCFv3'-->
<!--  private showVideoDialog: boolean = false-->

<!--  /**-->
<!--   * 触发clickUploadNeuron事件，并传参到Container组件-->
<!--   * @param param 通过该参数可获得文件-->
<!--   */-->
<!--  private uploadNeuron (param: any) {-->
<!--    this.$emit('clickUploadNeuron', param)-->
<!--  }-->
<!--  openJupyterNotebook () {-->
<!--    window.open('http://localhost:8888/?token=d28243d27c934d3abec200befb5fca9b05eaa58b18d0ff04/C:/Users/user/Desktop/notebooks/generated_notebook.ipynb')-->
<!--  }-->

<!--  /**-->
<!--   * 在上传之前检查文件是否为.swc或.eswc文件-->
<!--   * @param file 文件类对象-->
<!--   */-->
<!--  private beforeUpload (file: any) {-->
<!--    const fileSuffix = file.name.substring(file.name.lastIndexOf('.') + 1)-->
<!--    if (fileSuffix !== 'swc' && fileSuffix !== '.eswc') {-->
<!--      this.$message('The upload file must be swc file or eswc file!')-->
<!--      return false-->
<!--    }-->
<!--  }-->

<!--  /**-->
<!--   * 切换当前atlas-->
<!--   * @private-->
<!--   */-->
<!--  private switchAtlas () {-->
<!--    console.log(this.selectedAtlas)-->
<!--    this.$emit('switchAtlas', this.selectedAtlas)-->
<!--  }-->

<!--  /**-->
<!--   * 设置当前选择的atlas名称-->
<!--   * @param atlasName-->
<!--   */-->
<!--  public setAtlas (atlasName: string) {-->
<!--    this.selectedAtlas = atlasName-->
<!--  }-->
<!--}-->
<!--</script>-->

<!--&lt;!&ndash; Add "scoped" attribute to limit CSS to this component only &ndash;&gt;-->
<!--<style scoped lang="less">-->
<!--.header-bar {-->
<!--  background-color: #023793;-->
<!--  height: 80px;-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  justify-content: flex-start; /* 左对齐 */-->
<!--  position: relative;-->
<!--  padding: 0 20px; /* 防止元素接触边缘 */-->

<!--  .neuron-logo {-->
<!--    margin-right: auto; /* 保持 logo 在最左侧，其他内容向右推 */-->
<!--    color: white;-->
<!--  }-->

<!--  .actions {-->
<!--    white-space: nowrap;-->
<!--    display: flex; /* 保持按钮水平排列 */-->
<!--    align-items: center; /* 垂直居中 */-->
<!--    margin-right: 20px; /* 右侧的间距 */-->

<!--    .action {-->
<!--      margin-left: 20px; /* 按钮之间的间距 */-->
<!--    }-->
<!--  }-->

<!--  .right-container {-->
<!--    display: flex; /* 使按钮和图标对齐 */-->
<!--    align-items: center; /* 垂直居中 */-->
<!--    margin-left: 20px; /* 控制按钮和视频按钮之间的距离 */-->
<!--  }-->

<!--  .tutorial-button {-->
<!--    margin-right: 20px; /* 微调按钮位置的边距 */-->
<!--  }-->

<!--  .ailab-logo {-->
<!--    width: 105px;-->
<!--    margin-left: 20px; /* 控制按钮与logo之间的空间 */-->
<!--  }-->

<!--  .partner {-->
<!--    color: white;-->
<!--    margin-left: 10px; /* 确保文本接近按钮和logo */-->
<!--    .partner-cn, .partner-en {-->
<!--      font-size: 17px;-->
<!--    }-->
<!--  }-->
<!--}-->
<!--</style>-->
