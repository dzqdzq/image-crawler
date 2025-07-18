#!/usr/bin/env node

const { Command } = require('commander');
const crawlImages = require('../index');
const fs = require('fs').promises;
const path = require('path');
const { version } = require('../package.json');

const program = new Command();

program
  .name('image-crawler')
  .description('强大的图片爬虫工具 - 一键下载网站所有图片')
  .version(version);

// 主命令 - 超级简化版本
program
  .argument('<url>', '网站URL')
  .argument('[output-dir]', '图片保存目录', './images')
  .option('-d, --depth <number>', '爬取深度', '4')
  .option('--screenshot', '同时保存页面截图')
  .option('--no-headless', '显示浏览器窗口（调试用）')
  .option('-q, --quiet', '静默模式，减少输出信息')
  .action(async (url, outputDir, options) => {
    const startTime = Date.now();
    
    if (!options.quiet) {
      console.log('🚀 启动图片爬虫');
      console.log(`📋 目标网站: ${url}`);
      console.log(`📁 保存目录: ${outputDir}`);
      console.log(`📊 爬取深度: ${options.depth}`);
      if (options.screenshot) {
        console.log('📸 页面截图: 启用');
      }
      console.log('');
    }
    
    const crawlerOptions = {
      // 核心设置
      maxDepth: parseInt(options.depth),
      outputDir: outputDir,
      outputFile: 'crawler-report.json',
      
      // 固定的最佳实践设置
      downloadImages: true,           // 默认下载图片
      maxConcurrent: 4,              // 合理的并发数
      timeout: 30000,                // 30秒超时
      headless: options.headless,    // 默认无头模式
      outputFormat: 'json',          // JSON报告格式
      
      // 图片相关设置
      captureScreenshots: options.screenshot || false,
      waitForImages: true,           // 等待图片加载
      detectLazyLoad: true,          // 检测懒加载
      includeBackgrounds: true,      // 包含背景图片
      includeHiddenImages: false,    // 不包含隐藏图片
      excludeDataUri: false,         // 包含Base64图片
      minSize: 0,                    // 不限制文件大小
      imageFilter: null              // 不过滤文件类型
    };

    try {
      const result = await crawlImages(url, crawlerOptions);
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      if (!options.quiet) {
        console.log(`\n🎉 爬取完成！耗时 ${duration} 秒`);
        console.log(`✨ 成功下载 ${result.downloadedImages?.length || 0} 个图片`);
        if (result.failedDownloads?.length > 0) {
          console.log(`⚠️  下载失败 ${result.failedDownloads.length} 个图片`);
        }
        if (result.screenshots?.length > 0) {
          console.log(`📸 保存截图 ${result.screenshots.length} 个`);
        }
        
        const stats = result.stats || {};
        if (stats.totalSize) {
          console.log(`💾 总大小: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
        }
        
        console.log(`📂 文件保存在: ${path.resolve(outputDir)}`);
        console.log(`📄 详细报告: ${path.resolve(outputDir, 'crawler-report.json')}`);
      }
      
    } catch (error) {
      console.error('❌ 爬取失败:', error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });


// 帮助信息
program.addHelpText('afterAll', `

使用示例:
  
  基本使用 (推荐):
    image-crawler https://example.com  my-pics # 下载到 ./my-pics

注意: 默认包含所有类型图片（包括Base64），深度为4层，使用无头浏览器模式
`);

program.parse(process.argv);
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
