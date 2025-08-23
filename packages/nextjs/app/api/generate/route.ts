import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt, width = 512, height = 768 } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    // 检查是否有Replicate API密钥
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    console.log("replicateToken", replicateToken);
    if (!replicateToken) {
      console.warn("REPLICATE_API_TOKEN not found, using fallback generation");
      return generateFallbackImage(prompt, width, height);
    }

    // 使用Replicate API生成图像
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${replicateToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b", // SDXL
        input: {
          prompt: prompt,
          width: width,
          height: height,
          num_outputs: 1,
          num_inference_steps: 20,
          guidance_scale: 7.5,
          scheduler: "K_EULER",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Replicate API error: ${response.status}`);
    }

    const prediction = await response.json();

    // 轮询结果
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 60; // 最多等待60秒

    while (result.status !== "succeeded" && result.status !== "failed" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          Authorization: `Token ${replicateToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!pollResponse.ok) {
        throw new Error(`Polling error: ${pollResponse.status}`);
      }

      result = await pollResponse.json();
      attempts++;
    }

    if (result.status === "failed") {
      throw new Error(result.error || "Image generation failed");
    }

    if (result.status !== "succeeded") {
      throw new Error("Image generation timed out");
    }

    // 获取生成的图像URL
    const imageUrl = result.output?.[0];
    if (!imageUrl) {
      throw new Error("No image URL in response");
    }

    // 下载图像并转换为Buffer
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download generated image");
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(Buffer.from(imageBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Image generation error:", error);

    // 发生错误时返回fallback图像
    const { prompt } = await request.json().catch(() => ({ prompt: "Weather poster" }));
    return generateFallbackImage(prompt, 512, 768);
  }
}

/**
 * 生成fallback图像（当AI服务不可用时）
 */
async function generateFallbackImage(prompt: string, width: number, height: number) {
  // 从prompt中提取信息
  const cityMatch = prompt.match(/of ([^,]+)/);
  const weatherMatch = prompt.match(/(sunny|rainy|cloudy|snowy|foggy|clear|overcast|thunderstorm)/i);
  const tempMatch = prompt.match(/(\d+)°C/);
  const timeMatch = prompt.match(/(morning|afternoon|evening|night)/i);

  const city = cityMatch?.[1] || "Unknown City";
  const weather = weatherMatch?.[1] || "clear";
  const temperature = tempMatch?.[1] || "20";
  const timeOfDay = timeMatch?.[1] || "day";

  // 根据天气和时间选择颜色
  const getGradientColors = (weather: string, time: string) => {
    if (weather.toLowerCase().includes("rain")) {
      return ["#4682B4", "#2F4F4F"];
    } else if (weather.toLowerCase().includes("snow")) {
      return ["#B0C4DE", "#4682B4"];
    } else if (weather.toLowerCase().includes("cloud")) {
      return ["#87CEEB", "#4682B4"];
    } else if (time.toLowerCase() === "night") {
      return ["#191970", "#000080"];
    } else if (time.toLowerCase() === "evening") {
      return ["#FF6347", "#FF4500"];
    } else {
      return ["#FFD700", "#FFA500"];
    }
  };

  const [color1, color2] = getGradientColors(weather, timeOfDay);

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- 背景 -->
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      
      <!-- 装饰性元素 -->
      <circle cx="${width * 0.8}" cy="${height * 0.2}" r="60" fill="rgba(255,255,255,0.1)"/>
      <circle cx="${width * 0.2}" cy="${height * 0.8}" r="40" fill="rgba(255,255,255,0.05)"/>
      
      <!-- 主标题 -->
      <text x="${width / 2}" y="${height * 0.2}" text-anchor="middle" fill="white" font-size="42" font-weight="bold" filter="url(#glow)">${city}</text>
      
      <!-- 温度 -->
      <text x="${width / 2}" y="${height * 0.4}" text-anchor="middle" fill="white" font-size="72" font-weight="bold">${temperature}°C</text>
      
      <!-- 天气描述 -->
      <text x="${width / 2}" y="${height * 0.55}" text-anchor="middle" fill="white" font-size="24" opacity="0.9">${weather.toUpperCase()}</text>
      
      <!-- 时间 -->
      <text x="${width / 2}" y="${height * 0.65}" text-anchor="middle" fill="white" font-size="18" opacity="0.8">${timeOfDay.toUpperCase()}</text>
      
      <!-- AI Generated 标识 -->
      <text x="${width / 2}" y="${height * 0.9}" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="14">AI GENERATED WEATHER NFT</text>
      
      <!-- 装饰线条 -->
      <line x1="${width * 0.3}" y1="${height * 0.7}" x2="${width * 0.7}" y2="${height * 0.7}" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    </svg>
  `;

  const svgBuffer = Buffer.from(svg, "utf-8");

  return new NextResponse(svgBuffer, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}
