# 🕷️ Image Crawler

高级网站图片爬虫工具 - 深度抓取网页中的所有图片资源

## ✨ 特性

- ⚡ **基于Crawlee**: 使用现代爬虫框架，自动队列管理、去重、重试
- 🎯 **双模式支持**: 轻量级模式(HttpCrawler) + 浏览器模式(PlaywrightCrawler)  
- 🔍 **全面检测**: 支持 `<img>` 标签、CSS `background-image`、SVG 图片、Canvas 快照
- 📊 **深度爬取**: 递归爬取同域名下的子页面，自动URL去重
- 🎨 **多种格式**: 支持 TXT、JSON、CSV 输出格式  
- 🚀 **高性能**: 内置并发控制、自动重试、Session管理
- 🎛️ **灵活配置**: 丰富的过滤和配置选项
- 📱 **CLI友好**: 完整的命令行工具支持
- 📦 **模块化**: 既可作为 npm 包使用，也可作为独立工具

## 🚀 快速开始

### 全局安装

```bash
npm install -g @dzqdzq/image-crawler
```

### 基本使用

```bash
# 轻量级模式 - 无需浏览器 (推荐)
image-crawler https://example.com --download

# 浏览器模式 - 需要Chrome，功能更强
image-crawler https://example.com --browser-mode --download

# 指定下载目录和爬取深度
image-crawler https://example.com --download --output-dir ./my-images -d 3

# 生成 JSON 格式的下载报告
image-crawler https://example.com --download -o download-report.json
```

### 🆚 模式选择

| 特性 | 轻量级模式 (HttpCrawler) | 浏览器模式 (PlaywrightCrawler) |
|------|--------------------------|-------------------------------|
| 🚀 启动速度 | ⚡ 快 (秒级) | 🐌 慢 (10-30秒) |
| 📦 安装大小 | 小 (~15MB) | 大 (~300MB) |
| 💻 资源占用 | 💚 低 | 🔶 高 |
| 🌐 浏览器依赖 | ❌ 无需 | ✅ 需要Playwright |
| 🖼️ 静态图片 | ✅ 支持 | ✅ 支持 |
| ⚡ 动态图片 | ❌ 不支持 | ✅ 支持 |
| 🎭 JavaScript渲染 | ❌ 不支持 | ✅ 支持 |
| 🔄 队列管理 | ✅ Crawlee自动管理 | ✅ Crawlee自动管理 |
| 🔁 自动重试 | ✅ 内置 | ✅ 内置 |
| 🎯 URL去重 | ✅ 自动去重 | ✅ 自动去重 |
| 🛡️ 错误处理 | ✅ 强化 | ✅ 强化 |

**推荐**: 优先使用轻量级模式，基于Crawlee框架更稳定高效！

## 🛠️ 安装

### 作为 CLI 工具安装

```bash
npm install -g @dzqdzq/image-crawler
```

### 作为项目依赖安装

```bash
npm install @dzqdzq/image-crawler
```

### 安装浏览器依赖 (可选)

**轻量级模式**: 无需安装任何浏览器，直接使用即可！

**浏览器模式**: 需要安装Playwright浏览器：

```bash
# 全局安装后
npx playwright install

# 或只安装Chromium
npx playwright install chromium

# 项目依赖安装后  
npx playwright install
```

**注意**: 
- Playwright 浏览器下载包约 300MB，请确保网络连接稳定
- 支持 Chrome/Chromium、Firefox、Safari(WebKit) 多种浏览器引擎
- 推荐使用轻量级模式，覆盖90%的使用场景且无需下载浏览器

## 📖 CLI 使用方法

### 基础命令

```bash
image-crawler <url> [选项]
```

### 命令选项

| 选项 | 说明 | 默认值 |
|------|------|--------|
| `-d, --depth <number>` | 最大爬取深度 | 2 |
| `-o, --output <file>` | 输出文件路径 | image_urls.txt |
| `-f, --format <type>` | 输出格式 (txt\|json\|csv) | txt |
| `-c, --concurrent <number>` | 并发页面数量 | 3 |
| `-t, --timeout <number>` | 页面超时时间(秒) | 30 |
| `--no-headless` | 显示浏览器窗口 (调试用) | false |
| `--filter <types>` | 过滤图片类型 (jpg,png,gif,svg,webp) | 无 |
| `--min-size <bytes>` | 最小图片文件大小 (字节) | 0 |
| `--exclude-data-uri` | 排除Base64图片 | false |
| `--download` | 下载图片到本地 (默认只收集URL) | false |
| `--output-dir <dir>` | 图片保存目录 | ./images |
| `--browser-mode` | 使用浏览器模式 (需要Playwright) | false |
| `--lightweight` | 使用轻量级模式 (默认，基于Crawlee) | true |

