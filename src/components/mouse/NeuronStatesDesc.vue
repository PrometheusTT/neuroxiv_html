<template>
  <section class="feature-desc">
    <el-collapse v-model="activeSection">
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
import { Component, Vue, Prop } from 'vue-property-decorator'
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
  private activeSection: string = 'basicInfo'
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">

</style>
