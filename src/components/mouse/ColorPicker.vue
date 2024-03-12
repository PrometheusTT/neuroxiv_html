<template>
  <div>
    <input
      v-model="color"
      type="color"
      @input="updateColor"
    >
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class ColorPicker extends Vue {
    color: string = '#ffffff'; // 默认颜色

    updateColor () {
      this.$emit('color-selected', this.color)
    }
}
</script>
