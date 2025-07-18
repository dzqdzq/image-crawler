const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { PlaywrightCrawler } = require('crawlee');
const axios = require('axios');

/**
 * 强大的图片爬虫 - 基于 Playwright 浏览器引擎
 * 支持动态内容渲染、JavaScript执行、复杂交互
 */
async function crawlImages(startUrl, options = {}) {
  const {
    maxDepth = 4,
    outputFile = 'images_report.json',
    outputFormat = 'json',
    maxConcurrent = 3,
    timeout = 30000,
    headless = true,
    imageFilter = null,
    minSize = 0,
    excludeDataUri = false,
    downloadImages = false,
    outputDir = './images',
    userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    waitForImages = true,
    captureScreenshots = false,
    detectLazyLoad = true,
    includeBackgrounds = true,
    includeHiddenImages = false
  } = options;

  // 创建结果收集器
  const downloadedImages = [];
  const failedDownloads = [];
  const imageUrls = new Set();
  const screenshotUrls = [];

  // 确保输出目录存在
  if (downloadImages || captureScreenshots) {
    await fs.mkdir(outputDir, { recursive: true });
    if (captureScreenshots) {
      await fs.mkdir(path.join(outputDir, 'screenshots'), { recursive: true });
    }
  }

  // 设置Crawlee存储目录到用户指定的输出目录中
  const crawleeStorageDir = path.join(outputDir, '.crawlee-storage');
  process.env.CRAWLEE_STORAGE_DIR = crawleeStorageDir;

  console.log(`🚀 启动强大图片爬虫 (Playwright Browser 模式)`);
  console.log(`📋 配置: maxDepth=${maxDepth}, 并发=${maxConcurrent}, 超时=${timeout}ms`);
  console.log(`🎯 目标: ${startUrl}`);
  console.log(`📁 输出目录: ${outputDir}`);

  // 创建PlaywrightCrawler实例
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 1000,
    maxConcurrency: maxConcurrent,
    requestHandlerTimeoutSecs: Math.max(timeout / 1000, 60),
    
    // Playwright配置
    launchContext: {
      launchOptions: {
        headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-blink-features=AutomationControlled',
          `--user-agent=${userAgent}`
        ]
      }
    },

    // 预处理钩子
    preNavigationHooks: [
      async ({ page }) => {
        // 设置用户代理
        await page.setExtraHTTPHeaders({
          'User-Agent': userAgent
        });
        
        // 设置视口大小
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // 设置超时
        page.setDefaultTimeout(timeout);
        
        // 阻止不必要的资源加载以提高性能
        await page.route('**/*', (route) => {
          const resourceType = route.request().resourceType();
          if (['font', 'media'].includes(resourceType)) {
            route.abort();
          } else {
            route.continue();
          }
        });

        // 注入懒加载检测脚本
        if (detectLazyLoad) {
          await page.addInitScript(() => {
            // 触发懒加载
            window.triggerLazyLoad = () => {
              // 滚动页面触发懒加载
              window.scrollTo(0, document.body.scrollHeight);
              
              // 触发intersection observer
              const images = document.querySelectorAll('img[data-src], img[data-lazy], img[loading="lazy"]');
              images.forEach(img => {
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                }
                if (img.dataset.lazy) {
                  img.src = img.dataset.lazy;
                }
              });
            };
          });
        }
      }
    ],

    // 主处理函数
    requestHandler: async ({ request, page, log, enqueueLinks }) => {
      const currentDepth = request.userData.depth || 1;
      const currentUrl = request.url;
      
      log.info(`[${currentDepth}/${maxDepth}] 🎭 Playwright爬取: ${currentUrl}`);

      try {
        // 等待页面加载完成
        await page.waitForLoadState('networkidle', { timeout });
        
        // 等待图片加载
        if (waitForImages) {
          await page.waitForFunction(() => {
            const images = Array.from(document.querySelectorAll('img'));
            return images.every(img => img.complete || img.naturalWidth > 0);
          }, { timeout: 15000 }).catch(() => {
            log.warning('部分图片未完全加载');
          });
        }

        // 触发懒加载
        if (detectLazyLoad) {
          await page.evaluate(() => {
            if (window.triggerLazyLoad) {
              window.triggerLazyLoad();
            }
          });
          
          // 等待懒加载图片
          await page.waitForTimeout(2000);
        }

        // 页面截图
        if (captureScreenshots) {
          const screenshotPath = path.join(outputDir, 'screenshots', `${Date.now()}_${currentDepth}.png`);
          await page.screenshot({ 
            path: screenshotPath, 
            fullPage: true,
            type: 'png'
          });
          screenshotUrls.push({
            url: currentUrl,
            screenshotPath,
            depth: currentDepth,
            timestamp: new Date().toISOString()
          });
          log.info(`📸 页面截图已保存: ${screenshotPath}`);
        }

        // 在浏览器中执行图片提取
        const pageImages = await page.evaluate((options) => {
          const images = [];
          const { includeBackgrounds, includeHiddenImages } = options;

          // 1. 提取 <img> 标签 (包括srcset和懒加载)
          document.querySelectorAll('img').forEach(img => {
            const rect = img.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            
            if (!includeHiddenImages && !isVisible) return;

            // 主要src
            if (img.src && img.src !== window.location.href) {
              images.push({
                url: img.src,
                type: 'img-tag',
                element: 'img',
                alt: img.alt || '',
                title: img.title || '',
                width: img.naturalWidth || rect.width,
                height: img.naturalHeight || rect.height,
                visible: isVisible,
                loading: img.loading || 'eager',
                className: img.className,
                id: img.id
              });
            }

            // 处理 srcset
            if (img.srcset) {
              const srcsetUrls = img.srcset.split(',').map(src => src.trim().split(' ')[0]);
              srcsetUrls.forEach(srcUrl => {
                if (srcUrl && srcUrl !== img.src) {
                  images.push({
                    url: srcUrl,
                    type: 'img-srcset',
                    element: 'img',
                    alt: img.alt || '',
                    title: img.title || '',
                    width: img.naturalWidth || rect.width,
                    height: img.naturalHeight || rect.height,
                    visible: isVisible,
                    srcsetSource: true
                  });
                }
              });
            }

            // 懒加载属性
            ['data-src', 'data-lazy', 'data-original', 'data-echo'].forEach(attr => {
              const lazySrc = img.getAttribute(attr);
              if (lazySrc && lazySrc !== img.src) {
                images.push({
                  url: lazySrc,
                  type: 'img-lazy',
                  element: 'img',
                  alt: img.alt || '',
                  title: img.title || '',
                  width: img.naturalWidth || rect.width,
                  height: img.naturalHeight || rect.height,
                  visible: isVisible,
                  lazyLoadAttr: attr
                });
              }
            });
          });

          // 2. 提取 CSS background-image (包括伪元素)
          if (includeBackgrounds) {
            document.querySelectorAll('*').forEach(el => {
              const rect = el.getBoundingClientRect();
              const isVisible = rect.width > 0 && rect.height > 0;
              
              if (!includeHiddenImages && !isVisible) return;

              const style = window.getComputedStyle(el);
              const bgImage = style.getPropertyValue('background-image');
              
              if (bgImage && bgImage !== 'none') {
                const urlMatches = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/g);
                if (urlMatches) {
                  urlMatches.forEach(match => {
                    const urlMatch = match.match(/url\(['"]?([^'"]+)['"]?\)/);
                    if (urlMatch && urlMatch[1]) {
                      images.push({
                        url: urlMatch[1],
                        type: 'background-image',
                        element: el.tagName.toLowerCase(),
                        selector: getElementSelector(el),
                        width: rect.width,
                        height: rect.height,
                        visible: isVisible,
                        className: el.className,
                        id: el.id
                      });
                    }
                  });
                }

                // 检查伪元素背景
                ['::before', '::after'].forEach(pseudo => {
                  try {
                    const pseudoStyle = window.getComputedStyle(el, pseudo);
                    const pseudoBgImage = pseudoStyle.getPropertyValue('background-image');
                    if (pseudoBgImage && pseudoBgImage !== 'none') {
                      const urlMatch = pseudoBgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
                      if (urlMatch && urlMatch[1]) {
                        images.push({
                          url: urlMatch[1],
                          type: 'pseudo-background',
                          element: el.tagName.toLowerCase() + pseudo,
                          selector: getElementSelector(el) + pseudo,
                          width: 0,
                          height: 0,
                          visible: false,
                          pseudoElement: pseudo
                        });
                      }
                    }
                  } catch (e) {
                    // 忽略伪元素错误
                  }
                });
              }
            });
          }

          // 3. 提取其他类型图片
          const selectors = [
            'svg image[href], svg image[xlink\\:href]',
            'picture source[srcset]',
            'video[poster]',
            'canvas',
            'embed[src]',
            'object[data]',
            'link[rel*="icon"]'
          ];

          selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
              const tagName = el.tagName.toLowerCase();
              let imageUrl = null;
              let imageType = 'unknown';

              if (tagName === 'image') {
                imageUrl = el.getAttribute('href') || el.getAttribute('xlink:href');
                imageType = 'svg-image';
              } else if (tagName === 'source') {
                const srcset = el.getAttribute('srcset');
                if (srcset) {
                  const urls = srcset.split(',').map(src => src.trim().split(' ')[0]);
                  urls.forEach(url => {
                    if (url) {
                      images.push({
                        url,
                        type: 'picture-source',
                        element: 'picture source',
                        media: el.getAttribute('media') || '',
                        width: 0,
                        height: 0,
                        visible: true
                      });
                    }
                  });
                }
                return;
              } else if (tagName === 'video') {
                imageUrl = el.getAttribute('poster');
                imageType = 'video-poster';
              } else if (tagName === 'canvas') {
                try {
                  if (el.width > 0 && el.height > 0) {
                    imageUrl = el.toDataURL('image/png');
                    imageType = 'canvas-snapshot';
                  }
                } catch (e) {
                  console.warn('无法访问canvas:', e.message);
                }
              } else if (tagName === 'embed' || tagName === 'object') {
                imageUrl = el.getAttribute('src') || el.getAttribute('data');
                imageType = 'embed-object';
              } else if (tagName === 'link') {
                imageUrl = el.getAttribute('href');
                imageType = 'favicon';
              }

              if (imageUrl) {
                const rect = el.getBoundingClientRect();
                images.push({
                  url: imageUrl,
                  type: imageType,
                  element: tagName,
                  width: rect.width || el.width || 0,
                  height: rect.height || el.height || 0,
                  visible: rect.width > 0 && rect.height > 0,
                  rel: el.getAttribute('rel') || '',
                  media: el.getAttribute('media') || ''
                });
              }
            });
          });

          // 辅助函数
          function getElementSelector(el) {
            if (!el || el.nodeType !== 1) return '';
            if (el.id) return `#${el.id}`;
            
            const parts = [];
            let ancestor = el;
            while (ancestor && ancestor !== document.body) {
              let selector = ancestor.tagName.toLowerCase();
              if (ancestor.className) {
                const classes = ancestor.className.trim().split(/\s+/).filter(c => c);
                if (classes.length > 0) {
                  selector += `.${classes.slice(0, 2).join('.')}`;
                }
              }
              parts.unshift(selector);
              ancestor = ancestor.parentElement;
              if (parts.length >= 3) break;
            }
            return parts.join(' > ');
          }

          // 处理相对URL
          return images
            .filter(img => img.url)
            .map(img => {
              if (img.url.startsWith('data:')) {
                return { 
                  ...img, 
                  isDataUri: true,
                  fileSize: Math.round(img.url.length * 0.75)
                };
              }
              
              try {
                const absoluteUrl = new URL(img.url, window.location.href).href;
                return { ...img, url: absoluteUrl, isDataUri: false };
              } catch (e) {
                console.warn('无效URL:', img.url);
                return null;
              }
            })
            .filter(Boolean);
        }, { includeBackgrounds, includeHiddenImages });

        // 应用过滤条件
        const filteredImages = pageImages.filter(img => {
          if (excludeDataUri && img.isDataUri) return false;
          
          if (imageFilter && imageFilter.length > 0) {
            const fileExtension = getFileExtension(img.url);
            if (!imageFilter.includes(fileExtension)) return false;
          }
          
          if (img.isDataUri && img.fileSize < minSize) return false;
          if (img.width && img.height && (img.width * img.height) < minSize) return false;
          
          return true;
        });

        // 下载图片或收集URL
        if (downloadImages) {
          for (const img of filteredImages) {
            try {
              const downloadResult = await downloadImage(img, outputDir, currentUrl);
              if (downloadResult.success) {
                downloadedImages.push(downloadResult);
                log.info(`  ✅ 下载成功: ${downloadResult.filename}`);
              } else {
                failedDownloads.push({ ...img, error: downloadResult.error });
                log.warning(`  ❌ 下载失败: ${img.url} - ${downloadResult.error}`);
              }
            } catch (error) {
              failedDownloads.push({ ...img, error: error.message });
              log.error(`  ❌ 下载失败: ${img.url} - ${error.message}`);
            }
          }
        } else {
          filteredImages.forEach(img => {
            imageUrls.add(JSON.stringify({
              ...img,
              crawledFrom: currentUrl,
              crawledAt: new Date().toISOString(),
              depth: currentDepth
            }));
          });
        }

        log.info(`  📸 找到 ${filteredImages.length} 个图片`);

        // 继续爬取子页面
        if (currentDepth < maxDepth) {
          await enqueueLinks({
            selector: 'a[href]',
            limit: 20,
            userData: { depth: currentDepth + 1 },
            transformRequestFunction: (req) => {
              const startOrigin = new URL(startUrl).origin;
              const reqOrigin = new URL(req.url).origin;
              if (reqOrigin !== startOrigin) {
                return false;
              }
              return req;
            }
          });
        }

      } catch (error) {
        log.error(`处理页面时出错: ${error.message}`);
      }
    },

    failedRequestHandler: async ({ request, log }) => {
      log.error(`请求失败: ${request.url}`);
    },
  });

  // 辅助函数
  function getFileExtension(url) {
    if (url.startsWith('data:image/')) {
      const match = url.match(/data:image\/([^;]+)/);
      return match ? match[1] : '';
    }
    const match = url.match(/\.([^.?#]+)(?:\?|#|$)/);
    return match ? match[1].toLowerCase() : '';
  }

  async function downloadImage(imageInfo, outputDir, pageUrl) {
    try {
      if (imageInfo.isDataUri) {
        return await saveBase64Image(imageInfo, outputDir);
      } else {
        return await downloadUrlImage(imageInfo, outputDir, pageUrl);
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async function saveBase64Image(imageInfo, outputDir) {
    try {
      const matches = imageInfo.url.match(/^data:image\/([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('无效的Base64图片格式');
      }

      const [, mimeType, base64Data] = matches;
      const extension = mimeType || 'png';
      const hash = crypto.createHash('md5').update(base64Data).digest('hex');
      const filename = `base64_${hash}.${extension}`;
      const filepath = path.join(outputDir, filename);

      try {
        await fs.access(filepath);
        return { success: true, filename, filepath, skipped: true };
      } catch {
        const buffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(filepath, buffer);
        return {
          success: true,
          filename,
          filepath,
          size: buffer.length,
          type: imageInfo.type,
          skipped: false
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async function downloadUrlImage(imageInfo, outputDir, pageUrl) {
    try {
      const imageUrl = imageInfo.url;
      const urlObj = new URL(imageUrl);
      let pathname = urlObj.pathname;
      
      if (pathname.endsWith('/') || !path.extname(pathname)) {
        const ext = getFileExtension(imageUrl) || 'png';
        pathname = pathname.replace(/\/$/, '') + `.${ext}`;
      }
      
      pathname = pathname.replace(/^\//, '');
      const filename = pathname;
      const filepath = path.join(outputDir, filename);

      try {
        await fs.access(filepath);
        return { success: true, filename, filepath, skipped: true };
      } catch {
        const dir = path.dirname(filepath);
        await fs.mkdir(dir, { recursive: true });

        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': userAgent,
            'Referer': pageUrl
          }
        });

        const writer = require('fs').createWriteStream(filepath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        const stats = await fs.stat(filepath);
        return {
          success: true,
          filename,
          filepath,
          size: stats.size,
          type: imageInfo.type,
          contentType: response.headers['content-type'],
          skipped: false
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 启动爬虫
  await crawler.run([{ url: startUrl, userData: { depth: 1 } }]);

  // 生成结果
  if (downloadImages) {
    console.log(`\n✅ 图片下载完成! 成功下载 ${downloadedImages.length} 个图片`);
    if (failedDownloads.length > 0) {
      console.log(`❌ 下载失败 ${failedDownloads.length} 个图片`);
    }
    if (screenshotUrls.length > 0) {
      console.log(`📸 页面截图 ${screenshotUrls.length} 个`);
    }

    const downloadStats = {
      total: downloadedImages.length + failedDownloads.length,
      success: downloadedImages.length,
      failed: failedDownloads.length,
      skipped: downloadedImages.filter(img => img.skipped).length,
      totalSize: downloadedImages.reduce((sum, img) => sum + (img.size || 0), 0),
      screenshots: screenshotUrls.length
    };

    console.log('\n📊 下载统计:');
    console.log(`- 总计: ${downloadStats.total}`);
    console.log(`- 成功: ${downloadStats.success}`);
    console.log(`- 失败: ${downloadStats.failed}`);
    console.log(`- 跳过(已存在): ${downloadStats.skipped}`);
    console.log(`- 总大小: ${(downloadStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    if (downloadStats.screenshots > 0) {
      console.log(`- 页面截图: ${downloadStats.screenshots}`);
    }

    if (outputFile) {
      const report = {
        crawledUrl: startUrl,
        crawledAt: new Date().toISOString(),
        mode: 'playwright-browser',
        config: {
          maxDepth,
          maxConcurrent,
          timeout,
          headless,
          waitForImages,
          captureScreenshots,
          detectLazyLoad,
          includeBackgrounds,
          includeHiddenImages
        },
        stats: downloadStats,
        downloadedImages: downloadedImages.map(img => ({
          filename: img.filename,
          size: img.size,
          type: img.type,
          contentType: img.contentType
        })),
        failedDownloads: failedDownloads.map(img => ({
          url: img.url,
          type: img.type,
          error: img.error
        })),
        screenshots: screenshotUrls
      };

      // 将报告文件保存到输出目录中
      const reportPath = path.join(outputDir, outputFile);
      await saveResults([report], reportPath, 'json');
      console.log(`\n📄 爬取报告已保存到: ${path.resolve(reportPath)}`);
    }

    return { downloadedImages, failedDownloads, stats: downloadStats, screenshots: screenshotUrls };
  } else {
    const uniqueImages = Array.from(imageUrls).map(JSON.parse);
    console.log(`\n✅ 图片爬取完成! 共找到 ${uniqueImages.length} 个唯一图片`);

    const typeCounts = uniqueImages.reduce((acc, img) => {
      acc[img.type] = (acc[img.type] || 0) + 1;
      return acc;
    }, {});
    console.log('📊 图片类型统计:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`- ${type}: ${count}`);
    });

    if (screenshotUrls.length > 0) {
      console.log(`📸 页面截图: ${screenshotUrls.length} 个`);
    }

    // 在下载模式下，报告文件也保存到输出目录中
    let finalOutputPath = outputFile;
    if (downloadImages || captureScreenshots) {
      // 确保输出目录存在
      await fs.mkdir(outputDir, { recursive: true });
      finalOutputPath = path.join(outputDir, outputFile);
    }
    
    await saveResults(uniqueImages, finalOutputPath, outputFormat);
    console.log(`\n📄 结果已保存到: ${path.resolve(finalOutputPath)}`);

    return { images: uniqueImages, screenshots: screenshotUrls };
  }
}

// 保存结果函数
async function saveResults(images, outputFile, format) {
  let content;
  
  switch (format.toLowerCase()) {
    case 'json':
      content = JSON.stringify(images, null, 2);
      break;
    case 'csv':
      const headers = 'URL,Type,Element,Alt,Width,Height,Visible,CrawledFrom,CrawledAt,Depth\n';
      const rows = images.map(img => 
        `"${img.url}","${img.type}","${img.element}","${img.alt || ''}","${img.width || ''}","${img.height || ''}","${img.visible}","${img.crawledFrom}","${img.crawledAt}","${img.depth}"`
      ).join('\n');
      content = headers + rows;
      break;
    case 'txt':
    default:
      content = images.map(img => 
        `${img.url}${img.alt ? ` (ALT: ${img.alt})` : ''} [${img.type}] [D:${img.depth}]`
      ).join('\n');
      break;
  }
  
  await fs.writeFile(outputFile, content, 'utf-8');
}

// 导出函数
module.exports = crawlImages;

// 如果直接运行此文件，执行命令行模式
if (require.main === module) {
  (async () => {
    const startUrl = 'https://eazegames.com/solitaire';
    const maxDepth = 4;
    const outputDir = './downloaded_images';

    console.log(`🚀 开始强大图片爬取 ${startUrl} (最大深度: ${maxDepth})`);
    
    // 使用强大的浏览器模式
    await crawlImages(startUrl, { 
      maxDepth, 
      outputFile: 'playwright_report11.json', 
      downloadImages: true, 
      outputDir,
      captureScreenshots: true,
      detectLazyLoad: true,
      waitForImages: true,
      includeBackgrounds: true,
      includeHiddenImages: false
    });
  })();
}
