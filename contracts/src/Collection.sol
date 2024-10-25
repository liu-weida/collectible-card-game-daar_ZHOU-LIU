// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract Collection is ERC721, Ownable {
    using Strings for uint256;

    uint256 public cardCount; // 卡牌总数
    uint256 private _tokenIdCounter; // Token ID 计数器
    string public collectionName; // 集合的名字

    // 用于记录 tokenId 是否存在
    mapping(uint256 => bool) public tokenExists;

    // 卡牌的详细信息，包括是否待售和价格
    struct CardDetails {
        bool isForSale; // 是否待售
        int256 price;   // 出售价格
    }

    mapping(uint256 => uint256) public cardNumbers; // tokenId => 卡牌编号
    mapping(uint256 => string) public imgURIs;      // tokenId => 图片 URI
    mapping(uint256 => CardDetails) public cardDetails; // tokenId => 卡牌详细信息

    // 合约构造函数，初始化卡牌集合
    constructor(string memory _name, uint256 _cardCount, address owner_) ERC721(_name, "CARD") Ownable(msg.sender) {
        collectionName = _name;
        cardCount = _cardCount;
        _tokenIdCounter = 1; // Token ID 从1开始
        _transferOwnership(owner_);
    }

    // 铸造新卡牌，并初始化卡牌属性
    function mint(address to, uint256 cardNumber, string memory imgURI) external onlyOwner {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        cardNumbers[tokenId] = cardNumber;
        imgURIs[tokenId] = imgURI;

        // 初始化卡牌详细信息
        cardDetails[tokenId] = CardDetails({
            isForSale: false,
            price: -1  // 非出售状态
        });

        // 记录该 tokenId 已经存在
        tokenExists[tokenId] = true;
    }

    // 设置卡牌为待售状态（仅限卡牌持有者）
    function setCardForSale(uint256 tokenId, int256 price) external {
        require(tokenExists[tokenId], "Card does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only card owner can set for sale");
        require(price > 0, "Price must be greater than 0");
        cardDetails[tokenId].isForSale = true;
        cardDetails[tokenId].price = price;
    }

    // 取消卡牌的出售状态（仅限卡牌持有者）
    function cancelSale(uint256 tokenId) external {
        require(tokenExists[tokenId], "Card does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only card owner can cancel sale");
        cardDetails[tokenId].isForSale = false;
        cardDetails[tokenId].price = -1;  // 恢复为非出售状态
    }

    // 购买卡牌
    function buyCard(uint256 tokenId) external payable {
        require(tokenExists[tokenId], "Card does not exist");
        CardDetails storage details = cardDetails[tokenId];
        require(details.isForSale, "Card is not for sale");
        require(msg.value >= uint256(details.price), "Insufficient payment");

        address previousOwner = ownerOf(tokenId);
        require(previousOwner != msg.sender, "Cannot buy your own card");

        // 转移 NFT 所有权
        _transfer(previousOwner, msg.sender, tokenId);

        // 更新卡牌详情
        details.isForSale = false;
        details.price = -1; // 取消出售状态

        // 使用 call 转账给前任持有者
        (bool sent, ) = payable(previousOwner).call{value: msg.value}("");
        require(sent, "Failed to send Ether");
    }

    // 优化后的 tokenURI 函数
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenExists[tokenId], "Card does not exist");
        string memory json = _buildTokenURI(tokenId);
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    // 将 JSON 构建移入私有函数，减少主函数的变量数量
    function _buildTokenURI(uint256 tokenId) private view returns (string memory) {
        CardDetails memory details = cardDetails[tokenId];
        string memory cardNumberStr = cardNumbers[tokenId].toString();
        string memory ownerAddress = Strings.toHexString(uint256(uint160(ownerOf(tokenId))), 20);
        string memory isForSaleStr = details.isForSale ? "Yes" : "No";
        string memory priceStr = details.price > 0 ? Strings.toString(uint256(details.price)) : "Not for sale";

        return Base64.encode(
            bytes(
                abi.encodePacked(
                    '{"name":"',
                    name(),
                    ' #',
                    cardNumberStr,
                    '", "description":"',
                    collectionName,
                    ' Collection Card", "image":"',
                    imgURIs[tokenId],
                    '", "attributes":['
                    '{"trait_type":"Card Number","value":"', cardNumberStr, '"},',
                    '{"trait_type":"For Sale","value":"', isForSaleStr, '"},',
                    '{"trait_type":"Price","value":"', priceStr, '"},',
                    '{"trait_type":"Owner","value":"', ownerAddress, '"}'
                ']}'
                )
            )
        );
    }
}