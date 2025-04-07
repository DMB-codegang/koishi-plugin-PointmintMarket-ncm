import { Schema } from 'koishi'

// 插件配置
export interface Config {
    // 兑换设置
    /** 商品名称 */
    name: string
    /** 默认商品详细描述 */
    description: string
    /** 默认商品标签 */
    tags: string[]
    /** 兑换等待时间 */
    waitTime: number

    // 登录设置
    /** 登录方式 */
    loginType: 'phone' | 'email' | 'anonimous' | 'cookie'
    // 手机登录所需内容
    login_phone?: string
    login_phone_countrycode?: string

    // 邮箱登录所需内容
    login_email?: string
    login_email_password?: string
    login_email_passwordIsMD5?: boolean

    // cookie登录所需内容
    login_cookie?: string

    // Ncm核心配置
    /** 最大搜索数量 */
    max_search_num: number
    /** 每页歌曲数量 */
    max_songs_per_page: number
    /** 歌曲列表样式 */
    songListStyle: string
    /** 单个歌曲样式 */
    songStyle: string
    /** 图片尺寸 */
    picSize: number[]
    /** 音质类型 */
    quality: 'standard' | 'higher' | 'exhigh' | 'lossless' | 'hires' | 'jyeffect' | 'sky' | 'dolby' | 'jymaster'
    /** 选择输出模式，可选语音返回，音频文件返回，mv视频返回的任意排列组合 */
    outputMode: string[]
}

export const Config: Schema<Config> = Schema.intersect([
    // 兑换设置
    Schema.object({
        waitTime: Schema.number().default(60000).min(1000).description('兑换等待时间（毫秒）'),
        name: Schema.string().default('ncm').description('商品名称'),
        description: Schema.string().default('兑换来自网易云的音乐').description('默认商品描述'),
        tags: Schema.array(Schema.string()).default(['ncm', '网易云']).description('默认商品标签'),
    }).description('兑换设置'),

    // 登录设置
    Schema.object({
        loginType: Schema.union([
            Schema.const('phone').disabled().description('手机验证码登录'),
            Schema.const('email').disabled().description('邮箱登录'),
            Schema.const('cookie').description('cookie登录'),
            Schema.const('anonimous').description('游客登录')
        ]).description('登录方式').default('anonimous')
    }).description('登录设置'),
    Schema.union([
        Schema.object({
            loginType: Schema.const('anonimous'),
        }),
        Schema.object({
            loginType: Schema.const('phone').required(),
            login_phone: Schema.string().required().description('用于登录的手机号'),
            login_phone_countrycode: Schema.string().description('国家码，非必填')
        }),
        Schema.object({
            loginType: Schema.const('email').required(),
            login_email: Schema.string().required().description('用于登录的邮箱'),
            login_email_password: Schema.string().required().description('用于登录的密码'),
            login_email_passwordIsMD5: Schema.boolean().description('密码是否为MD5加密').default(false),
        }),
        Schema.object({
            loginType: Schema.const('cookie').required(),
            login_cookie: Schema.string().role('textarea', { rows: [4, 3] }).required().description('用于登录的cookie'),
        })
    ]),

    Schema.object({
        max_search_num: Schema.number().default(25).min(1).description('最大搜索数量'),
        max_songs_per_page: Schema.number().default(3).min(1).description('每页歌曲数量'),
        songListStyle: Schema.string().role('textarea', { rows: [4, 3] })
            .default('歌曲列表：\n{songs}\n第{page}页/共{total}页\nnext下一页，prev上一页，exit退出')
            .description('歌曲列表样式，支持变量`{songs}`、`{page}`、`{total}`'),
        songStyle: Schema.string().role('textarea', { rows: [4, 3] })
            .default('{index}. {name} - {ar.name} {al.pic}')
            .description('单个歌曲样式，支持变量`{index}`、`{id}`、`{ar.name}`、`{al.id}`、`{al.name}`、`{al.pic}`'),
        picSize: Schema.tuple([Schema.number().min(20), Schema.number().min(20)]).default([200, 200]).description('图片尺寸（`长x宽`）'),
        quality: Schema.union([
            Schema.const('standard').description('标准'),
            Schema.const('higher').description('较高'),
            Schema.const('exhigh').description('极高'),
            Schema.const('lossless').description('无损'),
            Schema.const('hires').description('Hi-Res'),
            Schema.const('jyeffect').description('高清环绕声'),
            Schema.const('sky').description('沉浸环绕声'),
            Schema.const('dolby').description('杜比全景声'),
            Schema.const('jymaster').description('超清母带')
        ]).default('standard').description('音质等级 杜比全景声需要cookie的`os=pc`以保证码率正常'),
        outputMode: Schema.array(
            Schema.union([
                Schema.const('songinfo').description('歌曲信息'),
                Schema.const('audio').description('语音'),
                Schema.const('voice').description('音频文件'),
                Schema.const('mv').description('mv视频')
            ])
        ).description('选择输出模式，可选语音返回，音频文件返回，mv视频返回的任意排列组合').default(['voice']).role('checkbox')
    }).description('Ncm核心配置')
])