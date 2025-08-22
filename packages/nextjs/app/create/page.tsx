"use client";

import { useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { Address } from "~~/components/scaffold-eth";

const Create: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [step, setStep] = useState<"idle" | "generating" | "uploading" | "minting" | "done">("idle");
  const [city, setCity] = useState("");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<number | null>(null);

  const mockWeatherData = {
    city: city || "北京",
    date: new Date().toISOString().split("T")[0],
    weather: "晴天",
    temperature: 25,
    timeOfDay: "下午",
    humidity: 65,
    windSpeed: 5,
  };

  const handleGenerate = async () => {
    if (!connectedAddress) {
      alert("请先连接钱包");
      return;
    }

    if (!city.trim()) {
      alert("请输入城市名称");
      return;
    }

    try {
      setStep("generating");
      setWeatherData(mockWeatherData);

      // 模拟生成过程延迟
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 使用占位图
      const placeholderImage = generatePlaceholderSVG(mockWeatherData);
      setGeneratedImage(placeholderImage);

      setStep("uploading");
      // 模拟上传过程
      await new Promise(resolve => setTimeout(resolve, 1500));

      setStep("minting");
      // 模拟铸造过程
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 模拟返回的tokenId
      setTokenId(Math.floor(Math.random() * 1000) + 1);
      setStep("done");
    } catch (error) {
      console.error("Error:", error);
      setStep("idle");
      alert("生成失败，请重试");
    }
  };

  const generatePlaceholderSVG = (data: any) => {
    const svg = `
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#4682B4;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- 背景 -->
        <rect width="400" height="600" fill="url(#skyGradient)"/>
        
        <!-- 城市名称 -->
        <text x="200" y="80" text-anchor="middle" fill="white" font-size="32" font-weight="bold">${data.city}</text>
        
        <!-- 日期 -->
        <text x="200" y="120" text-anchor="middle" fill="white" font-size="18">${data.date}</text>
        
        <!-- 天气图标 -->
        <circle cx="200" cy="200" r="50" fill="#FFD700" stroke="#FFA500" stroke-width="3"/>
        <text x="200" y="210" text-anchor="middle" fill="#FF6347" font-size="20">☀️</text>
        
        <!-- 温度 -->
        <text x="200" y="300" text-anchor="middle" fill="white" font-size="48" font-weight="bold">${data.temperature}°C</text>
        
        <!-- 天气状况 -->
        <text x="200" y="350" text-anchor="middle" fill="white" font-size="24">${data.weather}</text>
        
        <!-- 时间段 -->
        <text x="200" y="380" text-anchor="middle" fill="white" font-size="18">${data.timeOfDay}</text>
        
        <!-- 额外信息 -->
        <text x="200" y="450" text-anchor="middle" fill="white" font-size="16">湿度: ${data.humidity}%</text>
        <text x="200" y="480" text-anchor="middle" fill="white" font-size="16">风速: ${data.windSpeed} km/h</text>
        
        <!-- AI生成标识 -->
        <text x="200" y="550" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="14">AI Generated Weather NFT</text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  const resetFlow = () => {
    setStep("idle");
    setWeatherData(null);
    setGeneratedImage(null);
    setTokenId(null);
  };

  const getStepText = () => {
    switch (step) {
      case "generating":
        return "🎨 AI正在生成图片...";
      case "uploading":
        return "☁️ 上传到IPFS...";
      case "minting":
        return "⛏️ 铸造NFT...";
      case "done":
        return "✅ 完成!";
      default:
        return "🌤️ 生成你的天气NFT";
    }
  };

  return (
    <>
      <MetaHeader title="创建天气NFT | AI Moment NFT" description="基于实时天气生成独特的NFT" />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-4xl">
          <h1 className="text-center">
            <span className="block text-4xl font-bold mb-2">🌤️ 创建天气NFT</span>
            <span className="block text-2xl font-bold">AI Moment NFT</span>
          </h1>

          <div className="flex flex-col lg:flex-row gap-8 mt-8">
            {/* 左侧：输入和控制 */}
            <div className="flex-1 bg-base-100 p-6 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold mb-6">🌍 选择位置</h2>

              {!connectedAddress && (
                <div className="alert alert-warning mb-4">
                  <span>请先连接钱包以继续</span>
                </div>
              )}

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">城市名称</span>
                </label>
                <input
                  type="text"
                  placeholder="例如：北京、上海、深圳..."
                  className="input input-bordered w-full"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  disabled={step !== "idle"}
                />
              </div>

              {weatherData && (
                <div className="bg-base-200 p-4 rounded-lg mb-4">
                  <h3 className="font-bold mb-2">📊 天气信息</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>🏙️ 城市: {weatherData.city}</div>
                    <div>📅 日期: {weatherData.date}</div>
                    <div>🌤️ 天气: {weatherData.weather}</div>
                    <div>🌡️ 温度: {weatherData.temperature}°C</div>
                    <div>⏰ 时段: {weatherData.timeOfDay}</div>
                    <div>💧 湿度: {weatherData.humidity}%</div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-4">
                {step === "idle" && (
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleGenerate}
                    disabled={!connectedAddress || !city.trim()}
                  >
                    {getStepText()}
                  </button>
                )}

                {step !== "idle" && step !== "done" && (
                  <div className="flex flex-col items-center gap-4">
                    <button className="btn btn-primary btn-lg loading">{getStepText()}</button>
                    <progress
                      className="progress progress-primary w-full"
                      max="100"
                      value={step === "generating" ? 33 : step === "uploading" ? 66 : step === "minting" ? 90 : 100}
                    ></progress>
                  </div>
                )}

                {step === "done" && (
                  <div className="flex flex-col gap-4">
                    <div className="alert alert-success">
                      <span>🎉 NFT铸造成功！Token ID: {tokenId}</span>
                    </div>
                    <button className="btn btn-secondary" onClick={resetFlow}>
                      再次生成
                    </button>
                    <button className="btn btn-outline">查看我的NFT</button>
                  </div>
                )}
              </div>

              {connectedAddress && (
                <div className="mt-6 pt-4 border-t border-base-300">
                  <div className="text-sm text-base-content/70">
                    连接地址: <Address address={connectedAddress} />
                  </div>
                </div>
              )}
            </div>

            {/* 右侧：图片预览 */}
            <div className="flex-1 bg-base-100 p-6 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold mb-6">🎨 生成预览</h2>

              <div className="flex justify-center">
                {generatedImage ? (
                  <div className="w-full max-w-sm">
                    <Image
                      src={generatedImage}
                      alt="Generated Weather NFT"
                      width={400}
                      height={600}
                      className="w-full rounded-lg shadow-lg"
                    />
                    <div className="mt-4 text-center">
                      <div className="badge badge-primary">AI生成的天气海报</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-sm h-96 bg-base-200 rounded-lg flex items-center justify-center">
                    <div className="text-center text-base-content/50">
                      <div className="text-6xl mb-4">🌤️</div>
                      <div>点击生成按钮</div>
                      <div>创建你的天气NFT</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-base-content/70">
            <p>💡 每个地址每天每个城市只能铸造一枚NFT</p>
            <p>🎯 基于实时天气数据生成独特的数字纪念品</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Create;
