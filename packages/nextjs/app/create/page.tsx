"use client";

import { useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { Address } from "~~/components/scaffold-eth";
import {
  useDeployedContractInfo,
  useScaffoldWatchContractEvent,
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";
import { PinataUploadResult, createWeatherNFTMetadata, uploadCompleteNFTToPinata } from "~~/lib/pinata";
import { type WeatherData, generateWeatherPrompt, getWeatherByCity, getWeatherByGeolocation } from "~~/lib/weather";

const Create: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { writeContractAsync: writeWeatherNFTAsync } = useScaffoldWriteContract({ contractName: "WeatherNFT" });
  const { data: weatherNFTContract } = useDeployedContractInfo("WeatherNFT");
  const [step, setStep] = useState<"idle" | "fetching" | "generating" | "uploading" | "minting" | "done">("idle");
  const [city, setCity] = useState("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [isUsingLocation, setIsUsingLocation] = useState(false);
  // const [ipfsData, setIpfsData] = useState<{
  //   imageUrl: string;
  //   metadataUrl: string;
  //   imageCid: string;
  //   metadataCid: string;
  // } | null>(null);
  // console.log(weatherNFTContract, "weatherNFTContract");
  const handleGenerate = async () => {
    if (!connectedAddress) {
      alert("请先连接钱包");
      return;
    }

    if (!city.trim() && !isUsingLocation) {
      alert("请输入城市名称或使用定位");
      return;
    }

    try {
      // Step 1: 获取天气数据
      setStep("fetching");
      let realWeatherData: WeatherData;
      if (isUsingLocation) {
        realWeatherData = await getWeatherByGeolocation();
        setCity(realWeatherData.city); // 更新城市名称显示
      } else {
        // TODO 这里获取地址逻辑有问题
        realWeatherData = await getWeatherByCity(city.trim());
      }

      setWeatherData(realWeatherData);

      // Step 2: 生成图像
      setStep("generating");

      let imageUrl = "";
      try {
        // 使用AI生成图像
        const prompt = generateWeatherPrompt(realWeatherData);
        imageUrl = await generateImageViaApi(prompt, connectedAddress);

        // setGeneratedImage(generatedImageUrl);
      } catch (error) {
        console.warn("AI generation failed, using fallback:", error);
        // 失败时使用fallback SVG
        imageUrl = generatePlaceholderSVG(realWeatherData);
        // setGeneratedImage(fallbackImage);
      }

      // Step 3: 上传到IPFS
      setStep("uploading");
      let uploadResult: PinataUploadResult | null = null;
      try {
        // 创建NFT metadata
        const metadata = createWeatherNFTMetadata(realWeatherData);

        // 生成临时 tokenID（实际应该在铸造后获取）
        const tempTokenId = `${Date.now()}`;
        // 上传图片和metadata到Pinata IPFS（包含合约地址和tokenID用于集合管理）
        uploadResult = await uploadCompleteNFTToPinata(
          imageUrl || "",
          metadata,
          weatherNFTContract?.address,
          tempTokenId,
        );

        console.log("Pinata Upload successful:", uploadResult);
        console.log("Contract address:", weatherNFTContract?.address);
      } catch (error) {
        console.warn("Pinata upload failed, continuing with local data:", error);
        // 即使Pinata上传失败，也继续流程（用于演示）
      }

      // await new Promise(resolve => setTimeout(resolve, 800));

      // Step 4: 铸造NFT
      setStep("minting");

      try {
        // 使用真实的合约交互
        const metadataUri =
          uploadResult?.metadataCid ||
          (() => {
            const metadata = createWeatherNFTMetadata(realWeatherData);
            const jsonString = JSON.stringify(metadata, null, 2);
            return `data:application/json;charset=utf-8,${encodeURIComponent(jsonString)}`;
          })();
        // debugger;
        const mintTx = await writeWeatherNFTAsync({
          functionName: "mintWithURI",
          args: [
            connectedAddress,
            realWeatherData.city,
            realWeatherData.date,
            realWeatherData.weather,
            BigInt(realWeatherData.temperature),
            realWeatherData.timeOfDay,
            metadataUri,
          ],
        });

        console.log("NFT Minted successfully! Transaction:", mintTx);

        // TODO 从交易日志中提取tokenId（简化处理）
        // setTokenId(Date.now()); // TODO 临时使用时间戳，实际应该从事件日志中获取
        setStep("done");
      } catch (error) {
        console.error("Minting failed:", error);
        setStep("idle");
        const errorMessage = error instanceof Error ? error.message : "铸造失败，请重试";
        alert(`铸造失败: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error:", error);
      setStep("idle");
      const errorMessage = error instanceof Error ? error.message : "生成失败，请重试";
      alert(errorMessage);
    }
  };

  const handleUseLocation = async () => {
    setIsUsingLocation(true);
    setCity("正在定位...");

    try {
      const locationWeather = await getWeatherByGeolocation();
      setCity(locationWeather.city);
      setWeatherData(locationWeather);
    } catch (error) {
      console.error("定位失败:", error);
      setCity("");
      setIsUsingLocation(false);
      const errorMessage = error instanceof Error ? error.message : "定位失败";
      alert(errorMessage);
    }
  };

  useScaffoldWatchContractEvent({
    contractName: "WeatherNFT",
    eventName: "WeatherNFTMinted",
    chainId: 31337,
    onLogs: logs => {
      if (logs.length > 0) {
        const event = logs[0];
        const tokenId = event.args?.tokenId;
        setTokenId(Number(tokenId));
      }
    },
  });

  const generateImageViaApi = async (prompt: string, address: string): Promise<string> => {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // TODO 需要修改width和height
      body: JSON.stringify({
        prompt,
        address, // <--- 新增 address
      }),
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status}`);
    }

    // 如果返回的是SVG，直接返回
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("image/svg+xml")) {
      const svgText = await response.text();
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    }

    // 如果返回的是图片，转换为data URL
    const imageBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString("base64");
    return `data:image/png;base64,${base64}`;
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

    // 使用 encodeURIComponent 而不是 btoa 来处理中文字符
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const resetFlow = () => {
    setStep("idle");
    setWeatherData(null);
    setGeneratedImage(null);
    setTokenId(null);
    setIsUsingLocation(false);
    // setIpfsData(null);
  };

  const getStepText = () => {
    switch (step) {
      case "fetching":
        return "🌍 获取天气数据...";
      case "generating":
        return "🎨 AI正在生成图片...";
      case "uploading":
        return "☁️ 上传到Pinata IPFS...";
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="例如：北京、上海、深圳..."
                    className="input input-bordered flex-1"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    disabled={step !== "idle"}
                  />
                  <button
                    className="btn btn-outline"
                    onClick={handleUseLocation}
                    disabled={step !== "idle"}
                    title="使用当前位置"
                  >
                    📍
                  </button>
                </div>
              </div>

              {weatherData && (
                <div className="bg-base-200 p-4 rounded-lg mb-4">
                  <h3 className="font-bold mb-2">📊 实时天气信息</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>🏙️ 城市: {weatherData.city}</div>
                    <div>🌍 国家: {weatherData.country}</div>
                    <div>📅 日期: {weatherData.date}</div>
                    <div>🌤️ 天气: {weatherData.weather}</div>
                    <div>🌡️ 温度: {weatherData.temperature}°C</div>
                    <div>⏰ 时段: {weatherData.timeOfDay}</div>
                    <div>💧 湿度: {weatherData.humidity}%</div>
                    <div>💨 风速: {weatherData.windSpeed} km/h</div>
                  </div>
                  <div className="mt-2 text-xs text-base-content/60">
                    📍 {weatherData.latitude.toFixed(4)}, {weatherData.longitude.toFixed(4)}
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
                      value={
                        step === "fetching"
                          ? 20
                          : step === "generating"
                            ? 40
                            : step === "uploading"
                              ? 70
                              : step === "minting"
                                ? 90
                                : 100
                      }
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
                      width={484}
                      height={484}
                      className="w-full rounded-lg shadow-lg"
                    />
                    <div className="mt-4 text-center">
                      <div className="badge badge-primary">AI生成的天气海报</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-sm h-[56rem] bg-base-200 rounded-lg flex items-center justify-center">
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
