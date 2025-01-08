<template>
  <div
    v-if="visible"
    class="floating-tag"
    :style="computedStyle"
    @mousedown="startDrag"
  >
    <div class="tag-title">
      {{ title }}
    </div> <!-- 标题部分 -->
    <div class="tag-content">
      {{ message }}
    </div> <!-- 内容部分 -->
    <button
      class="close-btn"
      @click="closeTag"
    >
      ×
    </button> <!-- 关闭按钮 -->
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    title: {
      type: String,
      default: 'Tag Title' // 默认标题
    },
    message: {
      type: String,
      default: 'This is a floating tag!' // 默认内容
    },
    targetSelector: {
      type: String,
      required: true // 必须传入目标元素选择器
    },
    offset: {
      type: Object,
      default: () => ({
        x: 20, // 水平偏移量
        y: 20 // 垂直偏移量
      })
    }
  },
  data () {
    return {
      visible: true, // 控制浮动标签显示
      position: { top: 'auto', left: 'auto' }, // 标签的定位样式
      dragging: false, // 是否正在拖动
      dragOffset: { x: 0, y: 0 } // 拖动时鼠标的偏移
    }
  },
  computed: {
    computedStyle (): Record<string, string> {
      return {
        position: 'absolute', // 使用绝对定位
        top: this.position.top,
        left: this.position.left,
        zIndex: '1000' // 确保在最上层
      }
    }
  },
  mounted () {
    this.waitForTargetElement() // 初始化加载目标元素
    window.addEventListener('resize', this.calculatePosition) // 监听窗口调整
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.calculatePosition) // 清理事件监听
  },
  methods: {
    // 计算目标元素位置
    calculatePosition () {
      const target = document.querySelector(this.targetSelector)
      if (target) {
        const rect = target.getBoundingClientRect()
        this.position = {
          top: `${rect.top + window.scrollY + this.offset.y}px`,
          left: `${rect.left + window.scrollX + this.offset.x}px`
        }
      } else {
        console.warn(`Target element "${this.targetSelector}" not found.`)
      }
    },
    // 等待目标元素渲染完成
    waitForTargetElement (retries = 10) {
      const target = document.querySelector(this.targetSelector)
      if (target) {
        this.calculatePosition() // 初始化位置
      } else if (retries > 0) {
        setTimeout(() => this.waitForTargetElement(retries - 1), 100) // 递归检查
      } else {
        console.warn(`Target element "${this.targetSelector}" still not found after retries.`)
      }
    },
    // 开始拖动
    startDrag (event: MouseEvent) {
      event.preventDefault() // 阻止默认行为
      this.dragging = true
      const rect = (this.$el as HTMLElement).getBoundingClientRect()
      this.dragOffset = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
      document.addEventListener('mousemove', this.onDrag)
      document.addEventListener('mouseup', this.stopDrag)
    },
    // 拖动时更新标签位置
    onDrag (event: MouseEvent) {
      if (this.dragging) {
        this.position = {
          top: `${event.clientY - this.dragOffset.y}px`,
          left: `${event.clientX - this.dragOffset.x}px`
        }
      }
    },
    // 停止拖动
    stopDrag () {
      this.dragging = false
      document.removeEventListener('mousemove', this.onDrag)
      document.removeEventListener('mouseup', this.stopDrag)
    },
    // 关闭标签
    closeTag () {
      this.visible = false
    }
  }
})
</script>

<style scoped>
.floating-tag {
  background: rgba(50, 50, 50, 0.3); /* 半透明深灰底 */
  color: #ffffff; /* 白色字体 */
  padding: 20px; /* 内边距调整 */
  border-radius: 12px; /* 圆角设计 */
  font-family: "Roboto", sans-serif; /* 科技感字体 */
  font-size: 14px; /* 适中的字体大小 */
  box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.3); /* 深色阴影 */
  border: 1px solid rgba(255, 255, 255, 0.3); /* 微弱的白色边框 */
  backdrop-filter: blur(10px); /* 背景模糊效果，提升科技感 */
  cursor: grab; /* 鼠标提示可拖动 */
  user-select: none; /* 禁止文字选择 */
  position: relative; /* 为标题和内容分区提供支持 */
}

.floating-tag:active {
  cursor: grabbing; /* 拖动时鼠标样式 */
}

.floating-tag .tag-title {
  font-size: 16px; /* 标题稍大 */
  font-weight: bold; /* 标题加粗 */
  margin-bottom: 8px; /* 标题与内容间的间距 */
  text-transform: uppercase; /* 标题全大写 */
  border-bottom: 1px solid rgba(255, 255, 255, 0.2); /* 底部分割线 */
  padding-bottom: 4px; /* 标题底部内边距 */
}

.floating-tag .tag-content {
  font-size: 14px; /* 内容字体大小 */
  font-weight: normal; /* 内容正常字体 */
  line-height: 1.5; /* 行高调整，提升可读性 */
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  font-weight: bold;
  color: #ffffff; /* 白色关闭按钮 */
  cursor: pointer;
  position: absolute; /* 绝对定位 */
  top: 10px; /* 距离顶部的距离 */
  right: 10px; /* 距离右侧的距离 */
  transition: color 0.3s ease; /* 鼠标悬停时的平滑效果 */
}

.close-btn:hover {
  color: #ff4d4f; /* 鼠标悬停时变成红色 */
}
</style>
