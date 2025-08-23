// packages/nextjs/lib/frame.ts
import { WalletTraits } from "./wallet";

// 定义相框的尺寸和主图的尺寸
const FRAME_WIDTH = 484; // 384 + 50*2
const FRAME_HEIGHT = 484; // 384 + 50*2
const BORDER_SIZE = 50;

// 为您的4个用户类型定义调色板
const PALETTES: Record<string, string[]> = {
  链上新手小白: ["#E0E0E0", "#BDBDBD", "#9E9E9E", "#FAFAFA"],
  NFT收藏家: ["#8D6E63", "#A1887F", "#BCAAA4", "#795548"],
  链上老炮: ["#FFD700", "#C0C0C0", "#424242", "#212121"],
  探索家: ["#1E88E5", "#00ACC1", "#43A047", "#FDD835"],
};

/**
 * 生成一个由随机色块拼接的SVG相框
 * @param traits 钱包分析结果
 * @returns 返回一个SVG字符串
 */
export const generateFrameSVG = (traits: WalletTraits): string => {
  // 优先级逻辑：如果用户有多个标签，我们优先选择最“资深”的
  let styleKey = "链上新手小白"; // 默认
  if (traits.tags.includes("链上老炮")) {
    styleKey = "链上老炮";
  } else if (traits.tags.includes("NFT收藏家")) {
    styleKey = "NFT收藏家";
  } else if (traits.tags.includes("探索家")) {
    styleKey = "探索家";
  }

  const palette = PALETTES[styleKey];

  const blocks: string[] = [];
  const blockSize = 25; // 每个色块的大小

  // 随机生成色块拼接的SVG <rect> 元素
  for (let y = 0; y < FRAME_HEIGHT; y += blockSize) {
    for (let x = 0; x < FRAME_WIDTH; x += blockSize) {
      // 只在边框区域绘制
      if (x < BORDER_SIZE || x >= FRAME_WIDTH - BORDER_SIZE || y < BORDER_SIZE || y >= FRAME_HEIGHT - BORDER_SIZE) {
        const color = palette[Math.floor(Math.random() * palette.length)];
        blocks.push(`<rect x="${x}" y="${y}" width="${blockSize}" height="${blockSize}" fill="${color}" />`);
      }
    }
  }

  // 拼接成完整的SVG
  return `
    <svg width="${FRAME_WIDTH}" height="${FRAME_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      ${blocks.join("\n")}
    </svg>
  `;
};
