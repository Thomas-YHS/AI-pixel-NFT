# 环境变量配置说明

## 必需的环境变量

在 `packages/nextjs/` 目录下创建 `.env.local` 文件，添加以下配置：

### NFT.Storage API Token (必需)

```env
NEXT_PUBLIC_NFT_STORAGE_TOKEN=next_public_here
```

#### Replicate API Token (可选)

```env
REPLICATE_API_TOKEN=your_replicate_token_here
```

## 完整的 .env.local 示例

```env
# NFT.Storage API Token (必需)
NEXT_PUBLIC_NFT_STORAGE_TOKEN=next_public_here

# Replicate API Token (可选)
REPLICATE_API_TOKEN=your_replicate_token_here
```

## 注意事项

1. **NEXT_PUBLIC_** 前缀的变量会暴露到浏览器端
2. 没有前缀的变量只在服务器端可用
3. NFT.Storage token 是必需的，否则将使用 fallback 存储
4. 所有 API keys 都应该保密，不要提交到版本控制系统