### 使用示例

```bash
# 轻量级模式 (默认，基于Crawlee)
image-crawler https://example.com --download

# 浏览器模式 (需要Playwright)
image-crawler https://example.com --browser-mode --download

# 指定下载目录
image-crawler https://example.com --download --output-dir ./my-images

# 深度爬取并下载 (3层深度)
image-crawler https://example.com -d 3 --download

# 只下载特定格式的图片
image-crawler https://example.com --download --filter jpg,png,webp

# 排除小于10KB的图片
image-crawler https://example.com --download --min-size 10240

# 排除Base64图片，提高性能
image-crawler https://example.com --download --exclude-data-uri

# 输出为JSON格式 (URL收集模式)
image-crawler https://example.com -f json -o images.json

# 显示浏览器窗口 (调试用)
image-crawler https://example.com --download --no-headless
```

### 查看帮助

```bash
# 查看帮助信息
image-crawler --help

# 查看使用示例
image-crawler example

# 生成配置文件模板
image-crawler config -o my-config.json
```

## 📚 编程接口 (API)

### 基本用法

```javascript
const crawlImages = require('@dzqdzq/image-crawler');

(async () => {
  const images = await crawlImages('https://example.com');
  console.log(`找到 ${images.length} 个图片`);
})();
```

### 高级配置

```javascript
const crawlImages = require('@dzqdzq/image-crawler');

// URL 收集模式
const urlOptions = {
  maxDepth: 3,                    // 最大爬取深度
  outputFile: 'images.json',      // 输出文件
  outputFormat: 'json',           // 输出格式
  maxConcurrent: 5,               // 最大并发数
  timeout: 60000,                 // 超时时间 (毫秒)
  headless: true,                 // 无头模式
  imageFilter: ['jpg', 'png'],    // 图片类型过滤
  minSize: 1024,                  // 最小文件大小
  excludeDataUri: true,           // 排除Base64图片
  userAgent: 'Custom Bot 1.0'     // 自定义User-Agent
};

const images = await crawlImages('https://example.com', urlOptions);

// 图片下载模式
const downloadOptions = {
  downloadImages: true,           // 启用下载模式
  outputDir: './downloaded-images', // 下载目录
  maxDepth: 2,                    // 最大爬取深度
  outputFile: 'download-report.json', // 下载报告文件
  imageFilter: ['jpg', 'png', 'webp'], // 只下载指定格式
  excludeDataUri: false,          // 包含Base64图片
  minSize: 5120                   // 最小5KB
};

const result = await crawlImages('https://example.com', downloadOptions);
console.log(`下载成功: ${result.stats.success} 个图片`);
```

### 返回数据格式

#### URL 收集模式
```javascript
[
  {
    "url": "https://example.com/image.jpg",
    "type": "img-tag",
    "element": "img",
    "alt": "示例图片",
    "width": 800,
    "height": 600,
    "visible": true,
    "crawledFrom": "https://example.com",
    "crawledAt": "2024-01-01T12:00:00.000Z",
    "isDataUri": false
  }
]
```

#### 下载模式
```javascript
{
  "downloadedImages": [
    {
      "filename": "images/logo.png",
      "filepath": "/path/to/images/logo.png", 
      "size": 15824,
      "type": "img-tag",
      "contentType": "image/png",
      "skipped": false
    }
  ],
  "failedDownloads": [
    {
      "url": "https://example.com/broken.jpg",
      "type": "background-image", 
      "error": "Request failed with status code 404"
    }
  ],
  "stats": {
    "total": 12,
    "success": 10,
    "failed": 2,
    "skipped": 3,
    "totalSize": 2458624
  }
}
```

## 🎛️ 配置选项

