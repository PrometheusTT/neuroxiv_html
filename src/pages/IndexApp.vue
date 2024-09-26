<template>
  <div id="app">
    <SmallScreenAlert />
    <!-- 使用 actions-alignment="right" 控制按钮区域对齐方式 -->
    <header-bar
      :show-video-button="false"
      actions-alignment="right"
    >
      <!-- 按钮区域 -->
      <div class="action-buttons">
        <router-link
          :to="getCompleteRouteByPathString('about')"
          class="button-link"
        >
          <el-button
            type="primary"
            plain
            class="equal-button"
          >
            About
          </el-button>
        </router-link>

        <a
          href="/neuroXiv_user_instruction.pdf"
          class="button-link"
          target="_blank"
        >
          <el-button
            type="primary"
            plain
            class="equal-button"
          >
            Help
          </el-button>
        </a>

        <a
          href="https://download.neuroxiv.org"
          class="button-link"
          target="_blank"
        >
          <el-button
            type="primary"
            plain
            class="equal-button"
          >
            Download
          </el-button>
        </a>

        <router-link
          :to="getCompleteRouteByPathString('news')"
          class="button-link"
        >
          <el-button
            type="primary"
            plain
            class="equal-button"
          >
            News
          </el-button>
        </router-link>
      </div>
    </header-bar>
    <transition name="slide-fade">
      <router-view />
    </transition>
    <ThemeSwitcher v-show="false" />
    <footer>
      Ver 2.0. Copyright 2024.
    </footer>
  </div>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator'
import HeaderBar from '@/components/mouse/HeaderBar.vue'
import RouterHelper from '@/mixins/RouterHelper.vue'
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue'
import LangSwitcher from '@/components/common/LangSwitcher.vue'
import SmallScreenAlert from '@/components/common/SmallScreenAlert.vue'

@Component({
  components: {
    SmallScreenAlert,
    LangSwitcher,
    ThemeSwitcher,
    HeaderBar
  }
})
export default class IndexApp extends RouterHelper {}
</script>

<style lang="less" scoped>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
  background-color: var(--page-background-color);
  position: relative;
  min-width: 1300px;

  footer {
    position: fixed;
    color: grey;
    font-size: 0.8em;
    bottom: 30px;
    width: 100%;
    text-align: center;
  }
}

/* 保持原有的按钮样式 */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end; /* 将按钮区域靠右对齐 */
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
}

.button-link {
  display: flex;
  text-decoration: none;
}

.equal-button {
  min-width: 140px;
  max-width: 200px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}

.equal-button:hover {
  transform: translateY(-2px);
  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15);
}
</style>

<!--<template>-->
<!--  <div id="app">-->
<!--    <SmallScreenAlert />-->
<!--    <header-bar-->
<!--      :show-video-button="false"-->
<!--      class="header-bar-container"-->
<!--    >-->
<!--      &lt;!&ndash; 按钮区域 &ndash;&gt;-->
<!--      <div class="action-buttons">-->
<!--        <router-link-->
<!--          :to="getCompleteRouteByPathString('about')"-->
<!--          class="button-link"-->
<!--        >-->
<!--          <el-button-->
<!--            type="primary"-->
<!--            plain-->
<!--            class="equal-button"-->
<!--          >-->
<!--            About-->
<!--          </el-button>-->
<!--        </router-link>-->

<!--        <a-->
<!--          href="/neuroXiv_user_instruction.pdf"-->
<!--          class="button-link"-->
<!--          target="_blank"-->
<!--        >-->
<!--          <el-button-->
<!--            type="primary"-->
<!--            plain-->
<!--            class="equal-button"-->
<!--          >-->
<!--            Help-->
<!--          </el-button>-->
<!--        </a>-->

<!--        &lt;!&ndash; Modified Button: Download &ndash;&gt;-->
<!--        <a-->
<!--          href="https://download.neuroxiv.org"-->
<!--          class="button-link"-->
<!--          target="_blank"-->
<!--        >-->
<!--          <el-button-->
<!--            type="primary"-->
<!--            plain-->
<!--            class="equal-button"-->
<!--          >-->
<!--            Download-->
<!--          </el-button>-->
<!--        </a>-->

