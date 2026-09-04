# 词语碰碰 Word Pop Game

一个可离线使用的中英文单词配对消除游戏。项目使用 Vue 3 和 Vite 开发，
内置 3000 个小学、初中和高中阶段词汇，支持用户导入私人词库、浏览器英文朗读、
简单/困难难度以及左右独立棋盘的双人 PK。

构建结果是一个完全自包含的 HTML 文件。JavaScript、CSS、图标和词库均已内联，
不需要安装应用或连接服务器，双击即可开始使用。

## 功能概览

| 功能 | 说明 |
| --- | --- |
| 分级词库 | 小学 600 词、初中 900 词、高中 1500 词 |
| 单人闯关 | 独立计时、计分、准确率和连击统计 |
| 双人 PK | 左右两个独立棋盘，可同时操作，不需要轮流 |
| 双人题目 | 支持双方使用同一套词，或分别随机生成两套词 |
| 难度选择 | 简单模式 8 对不限时；困难模式 12 对、限时 90 秒 |
| 固定槽位 | 配对消除后保留等高占位槽，其他单词不会移动 |
| 消除反馈 | 配对动画、粒子效果、错误抖动、连击和完成反馈 |
| 单词朗读 | 浏览器支持 `speechSynthesis` 时自动提供英文发音 |
| 私人词库 | 支持 TXT、CSV、JSON 导入，最多保存 5000 个本地词汇 |
| 本地记录 | 保存完成局数、最高得分、累计配对数和导入词库 |
| 响应式布局 | 支持桌面、平板和手机；长单词、长中文释义自动换行 |

## 直接使用

仓库已经包含构建好的单文件版本：

```text
dist/index.html
```

下载仓库后，直接用 Chrome、Edge、Safari 或 Firefox 打开该文件即可。游戏不会请求
后端接口，内置词库和主要功能在离线状态下也可以正常使用。

## 游戏模式

### 单人闯关

选择年级与难度后开始游戏。点击一个英文词，再点击对应的中文释义即可完成配对。
连续答对会增加连击得分；使用提示会扣除 30 分。

### 双人 PK

双人模式会显示左右两个完全独立的棋盘：

- 玩家 1 和玩家 2 分别操作自己的卡片，可以同时答题。
- 每侧拥有独立的选中状态、提示、连击、分数、进度和完成时间。
- “同一套”会给双方相同的词对，但两个棋盘会分别随机排列。
- “随机两套”会优先从当前年级生成两组不重复的词。
- 胜负依次比较已配对数量、得分和完成速度；条件完全相同时为平局。

在屏幕宽度充足时，两个棋盘左右并排；手机窄屏下会改为上下排列，确保长释义仍然可读。

## 内置词库

| 分组 | 数量 | 用途 |
| --- | ---: | --- |
| 小学词汇 | 600 | 高频基础词与小学阶段常见表达 |
| 初中词汇 | 900 | 中考核心词汇 |
| 高中词汇 | 1500 | 高中及高考重点词汇 |
| 合计 | 3000 | 内置词汇总量 |

词库由构建脚本生成，而不是散落在界面组件中。需要重新生成时运行：

```bash
npm run generate:words
```

生成脚本需要本机安装并登录 GitHub CLI。数据来源与第三方许可见
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。

## 导入私人词库

点击页面右上角“我的词库”即可导入。导入时会按英文单词去重，并与此前保存的词汇合并。

### TXT 或 CSV

每行一个中英文词对，支持逗号、中文逗号、冒号、等号、制表符或 ` - ` 分隔：

```text
apple,苹果
take care,当心；保重
beautiful = 美丽的；漂亮的
```

### JSON

支持以下对象字段：

```json
[
  { "en": "apple", "zh": "苹果" },
  { "english": "book", "chinese": "书" },
  { "word": "friend", "meaning": "朋友" }
]
```

也支持二元数组：

```json
[
  ["apple", "苹果"],
  ["book", "书"]
]
```

## 本地数据与隐私

项目不包含账号系统，也不会上传学习记录。以下数据只保存在当前浏览器的
`localStorage` 中：

- 用户导入的私人词库
- 完成局数、最高得分和累计配对数

清除浏览器网站数据后，本地记录也会被删除。不同浏览器或不同设备之间不会自动同步。

## 本地开发

环境要求：Node.js 20.19+ 或 22.12+，推荐使用当前 LTS 版本。

```bash
git clone https://github.com/sxlisme/word-pop-game.git
cd word-pop-game
npm install
npm run dev
```

Vite 启动后会输出本地访问地址，默认通常为：

```text
http://127.0.0.1:5173/
```

## 构建单文件

```bash
npm run build
```

构建产物位于：

```text
dist/index.html
```

项目通过 `vite-plugin-singlefile` 将运行时代码、样式、图标和 3000 词数据全部内联。
构建完成后可以复制这一个文件到其他电脑使用。

## 自动化测试

```bash
npm test
```

当前测试覆盖：

- 内置词汇总数、分级数量和英文词去重
- TXT、CSV、制表符文本和 JSON 导入解析
- 最终 HTML 的脚本与样式内联检查
- 双人模式的配对数、得分、完成时间和胜负判定

## 项目结构

```text
word-pop-game/
├── dist/
│   └── index.html              # 可直接使用的单文件产物
├── scripts/
│   └── build-wordlist.mjs      # 3000 词生成脚本
├── src/
│   ├── components/
│   │   ├── GameBoard.vue       # 计时、计分和游戏流程
│   │   ├── HomeScreen.vue      # 年级、玩法和难度入口
│   │   ├── ImportDialog.vue    # 私人词库导入与管理
│   │   └── PlayerBoard.vue     # 单人/双人可复用棋盘
│   ├── data/
│   │   └── words.js            # 自动生成的内置词库
│   ├── utils/
│   │   ├── duel.js             # 双人胜负判定
│   │   ├── importer.js         # 导入格式解析
│   │   └── storage.js          # 本地持久化
│   ├── App.vue
│   ├── main.js
│   └── styles.css
├── tests/
│   └── data.test.mjs
├── THIRD_PARTY_NOTICES.md
├── package.json
└── vite.config.js
```

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建自包含的 `dist/index.html` |
| `npm run preview` | 预览生产构建 |
| `npm run generate:words` | 重新生成 3000 词数据 |
| `npm test` | 运行自动化测试 |

## 浏览器兼容性

推荐使用较新版本的 Chrome、Edge、Safari 或 Firefox。英文朗读依赖浏览器的 Web Speech
API；如果当前浏览器不支持 `speechSynthesis`，应用会自动隐藏声音开关，不影响配对游戏。
不同操作系统提供的英文音色可能不同。

## 技术栈

- Vue 3
- Vite
- Lucide Vue Next
- vite-plugin-singlefile
- Node.js Test Runner
- 原生 Web Speech API
- 原生 localStorage

## 数据来源与许可

内置词汇数据基于 [ECDICT](https://github.com/skywind3000/ECDICT) 的考试标签数据生成。
ECDICT 使用 MIT License，完整说明见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。

项目代码当前未单独声明开源许可证。在添加许可证前，公开仓库不代表自动授予复制、修改或
再发布项目代码的权利。
