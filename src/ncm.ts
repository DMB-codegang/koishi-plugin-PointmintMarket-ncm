import { Context, Logger } from 'koishi'
import { Config } from './config'
import { NcmSearchList, NcmSongInfo } from './types/ncm'

import { user_account, user_binding, cloudsearch, song_detail, song_url_v1, mv_url, mv_detail, vip_info_v2 } from 'netease-cloud-music-api-alger'

export class Ncm {
    constructor(private ctx: Context, private cfg: Config, private logger: Logger) {
        this.ctx = ctx
        this.cfg = cfg
        this.logger = new Logger(ctx.name)
    }

    // 200: 正常，203：cookie对应的手机号与配置的手机号不一致，400：cookie为空或无效或为游客cookie
    async checkCookie(cookie: string): Promise<{ code: number, msg: string }> {
        const userAccount = await (await user_account({ cookie: cookie })).body as any
        // console.log(JSON.stringify(await vip_info_v2({ uid: userAccount.account.id, cookie: cookie }),null,2))
        if (!cookie || userAccount.account === null || userAccount.profile === null || this.cfg.loginType == 'anonimous') {
            return { code: 400, msg: 'Cookie为空或无效或为游客cookie' }
        } else {
            const userVipInfo = (await vip_info_v2({ uid: userAccount.account.id, cookie: cookie })).body.data as any
            const expireDate = new Date(userVipInfo.musicPackage.expireTime).toLocaleDateString('zh-CN')
            this.logger.info(`Cookie有效，用户昵称： ${userAccount.profile.nickname || '未知'}，歌曲包会员等级：${userVipInfo.musicPackage.vipLevel}(${expireDate}过期)`)
            const bindingRes = await user_binding({ uid: userAccount.account.id, cookie: cookie })
            const tokenJson = JSON.parse(bindingRes.body.bindings[0].tokenJsonStr)
            const cellphone = tokenJson.cellphone
            this.logger.info(`当前账号的手机号: ${cellphone}`)
            if (cellphone !== this.cfg.login_phone && this.cfg.loginType == 'phone') {
                return { code: 203, msg: 'Cookie对应的手机号与配置的手机号不一致' }
            }
            return { code: 200, msg: 'Cookie有效' }
        }
    }

    async search(keyword: string, searchType: number): Promise<NcmSearchList> {
        try {
            const row = await cloudsearch({
                keywords: keyword,
                limit: this.cfg.max_search_num,
                type: searchType,
                cookie: this.cfg.login_cookie
            })
            let result: NcmSongInfo[] = [];
            for (const song of (row.body.result as any).songs) {
                const childSong: NcmSongInfo = {
                    id: song.id,
                    name: song.name,
                    arName: (song.ar || []).map(artist => artist.name).join('/'),  // 处理多个艺术家
                    al: {
                        id: song.al?.id || null,
                        name: song.al?.name || '未知专辑',
                        picUrl: song.al?.picUrl || null
                    }
                };
                result.push(childSong);
            }
            return { code: 200, msg: 'Success', result: result };
        } catch (error) {
            this.logger.error(error);
            return { code: 500, msg: error.message };
        }
    }

    async getSongInfo(musicID: string): Promise<{ code: number, data: any }> {
        try {
            const result = await song_detail({
                ids: musicID,
                cookie: this.cfg.login_cookie
            }) 
            if (result.body.code < 200 || result.body.code > 299) {
                return { code: 500, data: '获取失败' } 
            }
            return { code: 200, data: result.body.songs[0] as any }
        } catch (error) {
            this.logger.error(error);
            return { code: 500, data: error.message };
        }
    }

    async getSongUrl(id: number): Promise<{ code: number, data: any }> {
        try {
            const result = await song_url_v1({
                id: id,
                cookie: this.cfg.login_cookie,
                level: this.cfg.quality as any
            })
            if (!result.body.data[0].url) {
                return { code: 500, data: '获取失败' }
            }
            return { code: 200, data: result.body.data[0] }
        } catch (error) {
            this.logger.error(error);
            return { code: 500, data: error.message };
        }

    }

    async getMVUrl(mvid: number): Promise<{ code: number, data: any }> {
        try {
            const result = await mv_url({
                id: mvid,
                cookie: this.cfg.login_cookie
            }) as any
            if (result.body.code < 200 || result.body.code > 299) {
                return { code: 500, data: '获取失败' }
            }
            return { code: 200, data: result.body.data.url as string }
        } catch (error) {
            this.logger.error(error);
            return { code: 500, data: error.message };
        }
    }

    async levelToString(level: string): Promise<string> {
        switch (level) {
            case 'standard':
                return '标准'
            case 'higher':
                return '较高'
            case 'exhigh':
                return '极高'
            case 'lossless':
                return '无损'
            case 'hires':
                return 'Hi-Res'
            case 'jyeffect':
                return '高清环绕声'
            case 'sky':
                return '沉浸环绕声'
            case 'dolby':
                return '杜比全景声'
            case 'jymaster':
                return '超清母带' 
        } 
    }

}