"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MetaHeader } from "~~/components/MetaHeader";
import { Address } from "~~/components/scaffold-eth";

interface NFTItem {
  tokenId: number;
  city: string;
  date: string;
  weather: string;
  temperature: number;
  timeOfDay: string;
  imageUrl: string;
  metadataUrl: string;
}

function generateMockImage(city: string, weather: string, temp: number) {
  const getWeatherColor = (weather: string) => {
    if (weather.includes("晴")) return "#FFD700";
    if (weather.includes("云")) return "#B0C4DE";
    if (weather.includes("雨")) return "#4682B4";
    return "#87CEEB";
  };

  const getWeatherEmoji = (weather: string) => {
    if (weather.includes("晴")) return "☀️";
    if (weather.includes("云")) return "☁️";
    if (weather.includes("雨")) return "🌧️";
    return "🌤️";
  };

  const bgColor = getWeatherColor(weather);
  const emoji = getWeatherEmoji(weather);

  const svg = `
    <svg width="300" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-${city}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#4682B4;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="300" height="400" fill="url(#bg-${city})"/>
      
      <text x="150" y="60" text-anchor="middle" fill="white" font-size="24" font-weight="bold">${city}</text>
      <text x="150" y="120" text-anchor="middle" fill="white" font-size="40">${emoji}</text>
      <text x="150" y="180" text-anchor="middle" fill="white" font-size="36" font-weight="bold">${temp}°C</text>
      <text x="150" y="220" text-anchor="middle" fill="white" font-size="18">${weather}</text>
      <text x="150" y="350" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="12">Weather NFT</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// 模拟NFT数据
const mockNFTs: NFTItem[] = [
  {
    tokenId: 1,
    city: "北京",
    date: "2024-08-22",
    weather: "晴天",
    temperature: 28,
    timeOfDay: "下午",
    imageUrl: generateMockImage("北京", "晴天", 28),
    metadataUrl: "ipfs://QmExample1",
  },
  {
    tokenId: 5,
    city: "上海",
    date: "2024-08-21",
    weather: "多云",
    temperature: 26,
    timeOfDay: "上午",
    imageUrl: generateMockImage("上海", "多云", 26),
    metadataUrl: "ipfs://QmExample2",
  },
  {
    tokenId: 12,
    city: "深圳",
    date: "2024-08-20",
    weather: "雨天",
    temperature: 24,
    timeOfDay: "晚上",
    imageUrl: generateMockImage("深圳", "雨天", 24),
    metadataUrl: "ipfs://QmExample3",
  },
];

const MyNFTs: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [nfts, setNfts] = useState<NFTItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null);

  const loadNFTs = useCallback(async () => {
    setLoading(true);
    try {
      // 模拟加载延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 在实际应用中，这里会调用合约的getOwnedTokens函数
      setNfts(mockNFTs);
    } catch (error) {
      console.error("Error loading NFTs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connectedAddress) {
      loadNFTs();
    }
  }, [connectedAddress, loadNFTs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const openInNewTab = (url: string) => {
    window.open(url, "_blank");
  };

  if (!connectedAddress) {
    return (
      <>
        <MetaHeader title="我的NFT | AI Moment NFT" description="查看你拥有的天气NFT收藏" />
        <div className="flex items-center flex-col flex-grow pt-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">🔒 请连接钱包</h1>
            <p className="text-lg text-base-content/70">连接你的钱包以查看你的天气NFT收藏</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MetaHeader title="我的NFT | AI Moment NFT" description="查看你拥有的天气NFT收藏" />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 w-full max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">🎨 我的天气NFT</h1>
            <p className="text-lg text-base-content/70">我的数字天气纪念收藏</p>
            <div className="mt-4">
              <Address address={connectedAddress} />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center gap-4">
                <span className="loading loading-spinner loading-lg"></span>
                <span>正在加载你的NFT...</span>
              </div>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🌤️</div>
              <h2 className="text-2xl font-bold mb-2">还没有NFT</h2>
              <p className="text-base-content/70 mb-6">快去创建你的第一个天气NFT吧！</p>
              <button className="btn btn-primary" onClick={() => (window.location.href = "/create")}>
                立即创建
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nfts.map(nft => (
                  <div key={nft.tokenId} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                    <figure className="px-4 pt-4">
                      <Image
                        src={nft.imageUrl}
                        alt={`Weather NFT #${nft.tokenId}`}
                        width={300}
                        height={256}
                        className="rounded-xl w-full h-64 object-cover cursor-pointer"
                        onClick={() => setSelectedNFT(nft)}
                      />
                    </figure>
                    <div className="card-body">
                      <h2 className="card-title">
                        #{nft.tokenId} - {nft.city}
                        <div className="badge badge-secondary">{nft.weather}</div>
                      </h2>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>📅 日期:</span>
                          <span>{formatDate(nft.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🌡️ 温度:</span>
                          <span>{nft.temperature}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span>⏰ 时段:</span>
                          <span>{nft.timeOfDay}</span>
                        </div>
                      </div>
                      <div className="card-actions justify-end mt-4">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            openInNewTab(`https://opensea.io/assets/ethereum/CONTRACT_ADDRESS/${nft.tokenId}`)
                          }
                        >
                          在OpenSea查看
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => setSelectedNFT(nft)}>
                          详情
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <div className="stats shadow">
                  <div className="stat">
                    <div className="stat-title">总计NFT</div>
                    <div className="stat-value">{nfts.length}</div>
                    <div className="stat-desc">我的天气收藏</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* NFT详情模态框 */}
          {selectedNFT && (
            <div className="modal modal-open">
              <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-lg mb-4">Weather NFT #{selectedNFT.tokenId}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Image
                      src={selectedNFT.imageUrl}
                      alt={`Weather NFT #${selectedNFT.tokenId}`}
                      width={300}
                      height={400}
                      className="w-full rounded-lg"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">📊 NFT信息</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Token ID:</span>
                          <span className="font-mono">#{selectedNFT.tokenId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>城市:</span>
                          <span>{selectedNFT.city}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>日期:</span>
                          <span>{formatDate(selectedNFT.date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>天气:</span>
                          <span>{selectedNFT.weather}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>温度:</span>
                          <span>{selectedNFT.temperature}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span>时段:</span>
                          <span>{selectedNFT.timeOfDay}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">🔗 外部链接</h4>
                      <div className="space-y-2">
                        <button
                          className="btn btn-outline btn-sm w-full"
                          onClick={() => openInNewTab(selectedNFT.metadataUrl)}
                        >
                          查看IPFS元数据
                        </button>
                        <button
                          className="btn btn-outline btn-sm w-full"
                          onClick={() =>
                            openInNewTab(`https://etherscan.io/token/CONTRACT_ADDRESS?a=${selectedNFT.tokenId}`)
                          }
                        >
                          在Etherscan查看
                        </button>
                        <button
                          className="btn btn-outline btn-sm w-full"
                          onClick={() =>
                            openInNewTab(`https://opensea.io/assets/ethereum/CONTRACT_ADDRESS/${selectedNFT.tokenId}`)
                          }
                        >
                          在OpenSea查看
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-action">
                  <button className="btn" onClick={() => setSelectedNFT(null)}>
                    关闭
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MyNFTs;
