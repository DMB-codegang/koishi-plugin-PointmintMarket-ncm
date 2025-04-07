import { Context, Logger, h } from 'koishi'
import { MarketService, MarketItemRegisterOptions } from 'koishi-plugin-pointmintmarket'

import { Ncm } from './ncm'

import { Config } from './config'
export * from './config'

export const usage = `这是一个可以依赖于PointmintMarket的网易云音乐插件  
开启插件后会自动注册商品`


declare module 'koishi' {
  interface Context {
    market: MarketService
  }
}

export const name = 'pointmintmarket-ncm'
export const inject = ['market', 'http']

export function apply(ctx: Context, config: Config) {
  const logger = new Logger(ctx.name)
  const ncm = new Ncm(ctx, config, logger)
  // 在插件启动时注册示例商品
  ctx.on('ready', async () => {
    const cc = (await ncm.checkCookie(config.login_cookie))
    if (cc.code >= 300 || cc.code < 200) {
      logger.warn('cookie无效' + cc.msg)
    }
    await registerExampleItems()
  })

  ctx.on('dispose', async () => {
    ctx.market.unregisterItems(ctx.name)
  })

  // 注册示例商品
  async function registerExampleItems() {
    const Item: MarketItemRegisterOptions = {
      name: config.name,
      description: config.description,
      tags: config.tags,
      onPurchase: async (session) => {
        await session.send('请输入歌曲名或歌手')
        let songName = await session.prompt(config.waitTime)
        const searchResult = await ncm.search(songName, 1)
        if (searchResult.code >= 300 || searchResult.code < 200) {
          return { code: 500, msg: '搜索失败' }
        }
        let page = 1;
        const totalPages = Math.ceil(searchResult.result.length / config.max_songs_per_page);
        let songid: number;
        while (true) {
          const startIndex = (page - 1) * config.max_songs_per_page
          const endIndex = startIndex + config.max_songs_per_page;
          const pageSongs = searchResult.result.slice(startIndex, endIndex);
          let songsString = config.songListStyle;
          songsString = songsString.replace('{page}', page.toString());
          songsString = songsString.replace('{total}', totalPages.toString());
          // 构建当前页商品的字符串
          let songsList = '';
          for (let i = 0; i < pageSongs.length; i++) {
            let songString = config.songStyle;
            const currentIndex = startIndex + i;
            songString = songString.replace('{index}', (currentIndex + 1).toString());
            songString = songString.replace('{name}', searchResult.result[currentIndex].name);
            songString = songString.replace('{ar.name}', searchResult.result[currentIndex].arName);
            songString = songString.replace('{al.name}', searchResult.result[currentIndex].al.name);
            if (searchResult.result[currentIndex].al.picUrl !== null) songString = songString.replace('{al.pic}', `<img src="${searchResult.result[currentIndex].al.picUrl}?param=${config.picSize[0]}y${config.picSize[1]}"/>`);
            if (i !== pageSongs.length - 1) songString += '\n';
            songsList += songString;
          }
          songsString = songsString.replace('{songs}', songsList);
          await session.send(songsString);
          const input = await session.prompt(config.waitTime);
          // 解析用户输入
          // 如果是next、prev或exit就切换执行对应的操作
          // 如果是数字就查看当前页面是否有这首歌，有就设置songid并退出当前循环
          if (input === 'next') {
            if (page < totalPages) {
              page++;
            } else {
              await session.send('已经是最后一页了');
            }
          } else if (input === 'prev') {
            if (page > 1) {
              page--;
            } else {
              await session.send('已经是第一页了');
            }
          } else if (input === 'exit' || input === 'cancel' || input === 'quit' || input == null) {
            await session.send('已退出');
            return { code: 400, msg: '兑换未完成：用户取消' }
          } else {
            const songIndex = parseInt(input);
            if (!isNaN(songIndex) && songIndex >= 1 && songIndex <= searchResult.result.length) {
              songid = searchResult.result[songIndex - 1].id;
              break;
            } else {
              await session.send('输入无效，请重新输入');
            }
          }
        }
        const songUrl = await ncm.getSongUrl(songid)
        if (songUrl.code >= 300 || songUrl.code < 200) {
          return { code: 500, msg: '获取歌曲链接失败' }
        }
        const songlevel = await ncm.levelToString(songUrl.data.level)
        if (config.outputMode.includes('songinfo')) await session.send(`音频等级：${songlevel}\n码率：${songUrl.data.br/1000}kbps\n大小：${songUrl.data.size/1000}kb`)
        if (config.outputMode.includes('audio')) session.send(`<audio src="${songUrl.data.url}"/>`)
        const songInfo = await ncm.getSongInfo(songid.toString())
        if (config.outputMode.includes('voice')) {
          let fileType = ''
          if (config.quality == 'standard' || config.quality == 'higher' || config.quality == 'exhigh') {
            fileType = 'mp3'
          } else {
            fileType = 'flac'
          }
          session.send(`<file title="${songInfo.data.name}-${songInfo.data.ar[0].name}.${fileType}" src="${songUrl.data.url}" poster="${songInfo.data.al.picUrl}"/>`);
        }
        if (config.outputMode.includes('mv')) {
          if (songInfo.code == 200){
            if (songInfo.data.mvId != 0) {
              console.log(songInfo)
              const mvUrl = await ncm.getMVUrl(songInfo.data.mv)
              if (mvUrl.code == 200) {
                await session.send(`<video src="${mvUrl.data}"/>`)
              } else {
                await session.send('获取MV链接失败')
              }
            } else {
              await session.send('该歌曲无MV')
            }
          }
        }
        return true
      }
    }
    ctx.market.registerItem(ctx.name, Item)
  }
}