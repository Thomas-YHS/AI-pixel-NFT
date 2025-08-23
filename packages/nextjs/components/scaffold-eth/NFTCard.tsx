import { useEffect, useState } from "react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { NFTAttribute, NFTItem } from "~~/types/nft";

interface NFTCardProps {
  tokenId: bigint;

  // onCardClick: (nft: NFTItem) => void;
  // onOpenSeaClick: (tokenId: number) => void;
  formatDate: (dateString: string) => string;
}
// onCardClick, onOpenSeaClick, formatDate

export const NFTCard: React.FC<NFTCardProps> = ({ tokenId }) => {
  const [nft, setNft] = useState<NFTItem | null>(null);
  // 获取 tokenURI
  const { data: tokenURI } = useScaffoldReadContract({
    contractName: "WeatherNFT",
    functionName: "tokenURI",
    args: [tokenId],
  });
  const ipfsRpc = "https://ipfs.io/ipfs/";

  const fetchNFTData = async (cid: string) => {
    const response = await fetch(`${ipfsRpc}${cid}`);
    const data = await response.json();
    console.log("data", data);
    setNft(data);
  };

  useEffect(() => {
    try {
      if (tokenURI) {
        fetchNFTData(tokenURI);
      }
    } catch (error) {
      console.error(error);
    }
  }, [tokenURI]);

  // 获取所有者（可选，因为已知是当前用户）
  // const { data: owner } = useScaffoldReadContract({
  //   contractName: "WeatherNFT",
  //   functionName: "ownerOf",
  //   args: [tokenId],
  // });

  return (
    nft && (
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
        <figure className="px-4 pt-4">
          <img
            className="rounded-xl w-full h-64 cursor-pointer"
            src={nft?.image || ""}
            alt={`Weather NFT #${tokenId}`}
          />
        </figure>
        <div className="card-body">
          <h2 className="card-title">
            {nft.name}
            {/* <div className="badge badge-secondary">{nft.weather}</div> */}
          </h2>
          <div className="space-y-1 text-sm">
            {nft?.attributes?.map((attribute: NFTAttribute) => (
              <div className="flex justify-between" key={attribute.trait_type}>
                <span>{attribute.trait_type}:</span>
                <span>{attribute.value}</span>
              </div>
            ))}
          </div>
          <div className="card-actions justify-end mt-4">
            <button className="btn btn-outline btn-sm">在OpenSea查看</button>
            <button className="btn btn-primary btn-sm">详情</button>
          </div>
        </div>
      </div>
    )
  );
};
