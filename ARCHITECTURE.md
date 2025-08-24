# 🏗️ AI Moment NFT - 技术架构

## 📋 系统概览

AI Moment NFT是一个基于Web3技术的去中心化应用，集成了实时天气数据、AI图像生成和区块链NFT铸造功能。

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面      │    │   智能合约      │    │   外部服务      │
│   (Next.js)     │◄──►│   (Solidity)    │◄──►│   (APIs)        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   钱包连接      │    │   区块链网络     │    │   IPFS存储      │
│  (RainbowKit)   │    │   (Sepolia)     │    │   (Pinata)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 核心组件

### 1. 前端应用 (Frontend)

#### 技术栈
- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **状态管理**: React Hooks + Zustand
- **类型安全**: TypeScript

#### 主要页面
```
app/
├── page.tsx              # 首页 - 项目介绍
├── create/
│   └── page.tsx         # 创建NFT页面
├── me/
│   └── page.tsx         # 我的收藏页面
├── debug/
│   └── page.tsx         # 合约调试页面
└── api/                 # API路由
    ├── generate/        # AI图像生成
    ├── validate/        # 铸造资格校验
    └── pinata/          # IPFS上传
```

#### 关键组件
- `Address`: 以太坊地址显示组件
- `Balance`: 余额显示组件
- `NFTCard`: NFT卡片组件
- `NFTDetailModal`: NFT详情模态框

### 2. 智能合约 (Smart Contracts)

#### 合约架构
```
contracts/
└── WeatherNFT.sol       # 主合约 - ERC721 NFT
```

#### 核心数据结构
```solidity
struct WeatherData {
    string city;           // 城市名称
    string date;           // 铸造日期
    string weather;        // 天气状况
    int256 temperature;    // 温度
    string timeOfDay;      // 时间段
    uint256 timestamp;     // 铸造时间戳
    address minter;        // 铸造者地址
}
```

#### 主要功能
- `mintWithURI()`: 铸造NFT
- `getWeatherData()`: 获取天气数据
- `hasAlreadyMinted()`: 防重复铸造检查
- `getOwnedTokens()`: 获取用户NFT列表

### 3. 后端服务 (Backend Services)

#### API路由结构
```
api/
├── generate/             # AI图像生成
│   └── route.ts
├── validate/             # 铸造资格校验
│   └── route.ts
├── pinata/               # IPFS上传服务
│   ├── upload/
│   ├── metadata/
│   └── signed-url/
└── img/                  # 图像处理
    └── route.ts
```

#### 外部API集成
- **OpenAI/Poe API**: AI图像生成
- **Open-Meteo**: 免费天气数据
- **Nominatim**: 地理编码服务
- **Pinata**: IPFS存储服务

## 🔄 数据流程

### NFT创建流程
```
1. 用户输入城市名称
   ↓
2. 获取实时天气数据
   ↓
3. 生成AI提示词
   ↓
4. 调用AI服务生成图像
   ↓
5. 上传图像到IPFS
   ↓
6. 创建NFT元数据
   ↓
7. 上传元数据到IPFS
   ↓
8. 调用智能合约铸造NFT
   ↓
9. 完成铸造，获得Token ID
```

### 数据验证流程
```
1. 用户选择城市
   ↓
2. 前端调用验证API
   ↓
3. API调用智能合约
   ↓
4. 检查铸造资格
   ↓
5. 返回验证结果
   ↓
6. 前端显示铸造状态
```

## 🎨 AI图像生成

### 生成流程
```
1. 天气数据 → AI提示词
   ↓
2. 调用Poe API
   ↓
3. 下载生成图像
   ↓
4. 分析钱包特征
   ↓
5. 生成个性化边框
   ↓
6. 合并图像和边框
   ↓
7. 返回最终图像
```

### 提示词生成
```typescript
function generateWeatherPrompt(weather: WeatherData): string {
    return `A beautiful artistic poster of city ${weather.city}, 
            ${weather.timeOfDay} time, ${weather.weather} weather, 
            ${weather.temperature}°C, minimalist design, 
            modern typography, vibrant colors, travel poster style`;
}
```

## 🌐 网络配置

### 区块链网络
```typescript
// scaffold.config.ts
targetNetworks: [chains.sepolia],
rpcOverrides: {
    [chains.sepolia.id]: "https://sepolia.infura.io/v3/..."
}
```

### 环境变量
```bash
# 必需的环境变量
NEXT_PUBLIC_ALCHEMY_API_KEY=your_key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_id
POE_API_KEY=your_poe_key

# 可选的环境变量
NEXT_PUBLIC_RPC_URL=custom_rpc_url
```

## 🔒 安全机制

### 智能合约安全
- **防重复铸造**: 使用地址+城市+日期的哈希映射
- **权限控制**: 基于OpenZeppelin的Ownable模式
- **数据验证**: 输入参数验证和边界检查
- **事件记录**: 完整的铸造事件记录

### 前端安全
- **钱包验证**: 连接状态和网络检查
- **输入验证**: 城市名称和参数验证
- **API限制**: 请求频率和参数限制
- **错误处理**: 优雅的错误处理和用户提示

## 📊 性能优化

### 前端优化
- **代码分割**: Next.js自动代码分割
- **图片优化**: Next.js Image组件优化
- **缓存策略**: 智能合约数据缓存
- **懒加载**: 组件和图片懒加载

### 合约优化
- **Gas优化**: 高效的存储结构
- **批量查询**: 支持批量获取用户NFT
- **事件索引**: 优化事件查询性能

## 🧪 测试策略

### 合约测试
```bash
# 运行Foundry测试
yarn foundry:test

# 测试文件位置
test/WeatherNFT.t.sol
```

### 前端测试
- **组件测试**: React组件单元测试
- **集成测试**: 页面功能集成测试
- **E2E测试**: 端到端用户流程测试

## 🚀 部署流程

### 本地开发
```bash
# 1. 启动本地区块链
yarn chain

# 2. 部署合约
yarn deploy

# 3. 启动前端
yarn start
```

### 测试网部署
```bash
# 1. 配置网络
# 修改scaffold.config.ts

# 2. 部署到测试网
yarn deploy --network sepolia

# 3. 部署前端
yarn vercel
```

## 📈 监控和分析

### 链上监控
- **合约事件**: 铸造、转移等事件监控
- **Gas使用**: 交易Gas消耗分析
- **用户行为**: 铸造频率和模式分析

### 前端监控
- **性能指标**: 页面加载时间和交互响应
- **错误追踪**: 前端错误和异常监控
- **用户行为**: 页面访问和功能使用统计

## 🔮 未来扩展

### 技术升级
- **Layer2支持**: 集成Polygon、Arbitrum等
- **跨链功能**: 多链NFT支持
- **AI模型**: 更先进的图像生成模型

### 功能扩展
- **社交功能**: NFT分享和社区互动
- **交易市场**: NFT交易和拍卖功能
- **游戏化**: 成就系统和奖励机制

---

**技术架构持续演进，欢迎贡献代码和想法！** 🚀💡
