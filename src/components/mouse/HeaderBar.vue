<template>
  <div class="header-bar">
    <NeuronLogo class="neuron-logo" />
    <div class="actions">
      <slot>
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
          Search by id
        </el-button>
        <el-button
          type="primary"
          plain
          class="action"
          @click="$emit('clickSearchByLLMButton')"
        >
          AIPOM
        </el-button>
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
        <!--        <el-select-->
        <!--          v-model="selectedAtlas"-->
        <!--          placeholder="Please Select Atlas"-->
        <!--          class="action"-->
        <!--          @change="switchAtlas"-->
        <!--        >-->
        <!--          <el-option-->
        <!--            v-for="item in atlases"-->
        <!--            :key="item.name"-->
        <!--            :label="item.name"-->
        <!--            :value="item.name"-->
        <!--          />-->
        <!--        </el-select>-->
        <el-button
          type="primary"
          plain
          class="action"
          @click="openJupyterNotebook"
        >
          Open Jupyter Notebook
        </el-button>
      </slot>
    </div>
    <div class="right-container">
      <!-- New Button to Open Video Tutorial near logos -->
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

      <!-- Logos -->
      <span class="partner">
        <span class="partner-cn">脑科学与智能技术研究院</span><br>
        <span class="partner-en">Institute for Brain and Intelligence</span>
      </span>
      <img
        src="@/assets/ailab_logo.png"
        alt="ailab"
        class="ailab-logo"
      >
    </div>

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

@Component({
  computed: {
    ...mapState(['userInfo'])
  },
  components: { NeuronLogo }
})
export default class HeaderBar extends RouterHelper {
  @Prop({ default: true }) private showVideoButton!: boolean; // 新增prop，用来控制按钮显示
  private atlases = [
    {
      name: 'CCFv3'
    },
    {
      name: 'CCF-thin'
    }
  ]
  private selectedAtlas: string = 'CCFv3'
  private showVideoDialog: boolean = false

  /**
   * 触发clickUploadNeuron事件，并传参到Container组件
   * @param param 通过该参数可获得文件
   */
  private uploadNeuron (param: any) {
    this.$emit('clickUploadNeuron', param)
  }
  openJupyterNotebook () {
    window.open('http://localhost:8888/?token=d28243d27c934d3abec200befb5fca9b05eaa58b18d0ff04/C:/Users/user/Desktop/notebooks/generated_notebook.ipynb')
  }

  /**
   * 在上传之前检查文件是否为.swc或.eswc文件
   * @param file 文件类对象
   */
  private beforeUpload (file: any) {
    const fileSuffix = file.name.substring(file.name.lastIndexOf('.') + 1)
    if (fileSuffix !== 'swc' && fileSuffix !== '.eswc') {
      this.$message('The upload file must be swc file or eswc file!')
      return false
    }
  }

  /**
   * 切换当前atlas
   * @private
   */
  private switchAtlas () {
    console.log(this.selectedAtlas)
    this.$emit('switchAtlas', this.selectedAtlas)
  }

  /**
   * 设置当前选择的atlas名称
   * @param atlasName
   */
  public setAtlas (atlasName: string) {
    this.selectedAtlas = atlasName
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.header-bar {
  background-color: #023793;
  height: 80px;
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between; /* Spread out items across the header */
  position: relative;
  padding: 0 20px; /* Add padding to prevent elements from touching the edges */

  .neuron-logo {
    margin: 0 50px 0 30px;
    color: white;
  }

  .actions {
    white-space: nowrap;
    display: flex; /* Flex to arrange action buttons horizontally */
    .action {
      margin-left: 20px;
    }
  }

  .right-container {
    display: flex; /* Flex to align button and logos */
    align-items: center; /* Align items vertically centered */
    margin-left: auto; /* Push container to the right */
    margin-right: 20px; /* Add margin to control how far from the right it is */
  }

  .tutorial-button {
    margin-right: 20px; /* Adjust margin to fine-tune the button position */
  }

  .ailab-logo {
    width: 105px;
    margin-left: 20px; /* Adjust this margin to control the space between the button and the logo */
  }

  .partner {
    color: white;
    margin-left: 10px; /* Ensure the text is close to the button and logo */
    .partner-cn, .partner-en {
      font-size: 17px;
    }
  }
}
</style>
