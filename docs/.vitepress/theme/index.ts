import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'

import ProblemIndex from './components/ProblemIndex.vue'
import ProgressToggle from './components/ProgressToggle.vue'
import ProblemMeta from './components/ProblemMeta.vue'

import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ProblemIndex', ProblemIndex)
    app.component('ProgressToggle', ProgressToggle)
    app.component('ProblemMeta', ProblemMeta)
  }
} satisfies Theme
