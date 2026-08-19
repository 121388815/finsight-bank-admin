import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 会把站点发布在 /finsight-bank-admin/ 子路径下。
  base: '/finsight-bank-admin/',
  plugins: [react()],
  build: {
    //当前路由已经按页面拆包；Ant Design和ECharts分包gzip后均控制在200KB内
    chunkSizeWarningLimit: 650,
  },
})
