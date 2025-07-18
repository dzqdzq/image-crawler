#!/usr/bin/env node

const { Command } = require('commander');
const crawlImages = require('../index');
const fs = require('fs').promises;
const path = require('path');

const program = new Command();

program
  .name('image-crawler')
  .description('强大的图片爬虫工具 - 一键下载网站所有图片')
  .version('2.0.0');

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

// 高级模式 - 为需要详细控制的用户保留
program
  .command('advanced')
  .description('高级模式 - 详细配置所有选项')
  .argument('<url>', '网站URL')
  .option('-d, --depth <number>', '最大爬取深度', '4')
  .option('-c, --concurrent <number>', '并发数', '4')
  .option('-o, --output <path>', '输出文件名', 'advanced-report.json')
  .option('-f, --format <type>', '输出格式 (json|csv|txt)', 'json')
  .option('-t, --timeout <number>', '页面超时时间(毫秒)', '30000')
  .option('--output-dir <path>', '图片下载目录', './images')
  .option('--no-download', '只收集URL，不下载图片')
  .option('--no-headless', '显示浏览器窗口')
  .option('--screenshot', '捕获页面截图')
  .option('--no-wait-images', '不等待图片加载')
  .option('--no-lazy-load', '不处理懒加载')
  .option('--no-backgrounds', '不包含CSS背景图片')
  .option('--hidden-images', '包含隐藏图片')
  .option('--filter <extensions>', '文件类型过滤 (用逗号分隔)', '')
  .option('--min-size <number>', '最小文件大小(字节)', '0')
  .option('--exclude-data-uri', '排除Base64图片')
  .option('--config <path>', '从JSON配置文件加载选项')
  .action(async (url, options) => {
    let config = {};
    
    // 从配置文件加载
    if (options.config) {
      try {
        const configFile = await fs.readFile(options.config, 'utf-8');
        config = JSON.parse(configFile);
        console.log(`📋 从配置文件加载选项: ${options.config}`);
      } catch (error) {
        console.error(`❌ 配置文件加载失败: ${error.message}`);
        process.exit(1);
      }
    }
    
    const crawlerOptions = {
      maxDepth: parseInt(options.depth),
      maxConcurrent: parseInt(options.concurrent),
      outputFile: options.output,
      outputFormat: options.format,
      timeout: parseInt(options.timeout),
      headless: options.headless,
      downloadImages: options.download,
      outputDir: options.outputDir,
      captureScreenshots: options.screenshot,
      waitForImages: options.waitImages,
      detectLazyLoad: options.lazyLoad,
      includeBackgrounds: options.backgrounds,
      includeHiddenImages: options.hiddenImages,
      minSize: parseInt(options.minSize),
      excludeDataUri: options.excludeDataUri,
      ...config
    };

    // 处理文件过滤器
    if (options.filter) {
      crawlerOptions.imageFilter = options.filter.split(',').map(ext => ext.trim());
    }

    console.log('🚀 启动高级图片爬虫');
    console.log(`📋 配置详情:`);
    console.log(JSON.stringify(crawlerOptions, null, 2));
    
    try {
      const result = await crawlImages(url, crawlerOptions);
      console.log('✨ 高级爬取完成');
      if (result.stats) {
        console.log(`📊 统计信息:`);
        console.log(JSON.stringify(result.stats, null, 2));
      }
    } catch (error) {
      console.error('❌ 高级爬取失败:', error.message);
      process.exit(1);
    }
  });


// 示例配置生成
program
  .command('init')
  .description('生成示例配置文件')
  .option('-o, --output <path>', '配置文件输出路径', 'crawler-config.json')
  .action(async (options) => {
    const exampleConfig = {
      maxDepth: 4,
      maxConcurrent: 4,
      timeout: 30000,
      downloadImages: true,
      captureScreenshots: false,
      waitForImages: true,
      detectLazyLoad: true,
      includeBackgrounds: true,
      includeHiddenImages: false,
      excludeDataUri: false,
      imageFilter: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      minSize: 1024
    };
    
    try {
      await fs.writeFile(options.output, JSON.stringify(exampleConfig, null, 2));
      console.log(`✅ 示例配置文件已生成: ${path.resolve(options.output)}`);
      console.log('📝 编辑此文件后可用于 advanced --config 选项');
    } catch (error) {
      console.error('❌ 配置文件生成失败:', error.message);
      process.exit(1);
    }
  });

// 帮助信息
program.addHelpText('afterAll', `

使用示例:
  
  基本使用 (推荐):
    image-crawler https://example.com                    # 下载到 ./images
    image-crawler https://example.com ./my-pics         # 下载到 ./my-pics
    image-crawler https://example.com --screenshot      # 同时保存截图
  
  高级控制:
    image-crawler advanced https://example.com --depth 5 --filter jpg,png
  
  配置文件:
    image-crawler init                                   # 生成配置模板
    image-crawler advanced https://example.com --config crawler-config.json

注意: 默认包含所有类型图片（包括Base64），深度为4层，使用无头浏览器模式
`);

program.parse(process.argv);
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
