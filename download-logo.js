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

// 获取币对信息并下载logo
async function fetchAndDownloadLogos() {
  try {
    // 发出GET请求以获取币对信息
    const response = await axios.get(binanceUrl)
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
