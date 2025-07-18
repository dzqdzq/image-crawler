#!/usr/bin/env node

const { Command } = require('commander');
const crawlImages = require('../index.js');
const fs = require('fs').promises;
const path = require('path');

const program = new Command();

program
  .name('image-crawler')
  .description('强大的图片爬虫工具 - 基于 Playwright 浏览器引擎')
  .version('2.0.0');

program
  .argument('<url>', '起始URL')
  .option('-d, --depth <number>', '最大爬取深度', '3')
  .option('-c, --concurrent <number>', '并发数', '3')
  .option('-o, --output <path>', '输出文件路径', 'images_report.json')
  .option('-f, --format <type>', '输出格式 (json|csv|txt)', 'json')
  .option('-t, --timeout <number>', '页面超时时间(毫秒)', '30000')
  .option('--download', '下载图片到本地')
  .option('--output-dir <path>', '图片下载目录', './images')
  .option('--headless', '无头模式运行', true)
  .option('--no-headless', '显示浏览器窗口')
  .option('--screenshot', '捕获页面截图')
  .option('--wait-images', '等待图片加载完成', true)
  .option('--no-wait-images', '不等待图片加载')
  .option('--lazy-load', '检测并触发懒加载', true)
  .option('--no-lazy-load', '不处理懒加载')
  .option('--backgrounds', '包含CSS背景图片', true)
  .option('--no-backgrounds', '不包含CSS背景图片')
  .option('--hidden-images', '包含隐藏图片')
  .option('--filter <extensions>', '文件类型过滤 (用逗号分隔)', '')
  .option('--min-size <number>', '最小文件大小(字节)', '0')
  .option('--exclude-data-uri', '排除Base64图片')
  .action(async (url, options) => {
    console.log('🚀 启动强大图片爬虫');
    console.log(`📋 目标URL: ${url}`);
    console.log(`📋 最大深度: ${options.depth}`);
    console.log(`📋 并发数: ${options.concurrent}`);
    console.log(`📋 输出格式: ${options.format}`);
    
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
      excludeDataUri: options.excludeDataUri
    };

    // 处理文件过滤器
    if (options.filter) {
      crawlerOptions.imageFilter = options.filter.split(',').map(ext => ext.trim());
    }

    // 显示配置
    console.log('\n🔧 爬虫配置:');
    console.log(`- 浏览器模式: ${crawlerOptions.headless ? '无头' : '可视'}`);
    console.log(`- 超时设置: ${crawlerOptions.timeout}ms`);
    console.log(`- 等待图片: ${crawlerOptions.waitForImages ? '是' : '否'}`);
    console.log(`- 懒加载检测: ${crawlerOptions.detectLazyLoad ? '是' : '否'}`);
    console.log(`- 背景图片: ${crawlerOptions.includeBackgrounds ? '是' : '否'}`);
    console.log(`- 隐藏图片: ${crawlerOptions.includeHiddenImages ? '是' : '否'}`);
    console.log(`- 页面截图: ${crawlerOptions.captureScreenshots ? '是' : '否'}`);
    if (crawlerOptions.downloadImages) {
      console.log(`- 下载模式: 启用 -> ${crawlerOptions.outputDir}`);
    }
    if (crawlerOptions.imageFilter) {
      console.log(`- 文件过滤: ${crawlerOptions.imageFilter.join(', ')}`);
    }
    
    try {
      const startTime = Date.now();
      const result = await crawlImages(url, crawlerOptions);
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`\n⏱️ 爬取完成，耗时 ${duration} 秒`);
      
      if (crawlerOptions.downloadImages) {
        console.log(`✨ 成功下载 ${result.downloadedImages.length} 个图片`);
        if (result.screenshots && result.screenshots.length > 0) {
          console.log(`📸 保存 ${result.screenshots.length} 个页面截图`);
        }
      } else {
        console.log(`✨ 发现 ${result.images.length} 个图片资源`);
        if (result.screenshots && result.screenshots.length > 0) {
          console.log(`📸 保存 ${result.screenshots.length} 个页面截图`);
        }
      }
      
      console.log(`📄 详细报告: ${path.resolve(options.output)}`);
      
    } catch (error) {
      console.error('❌ 爬取失败:', error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// 高级选项子命令
program
  .command('advanced')
  .description('高级模式 - 更多自定义选项')
  .argument('<url>', '起始URL')
  .option('--config <path>', '从JSON配置文件加载选项')
  .option('--user-agent <string>', '自定义User-Agent')
  .option('--viewport-width <number>', '浏览器视口宽度', '1920')
  .option('--viewport-height <number>', '浏览器视口高度', '1080')
  .option('--wait-timeout <number>', '等待元素超时时间', '15000')
  .option('--scroll-delay <number>', '懒加载滚动延迟', '2000')
  .option('--retry-count <number>', '失败重试次数', '3')
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
    
    // 合并选项
    const crawlerOptions = {
      maxDepth: 4,
      maxConcurrent: 3,
      outputFile: 'advanced_report.json',
      outputFormat: 'json',
      timeout: 30000,
      headless: true,
      downloadImages: true,
      outputDir: './images',
      captureScreenshots: true,
      waitForImages: true,
      detectLazyLoad: true,
      includeBackgrounds: true,
      includeHiddenImages: false,
      ...config,
      userAgent: options.userAgent || config.userAgent
    };
    
    console.log('🚀 启动高级图片爬虫');
    console.log(`📋 配置: ${JSON.stringify(crawlerOptions, null, 2)}`);
    
    try {
      const result = await crawlImages(url, crawlerOptions);
      console.log('✨ 高级爬取完成');
      console.log(`📊 统计: ${JSON.stringify(result.stats || {}, null, 2)}`);
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
      maxConcurrent: 3,
      timeout: 30000,
      headless: true,
      downloadImages: true,
      outputDir: './images',
      captureScreenshots: true,
      waitForImages: true,
      detectLazyLoad: true,
      includeBackgrounds: true,
      includeHiddenImages: false,
      imageFilter: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      minSize: 1024,
      excludeDataUri: false,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    };
    
    try {
      await fs.writeFile(options.output, JSON.stringify(exampleConfig, null, 2));
      console.log(`✅ 示例配置文件已生成: ${path.resolve(options.output)}`);
      console.log('📝 你可以编辑此文件并使用 --config 选项加载');
    } catch (error) {
      console.error('❌ 配置文件生成失败:', error.message);
      process.exit(1);
    }
  });

// 错误处理
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => cmd.name() + ' ' + cmd.usage()
});

program.parse(process.argv);

// 如果没有提供参数，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
