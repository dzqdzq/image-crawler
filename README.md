# 🕷️ Image Crawler

Advanced web image crawler tool - Deep crawling of all image resources on web pages

[English](README.md) | [中文](README.zh-CN.md)

## ✨ Features

- 📊 **Deep Crawling**: Recursively crawl sub-pages under the same domain with automatic URL deduplication
- 🎯 **Smart Detection**: Automatically identify and extract various image formats
- 🚀 **High Performance**: Multi-threaded concurrent processing for efficient crawling
- 🔧 **Flexible Configuration**: Customizable crawling depth, filters, and output options
- 💾 **Organized Storage**: Automatically organize downloaded images by domain and page structure

## 🛠️ Installation

### Install as CLI Tool

```bash
npx playwright install
npm install -g web-image-crawler
```

**Note**: 
- Playwright browser download package is about 300MB, please ensure stable network connection
- Supports multiple browser engines: Chrome/Chromium, Firefox, Safari(WebKit)
- Recommended to use lightweight mode, covering 90% of use cases without downloading browsers

## 📖 CLI Usage

### Basic Command

```bash
image-crawler <url> [options]
```

### Usage Examples

```bash
# Basic crawling
image-crawler https://example.com output_path

# Crawl with specific depth
image-crawler https://example.com output_path --depth 3

# Filter by image size
image-crawler https://example.com output_path --min-size 10000

# Use specific browser
image-crawler https://example.com output_path --browser firefox
```

### View Help

```bash
# View help information
image-crawler --help
```

## ⚙️ Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `--depth` | Maximum crawling depth | 2 |
| `--min-size` | Minimum image size (bytes) | 0 |
| `--max-size` | Maximum image size (bytes) | ∞ |
| `--browser` | Browser engine (chrome/firefox/safari) | chrome |
| `--timeout` | Page load timeout (ms) | 30000 |
| `--concurrency` | Number of concurrent requests | 5 |

## ⚠️ Important Notes

1. **Respect robots.txt**: Please check the target website's crawling policy before use
2. **Reasonable Frequency Control**: Avoid putting excessive pressure on target servers
3. **Copyright Issues**: Please comply with relevant laws and regulations, respect copyright
4. **Network Environment**: Some websites may require proxy or special configuration

## 🛡️ Legal Disclaimer

This tool is for learning and research purposes only. Users should:

- Comply with the target website's terms of use and robots.txt protocol
- Not use for commercial purposes or infringe on others' rights
- Reasonably control crawling frequency to avoid server pressure
- Respect copyright and not use for infringing purposes

## 🤝 Contributing

Welcome to submit Issues and Pull Requests!

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🔗 Related Links

- [GitHub Repository](https://github.com/dzqdzq/image-crawler)
- [NPM Package Page](https://www.npmjs.com/package/image-crawler2)
- [Issue Feedback](https://github.com/dzqdzq/image-crawler/issues)

---

⭐ If this tool helps you, please give it a Star! 