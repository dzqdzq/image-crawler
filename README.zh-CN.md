# 🕷️ Image Crawler

高级网站图片爬虫工具 - 深度抓取网页中的所有图片资源

[English](README.md) | [中文](README.zh-CN.md)

## ✨ 特性

- 📊 **深度爬取**: 递归爬取同域名下的子页面，自动URL去重


## 🛠️ 安装

### 作为 CLI 工具安装

```bash
npx playwright install
npm install -g web-image-crawler
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

### 使用示例

```bash
image-crawler https://example.com output_path
```

### 查看帮助

```bash
# 查看帮助信息
image-crawler --help
```

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


## 🖼️ 图片浏览器

抓取完图片后，您可以使用图片浏览器来查看和管理下载的图片：

**🌐 图片浏览器地址**: https://image-browser.aqiegames.com/

图片浏览器提供了现代化的网页界面，方便您浏览、搜索和组织抓取的图片。

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

⭐ 如果这个工具对你有帮助，请给个 Star! 