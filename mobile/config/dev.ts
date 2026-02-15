import type { UserConfigExport } from '@tarojs/cli'
import baseConfig from './index'

const config: UserConfigExport = {
  ...baseConfig,
  defineConstants: {
    ...(baseConfig.defineConstants || {}),
    __DEV__: JSON.stringify(true),
    // 从 .env.development 读取 API 地址
    TARO_APP_API_BASE_URL: JSON.stringify(process.env.TARO_APP_API_BASE_URL || '')
  }
}

export default config