<!--        <router-link-->
<!--          :to="getCompleteRouteByPathString('news')"-->
<!--          class="button-link"-->
<!--        >-->
<!--          <el-button-->
<!--            type="primary"-->
<!--            plain-->
<!--            class="equal-button"-->
<!--          >-->
<!--            News-->
<!--          </el-button>-->
<!--        </router-link>-->
<!--      </div>-->
<!--    </header-bar>-->
<!--    <transition name="slide-fade">-->
<!--      <router-view />-->
<!--    </transition>-->
<!--    <ThemeSwitcher v-show="false" />-->
<!--    <footer>-->
<!--      Ver 2.0. Copyright 2024.-->
<!--      &lt;!&ndash;      <a&ndash;&gt;-->
<!--      &lt;!&ndash;        href="https://beian.miit.gov.cn"&ndash;&gt;-->
<!--      &lt;!&ndash;        target="_blank"&ndash;&gt;-->
<!--      &lt;!&ndash;      >&ndash;&gt;-->
<!--      &lt;!&ndash;        【备案号：粤B2-20090059】&ndash;&gt;-->
<!--      &lt;!&ndash;      </a>&ndash;&gt;-->
<!--    </footer>-->
<!--  </div>-->
<!--</template>-->

<!--<script lang="ts">-->
<!--import { Component } from 'vue-property-decorator'-->
<!--import HeaderBar from '@/components/mouse/HeaderBar.vue'-->
<!--import RouterHelper from '@/mixins/RouterHelper.vue'-->
<!--import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue'-->
<!--import LangSwitcher from '@/components/common/LangSwitcher.vue'-->
<!--import SmallScreenAlert from '@/components/common/SmallScreenAlert.vue'-->

<!--@Component({-->
<!--  components: {-->
<!--    SmallScreenAlert,-->
<!--    LangSwitcher,-->
<!--    ThemeSwitcher,-->
<!--    HeaderBar-->
<!--  }-->
<!--})-->
<!--export default class IndexApp extends RouterHelper {}-->
<!--</script>-->

<!--<style lang="less" scoped>-->
<!--#app {-->
<!--  font-family: 'Avenir', Helvetica, Arial, sans-serif;-->
<!--  -webkit-font-smoothing: antialiased;-->
<!--  -moz-osx-font-smoothing: grayscale;-->
<!--  height: 100%;-->
<!--  background-color: var(&#45;&#45;page-background-color);-->
<!--  position: relative;-->
<!--  min-width: 1300px;-->

<!--  footer {-->
<!--    position: absolute;-->
<!--    color: grey;-->
<!--    font-size: 0.8em;-->
<!--    bottom: 30px;-->
<!--    width: 100%;-->
<!--    text-align: center;-->
<!--  }-->
<!--}-->

<!--header-bar {-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  justify-content: flex-end; /* 确保按钮容器居中 */-->
<!--  padding: 20px; /* 加大顶部和底部的内边距 */-->
<!--}-->

<!--.action-buttons {-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  justify-content: space-around; /* 在按钮之间均匀分布空间 */-->
<!--  flex-wrap: wrap; /* 允许按钮在小屏幕时换行 */-->
<!--  width: 100%; /* 宽度自动调整 */-->
<!--  max-width: 1000px; /* 根据需要调整最大宽度 */-->
<!--  margin: 0 auto; /* 确保容器在页面上居中 */-->
<!--  gap: 20px; /* 使用 gap 控制按钮之间的间距 */-->
<!--}-->

<!--.button-link {-->
<!--  display: flex; /* 设置为flex，使链接容器表现为块级元素 */-->
<!--  text-decoration: none; /* 去掉下划线 */-->
<!--}-->

<!--.equal-button {-->
<!--  min-width: 140px;-->
<!--  max-width: 200px;-->
<!--  height: 36px;-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  justify-content: center;-->
<!--  text-align: center;-->
<!--  border: none;-->
<!--  border-radius: 8px; /* Rounded corners */-->
<!--  color: #fff; /* Text color */-->
<!--  cursor: pointer;-->
<!--  transition: all 0.3s ease; /* Smooth transitions */-->
<!--  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); /* Subtle shadow */-->
<!--}-->

<!--.equal-button:hover {-->
<!--  transform: translateY(-2px); /* Slight lift effect on hover */-->
<!--  box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.15); /* Enhanced shadow on hover */-->
<!--}-->
<!--.header-bar-container {-->
<!--  display: flex; /* 设置为 flex 布局 */-->
<!--  justify-content: flex-end; /* 将内容移到最右边 */-->
<!--  align-items: center; /* 垂直居中 */-->
<!--  padding: 20px; /* 加大顶部和底部的内边距 */-->
<!--}-->
<!--</style>-->

<!--<style lang="less">-->
<!--body {-->
<!--  overflow: auto;-->
<!--}-->
<!--</style>-->