### 完整配置说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `maxDepth` | number | 2 | 最大爬取深度 |
| `outputFile` | string | 'image_urls.txt' | 输出文件路径 |
| `outputFormat` | string | 'txt' | 输出格式 (txt/json/csv) |
| `maxConcurrent` | number | 3 | 最大并发页面数 |
| `timeout` | number | 30000 | 页面加载超时时间(毫秒) |
| `headless` | boolean | true | 是否使用无头模式 |
| `imageFilter` | array | null | 图片类型过滤 |
| `minSize` | number | 0 | 最小图片大小(字节) |
| `excludeDataUri` | boolean | false | 是否排除Base64图片 |
| `downloadImages` | boolean | false | 是否下载图片到本地 |
| `outputDir` | string | './images' | 图片保存目录 |
| `userAgent` | string | Chrome UA | 自定义User-Agent |

### 支持的图片类型

- **img-tag**: `<img>` 标签图片 (支持 src 和 srcset)
- **img-srcset**: `<img>` srcset 中的响应式图片
- **background-image**: CSS 背景图片 (支持多背景)
- **pseudo-background**: 伪元素的背景图片 (::before, ::after)
- **svg-image**: SVG 内嵌的 `<image>` 元素
- **svg-file**: 独立的 SVG 文件 (.svg)
- **svg-use**: SVG 内的 `<use>` 引用图标
- **picture-source**: `<picture>` 元素中的 `<source>`
- **video-poster**: 视频元素的封面图 (poster)
- **canvas-snapshot**: Canvas 快照
- **css-content**: CSS content 属性中的图片

### 输出格式

#### TXT 格式
```
https://example.com/image1.jpg (ALT: 示例图片) [img-tag]
https://example.com/image2.png [background-image]
```

#### JSON 格式
```json
[
  {
    "url": "https://example.com/image.jpg",
    "type": "img-tag",
    "alt": "示例图片",
    "width": 800,
    "height": 600,
    "visible": true,
    "crawledFrom": "https://example.com"
  }
]
```

#### CSV 格式
```csv
URL,Type,Element,Alt,Width,Height,Visible,CrawledFrom,CrawledAt
https://example.com/image.jpg,img-tag,img,示例图片,800,600,true,https://example.com,2024-01-01T12:00:00.000Z
```

## 🔧 高级功能

### 图片过滤

```bash
# 只抓取 JPEG 和 PNG 图片
image-crawler https://example.com --filter jpg,jpeg,png

# 排除小图片 (小于 5KB)
image-crawler https://example.com --min-size 5120

# 排除 Base64 图片，提高性能
image-crawler https://example.com --exclude-data-uri
```

### 性能优化

```bash
# 降低并发数，适合服务器资源有限的情况
image-crawler https://example.com -c 1

# 缩短超时时间，跳过加载缓慢的页面
image-crawler https://example.com -t 15

# 限制爬取深度，避免过度爬取
image-crawler https://example.com -d 1
```

### 调试模式

```bash
# 显示浏览器窗口，便于调试
image-crawler https://example.com --no-headless
```

## 📊 性能指标

- **并发控制**: 支持自定义并发数，避免服务器过载
- **内存优化**: 单页面处理完成后立即释放资源
- **去重机制**: 自动去除重复图片
- **错误恢复**: 单页面错误不影响整体爬取过程

## ⚠️ 注意事项

1. **遵守 robots.txt**: 使用前请检查目标网站的爬虫政策
2. **合理控制频率**: 避免对目标服务器造成过大压力
3. **版权问题**: 请遵守相关法律法规，尊重版权
4. **网络环境**: 某些网站可能需要代理或特殊配置

## 🛡️ 法律声明

本工具仅供学习和研究使用，用户在使用时应：

- 遵守目标网站的使用条款和robots.txt协议
- 不要用于商业用途或侵犯他人权益
- 合理控制爬取频率，避免对服务器造成压力
- 尊重版权，不要用于侵权用途

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [GitHub 仓库](https://github.com/dzqdzq/image-crawler)
- [NPM 包页面](https://www.npmjs.com/package/@dzqdzq/image-crawler)
- [问题反馈](https://github.com/dzqdzq/image-crawler/issues)

---

⭐ 如果这个工具对你有帮助，请给个 Star! 