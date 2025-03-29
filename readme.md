# koishi-plugin-pointmintmarket-ncm

[![npm](https://img.shields.io/npm/v/koishi-plugin-pointmintmarket-ncm?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-pointmintmarket-ncm)

这是一个可以依赖于 PointmintMarket 的网易云音乐插件，开启插件后会自动注册商品。

## 功能特点

- 支持通过积分兑换网易云音乐歌曲
- 支持多种音质选择（标准、较高、极高、无损、Hi-Res等）
- 支持分页浏览搜索结果
- 支持自定义歌曲列表和单曲显示样式
- 支持cookie、游客等登录方式

## 安装方法

在 Koishi 控制台中搜索并安装 `pointmintmarket-ncm`。

## 前置依赖

本插件依赖以下服务：
- `market`: 需要安装 [koishi-plugin-pointmintmarket](https://www.npmjs.com/package/koishi-plugin-pointmintmarket) 插件
- `http`: Koishi 服务

## 配置项

### 兑换设置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| id | string | '4' | 商品ID |
| name | string | 'ncm' | 商品名称 |
| description | string | '兑换来自网易云的音乐' | 商品描述 |
| price | number | 10 | 商品价格 |
| tags | string[] | ['ncm', '网易云'] | 商品标签 |
| waitTime | number | 60000 | 兑换等待时间（毫秒） |

### 登录设置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| loginType | string | 'anonimous' | 登录方式，支持 'phone'、'email'、'cookie'、'anonimous' |
| login_phone | string | - | 用于登录的手机号（当 loginType 为 'phone' 时必填） |
| login_phone_countrycode | string | - | 国家码（非必填） |
| login_email | string | - | 用于登录的邮箱（当 loginType 为 'email' 时必填） |
| login_email_password | string | - | 用于登录的密码（当 loginType 为 'email' 时必填） |
| login_email_passwordIsMD5 | boolean | false | 密码是否为MD5加密 |
| login_cookie | string | - | 用于登录的cookie（当 loginType 为 'cookie' 时必填） |

### Ncm核心配置

| 配置项 | 类型 | 默认值 | 说明 |
|-------|------|-------|------|
| max_search_num | number | 25 | 最大搜索数量 |
| max_songs_per_page | number | 3 | 每页歌曲数量 |
| songListStyle | string | '歌曲列表：\n{songs}\n第{page}页/共{total}页\nnext下一页，prev上一页，exit退出' | 歌曲列表样式 |
| songStyle | string | '{index}. {name} - {ar.name} {al.pic}' | 单个歌曲样式 |
| picSize | number[] | [200, 200] | 图片尺寸（长x宽） |
| quality | string | 'standard' | 音质等级 |

#### 音质等级选项

- `standard`: 标准
- `higher`: 较高
- `exhigh`: 极高
- `lossless`: 无损
- `hires`: Hi-Res
- `jyeffect`: 高清环绕声
- `sky`: 沉浸环绕声
- `dolby`: 杜比全景声（需要cookie的`os=pc`以保证码率正常）
- `jymaster`: 超清母带

## 使用方法

1. 安装并启用本插件及其依赖
2. 配置插件参数，特别是登录相关设置
3. 用户可通过 PointmintMarket 插件提供的商店界面购买并兑换网易云音乐

## 兑换流程

1. 用户购买商品后，系统会提示输入歌曲名或歌手
2. 系统返回搜索结果，并分页显示
3. 用户可以通过输入数字选择歌曲，或输入 next/prev 翻页，或输入 exit 退出
4. 选择歌曲后，系统会返回歌曲链接和音频信息

## 注意事项

- 手机号登录方式在测试中无法登录，建议使用 cookie 登录方式
- 部分音质需要会员权限
