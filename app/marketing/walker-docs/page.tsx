'use client'

import { useState } from 'react'
import Link from 'next/link'

// 文檔內容 - 從原始 HTML 提取
const docs = [
  {
    id: 'intro',
    title: '天工 2.0 Pro 版 SDK 文档',
    category: '概述',
    content: `欢迎使用天工 2.0 Pro 版 SDK！本文档提供了完整的开发指南、API 参考和最佳实践。

## 快速开始

天工 SDK 是一套基于 ROS2 的机器人开发套件，为您提供强大的机器人控制和交互能力。

### 主要功能

- 🤖 完整的机器人控制接口
- 📡 实时通信和数据处理
- 🔧 模块化设计，易于扩展
- 📚 详细的 API 文档和示例代码

## 版本信息

- **当前版本**：2.0.5.1
- **发布日期**：2025
- **平台**：ROS2 (Robot Operating System 2)`
  },
  {
    id: 'user-guide-1',
    title: '前言',
    category: '用户手册',
    content: `感谢您选用【深圳市优必选科技股份有限公司】的人形机器人产品。

在您正式使用本产品之前，请务必认真阅读本用户手册，并严格按照本用户手册进行操作。

本手册的编制包含天工行者系列机器人的三款型号：
- 天工行者
- 天工行者·无界
- 天工行者·无疆

感谢您的理解与支持，祝您使用愉快！`
  },
  {
    id: 'user-guide-2',
    title: '1. 法律声明',
    category: '用户手册',
    content: `- 用户须对自身的使用行为负责，并承诺本产品仅用于合法、正当用途
- 用户使用本产品时应遵守所在地法律法规
- 严禁用于伤害、恐吓他人或动物，或用作武器及其配套工具
- 若因违反本手册使用规范造成的任何损失，本公司不承担责任
- 本公司对上述条款有最终解释权`
  },
  {
    id: 'user-guide-3',
    title: '2. 注意事项',
    category: '用户手册',
    content: `## 使用条件

- 本产品仅限年满18周岁以上人士使用
- 本产品定位为科研教学人形机器人
- 如需维修，请联系官方售后，禁止自行拆机

## 操作安全

- 请正确使用机器人各部件及配件，禁止私自改装、拆卸
- 请勿将手指、头发或衣物靠近机器人关节
- 请勿在运行期间触碰电机表面，防止烫伤
- 避免在潮湿、高温、强磁等恶劣环境中使用
- 正常工作温度为 0～30 ℃，湿度在 75% RH 以下

## 特殊操作警示

在无保护支架支撑的情况下，谨慎执行以下操作：
- 在跑步模式下长按"A"键使机器人站立
- 按遥控器"D"键回零
- 按急停按钮`
  },
  {
    id: 'user-guide-4',
    title: '3. 装箱清单',
    category: '用户手册',
    content: `- 机器人本体 × 1
- 电源适配器 × 1
- 遥控器 × 1
- 安全绳 × 1
- 用户手册（电子档）× 1
- 保修卡（电子档）× 1
- 出厂检测报告 × 1`
  },
  {
    id: 'user-guide-5',
    title: '4. 产品概况',
    category: '用户手册',
    content: `## 产品介绍

天工行者系列机器人是深圳优必选科技股份有限公司联合北京人形机器人创新中心有限公司研发的全尺寸纯电驱拟人奔跑机器人。

### 主要特点

- 最高可拥有 42 个自由度
- 双臂最高采用七自由度机械臂设计
- 可配备灵巧五指双手
- 整机续航时间超过 3.5 小时
- 整机算力最高可达 550 TOPS

## 功能特点

- **复杂地形自适应**：可平稳行走于斜坡、沙地等不规则地形
- **拟人化奔跑**：具备奔跑能力
- **动态平衡控制**：能实时抗外部干扰，维持姿态稳定
- **运控模式**：已部署强化学习运控模式
- **语音交互控制**：支持自然语音指令与交互
- **开放式接口设计**：提供全身关节与传感器接口

## 应用场景

本产品设计用于科研教学场景。`
  },
  {
    id: 'user-guide-6',
    title: '5. 产品组成',
    category: '用户手册',
    content: `## 机器人型号

- 天工行者·无疆
- 天工行者·无界
- 天工行者

## 基本参数信息

详细硬件基础参数请参考产品规格书。`
  },
  {
    id: 'user-guide-7',
    title: '6. 状态灯效说明',
    category: '用户手册',
    content: `## 正面灯效

天工行者正面的胸部及腹部位置分别设有：
- **整机状态灯**
- **电量状态灯**

两者共同构成状态指示灯系统，用户可通过组合灯效直观了解机器人当前运行状态。

## 背面灯效

天工行者背面腹部位置的开/关机键指示灯也会随状态变化。`
  },
  {
    id: 'user-guide-8',
    title: '7. 遥控器说明',
    category: '用户手册',
    content: `## 遥控器开/关机

连按两次遥控器左下角的电源键，第二次按下后不要松手，可以打开/关闭遥控器。

遥控器开机后，下方中央的指示灯亮起，从左至右分别表示遥控器的电量状态：
- 第1个灯：25%
- 第2个灯：50%
- 第3个灯：75%
- 第4个灯：100%

## 标准动作模式

拨杆位置：G 中 + E 中 + F 中

该模式为出厂默认遥控控制模式，支持站立、行走、跑步以及基础动作执行。

### 站立模式（H 中）

- **D 键**：回零（归初始位）
- **C 键**：僵停
- **长按 A 键**：进入站立状态

### 行走模式（H 左）

- **左摇杆**：前后/左右移动
- **右摇杆**：左右拨动控制旋转
- **C 键**：僵停

### 跑步模式（H 右）

- 左右摇杆控制逻辑与行走一致，运动速度更高
- **C 键**：僵停

## 安全注意事项

- **紧急停止**：任何时候按下 C 键都可以立即僵停机器人
- **失能急停**：G 右 + C 键可以关节失能`
  },
  {
    id: 'user-guide-9',
    title: '8. 开箱指南',
    category: '用户手册',
    content: `## 开箱检验

机器人采用航空箱包装，外部尺寸为 1850×780×500mm（长宽高）。

1. 确认箱体完好无损
2. 转动蝴蝶锁片打开侧面的两个方形锁
3. 根据装箱清单核对箱内物品

## 取出机器人

1. 将安全绳系上机器人后颈下方的固定吊环
2. 控制保护支架缓慢上升，将机器人吊起
3. 手动将机器人的足部放在航空箱边缘处
4. 将航空箱向前轻轻推动

## 使用前准备

### 环境检查

- 地面平整、不湿滑
- 建议四周至少有4m的自由活动空间
- 工作温度 0～30 ℃
- 相对湿度 75%RH 以下

## 启动机器人

机器人上电后将自动完成系统启动并进入服务等待状态。

### 主控板连接

各主控板可通过ssh命令远程连接：
\`\`\`
ssh ubuntu@192.168.41.1
\`\`\`

## 落地站立

1. 按遥控器上的"D"键回零到初始状态
2. 控制保护支架缓慢下降
3. 保持竖直状态60秒
4. 长按"A"键使机器人站立`
  },
  {
    id: 'user-guide-10',
    title: '9. 基础动作操作说明',
    category: '用户手册',
    content: `## 行走模式切换

### 启动踏步模式

1. 确认机器人已处于站立状态
2. 将"H"拨杆从中间向左拨，再拨回中间

### 切换至跑步模式

将"H"拨杆从中间向右拨，再拨回中间

### 移动与转向控制

- **左摇杆上下**：前进或后退
- **左摇杆左右**：左右移动
- **右摇杆左右**：逆时针或顺时针转动

## 紧急停止方法

### 僵停

按下遥控器上的"C"键，机器人全身关节立即僵停。

### 关节失能

同时将"G"拨杆向右拨并按下"C"键。

### 急停按钮

按下机器人背部的急停按钮，切断所有电源。

## 电池充电

### 充电须知

- 充电前请关闭机器人电源
- 充电环境温度应为 0～30℃
- 使用原装专用充电器
- 充满电后及时拔掉充电器`
  },
  {
    id: 'user-guide-11',
    title: '10. 天工行者App',
    category: '用户手册',
    content: `天工行者App提供了面向天工行者系列机器人的操作辅助。

## 主要功能

- 便捷地为设备进行配网
- 查看机器人状态信息
- 进行机器人动作控制

## 连接机器人

1. 确保手机已连接Wi-Fi并开启蓝牙
2. 进入App，点击连接机器人
3. 选择需要连接的设备
4. 输入机器人控制密码

## 机器人状态

- 可手动开启或关闭机器人语音服务
- 查看电池电量及传感器状态

## 语音播报

- 支持中文、英文、中英文混合输入
- 点击已创建语料可进行播报

## 机器人控制

- 切换状态：站立、行走、奔跑、回零及僵停
- 动作控制：点击动作按钮执行相应动作`
  },
  {
    id: 'user-guide-12',
    title: '11. 日常维护与管理',
    category: '用户手册',
    content: `## 日常检查

- 外壳是否有损伤、变形或松动
- 电池与接头是否牢固
- 各传感器是否清洁干净
- 电机是否正常运行
- 各指示灯是否常亮
- 遥控器的控制功能是否正常

## 搬运

- 使用定制航空箱进行运输
- 移动前请完全关机并断电
- 注意各关节可能夹伤手指

## 清洁

- 清洁前请完全关机并断电
- 禁止使用喷雾剂、酒精类溶液
- 使用柔软的干抹布擦拭

## 电池维护

- 避免过充/过放
- 不建议长时间插着充电器
- 长期停用时保持 50%-70% 电量存储
- 定期充电避免深度放电`
  },
  {
    id: 'user-guide-13',
    title: '12. 故障排除',
    category: '用户手册',
    content: `当产品运行中出现异常时，请参阅故障排除表解决。

如遇到其他使用异常，请联系售后工程师寻求专业支持。`
  },
  {
    id: 'user-guide-14',
    title: '13. 售后保修',
    category: '用户手册',
    content: `## 保修政策

- 产品自签收日起享受保修服务
- 保修范围仅限非人为造成的性能故障
- 质保期间内提供免费维修或部件更换

## 非保修条款

- 超出保修期限
- 未按用户手册操作造成的损坏
- 误操作、跌落、水渍等人为因素
- 非授权人员拆解、维修

## 联系方式

- **电话**：+86-400-6666-700
- **邮箱**：ucare@ubtrobot.com`
  }
]

