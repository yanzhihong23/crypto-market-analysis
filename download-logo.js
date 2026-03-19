import fs from 'fs'
import path from 'path'

import axios from 'axios'

// 图片保存目录
const logoDirectory = './public/logos'

// 如果目录不存在，则创建它
if (!fs.existsSync(logoDirectory)) {
  fs.mkdirSync(logoDirectory, { recursive: true })
}

// Binance API URL
const binanceUrl =
  'https://www.binance.com/bapi/composite/v1/public/marketing/symbol/list'

// Use Clash Verge local proxy so Node uses the same path as Chrome (default port 7897)
const requestConfig = {
  timeout: 30000,
  proxy: { protocol: 'http', host: '127.0.0.1', port: 7897 },
}

// 获取币对信息并下载logo
async function fetchAndDownloadLogos() {
  try {
    // 发出GET请求以获取币对信息（失败时自动重试 2 次）
    let response
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await axios.get(binanceUrl, requestConfig)
        break
      } catch (err) {
        if (attempt === 3) throw err
        console.warn(`第 ${attempt} 次请求超时，重试中...`)
      }
    }
    const data = response.data

    // 检查响应结构是否正确
    if (data && data.data && Array.isArray(data.data)) {
      const symbols = data.data

      // 遍历每个币对信息
      for (const symbolInfo of symbols) {
        const { symbol, logo } = symbolInfo

        // 如果存在symbol和logo，下载logo
        if (symbol && logo) {
          const logoUrl = logo
          const filePath = path.join(logoDirectory, `${symbol}.png`)

          // 下载并保存logo图片
          const writer = fs.createWriteStream(filePath)
          const logoResponse = await axios({
            url: logoUrl,
            method: 'GET',
            responseType: 'stream',
            ...requestConfig,
          })

          logoResponse.data.pipe(writer)

          writer.on('finish', () => {
            console.log(`${symbol}.png 下载完成`)
          })

          writer.on('error', (error) => {
            console.error(`下载 ${symbol}.png 时出错:`, error)
          })
        }
      }
    } else {
      console.error('未获取到有效的币对信息')
    }
  } catch (error) {
    console.error('请求币对信息时出错:', error)
  }
}

// 运行程序
fetchAndDownloadLogos()
