# 文的项目工作台

个人接单工作台，一套用于管理接单业务全流程的本地 Web 应用：从客户、订单、报价到多平台内容发布、素材库与数据统计，一站式完成记录与复盘。

## 功能特性

- **智能仪表盘**：今日/本月/年度收入与订单统计、订单趋势图、平台发布状态、待办聚合、日程提醒
- **客户与订单管理**：客户信息、项目状态流转、付款状态、客户画像标签、多维筛选检索、回收站
- **报价单管理**：在线生成报价单、多版本（初版/协商版/最终版）、砍价记录、快捷话术复制
- **宣传素材库**：图片/视频上传、自定义分类、标签备注、使用频次追踪
- **多平台发布台账**：小红书/闲鱼/抖音发帖记录、数据表现统计、爆款标记、咨询客户追踪
- **待办与智能提醒**：待办事项、截止日期、优先级标记、到期自动提醒
- **数据统计**：收入趋势、平台客源占比、项目类型分布、利润率核算
- **系统管理**：账号登录、数据备份与恢复、一键导出 Excel

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | Node.js + Express |
| 前端 | 原生 JavaScript + Tailwind CSS + ECharts + Phosphor Icons |
| 存储 | JSON 文件存储（自动备份） |
| 架构 | 前端 SPA 局部刷新 + RESTful API |

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org) 18+

### Windows 一键启动

双击 `start.bat`，脚本会自动检查依赖、启动后端服务并打开浏览器：

- 前端地址：<http://localhost:3456>
- API 地址：<http://localhost:3456/api>
- 健康检查：<http://localhost:3456/api/health>

停止服务请双击 `stop.bat`。

### 手动启动

```bash
cd backend
npm install
npm start          # 启动服务
npm run dev        # 开发模式（node --watch 热重载）
```

## 运行测试

```bash
cd backend
npm test           # 或双击 test.bat（node --test）
```

## 项目结构

```
├── backend/            # Node.js 后端服务
│   ├── server.js       # 服务入口（API + 静态托管 + SPA 路由回退）
│   ├── src/
│   │   ├── routes/     # RESTful API 路由（16 个模块）
│   │   ├── utils/      # 存储、响应、备份等工具
│   │   └── data/       # 种子数据
│   ├── test/           # 单元测试
│   └── data/           # 运行时数据（JSON + 上传文件）
├── frontend/           # 前端页面
│   ├── index.html      # 首页仪表盘
│   ├── js/             # 全局脚本（路由、API、UI 组件等）
│   ├── pages/          # 业务页面（business/content/personal/platform）
│   ├── css/            # 样式
│   └── assets/         # 静态资源
├── docs/               # 项目文档
├── start.bat / stop.bat / test.bat   # 一键启停与测试脚本
└── 工作内容.md          # 需求清单
```

## 主要 API

| 模块 | 前缀 | 说明 |
|------|------|------|
| 订单 | `/api/orders` | 订单 CRUD |
| 客户 | `/api/customers` | 客户管理 |
| 报价 | `/api/quotes` | 报价单管理 |
| 海报素材 | `/api/posters` | 宣传素材 |
| 项目 | `/api/projects` | 项目案例 |
| 平台发布 | `/api/platform-posts` | 多平台发帖台账 |
| 备忘录 | `/api/memos` | 待办备忘 |
| 提醒 | `/api/reminders` | 日程提醒 |
| 统计 | `/api/stats` | 数据统计 |
| 上传 | `/api/upload` | 文件上传 |

> 接口统一返回 `{ success: boolean, data: ... }` 结构。

## 许可

MIT License