export default function WalkerDocsPage() {
  const [activeDoc, setActiveDoc] = useState(docs[0])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // 按分类分组
  const categories = docs.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = []
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<string, typeof docs>)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg md:hidden"
            >
              ☰
            </button>
            <Link href="/marketing" className="text-slate-400 hover:text-slate-700 transition">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
            </Link>
            <span className="text-lg bg-gradient-to-br from-violet-500 to-violet-600 bg-clip-text text-transparent">🤖</span>
            <h1 className="text-lg font-bold text-slate-800">Walker 天工文档</h1>
          </div>
          <a 
            href="https://docs.ubtrobot.com/walker-tienkung/" 
            target="_blank"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            原站 ↗
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-72 bg-white border-r min-h-screen sticky top-16 overflow-y-auto`}>
          <nav className="p-4">
            {Object.entries(categories).map(([category, categoryDocs]) => (
              <div key={category} className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {category}
                </h3>
                <ul className="space-y-1">
                  {categoryDocs.map(doc => (
                    <li key={doc.id}>
                      <button
                        onClick={() => {
                          setActiveDoc(doc)
                          // 只在手機版關閉 sidebar
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false)
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                          activeDoc.id === doc.id 
                            ? 'bg-blue-50 text-blue-700 font-medium' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {doc.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-8">
          <article className="max-w-3xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{activeDoc.title}</h1>
            <p className="text-sm text-gray-500 mb-8">{activeDoc.category}</p>
            
            <div className="prose prose-blue max-w-none">
              {activeDoc.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-xl font-bold mt-8 mb-4 text-gray-900">{line.slice(3)}</h2>
                }
                if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-lg font-semibold mt-6 mb-3 text-gray-800">{line.slice(4)}</h3>
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="text-gray-700 ml-4">{line.slice(2)}</li>
                }
                if (line.startsWith('```')) {
                  return null
                }
                if (line.trim() === '') {
                  return <br key={i} />
                }
                if (line.includes('**')) {
                  const parts = line.split(/(\*\*[^*]+\*\*)/g)
                  return (
                    <p key={i} className="text-gray-700 mb-2">
                      {parts.map((part, j) => 
                        part.startsWith('**') ? (
                          <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                        ) : part
                      )}
                    </p>
                  )
                }
                return <p key={i} className="text-gray-700 mb-2">{line}</p>
              })}
            </div>
          </article>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t py-6 text-center text-sm text-gray-500">
        <p>文档来源：UBTECH Walker 天工行者 · 和椿科技整理</p>
      </footer>
    </div>
  )
}
