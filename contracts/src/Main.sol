// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Collection.sol";
import "./Boosters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Main is Ownable {
    uint256 private collectionCount;
    uint256 private boostersCount;

    // 存储多个 Collection 合约实例
    mapping(uint256 => Collection) public collections;

    // 存储多个 Boosters 合约实例
    mapping(uint256 => Boosters) public boosters;

    // 事件定义
    event CollectionCreated(
        uint256 indexed collectionId,
        address collectionAddress,
        string name,
        uint256 cardCount
    );

    event BoostersCreated(
        uint256 indexed boostersId,
        address boostersAddress,
        string name
    );

    event BoosterMinted(
        uint256 indexed boostersId,
        uint256 tokenId,
        address owner,
        string imgURI
    );

    event ItemAddedToBooster(
        uint256 indexed boostersId,
        uint256 boosterTokenId,
        uint256 cardNumber
    );

    event ItemForSale(
        uint256 indexed boostersId,
        uint256 boosterTokenId,
        int256 price
    );

    event SaleCancelled(
        uint256 indexed boostersId,
        uint256 boosterTokenId
    );

    event BoosterSold(
        uint256 indexed boostersId,
        uint256 boosterTokenId,
        address indexed buyer,
        uint256 price
    );

    event BoosterRedeemed(
        uint256 indexed boostersId,
        uint256 indexed boosterTokenId,
        address indexed redeemer
    );

    /**
     * @dev 构造函数，初始化计数器
     */
    constructor() Ownable(msg.sender)  {
        collectionCount = 0;
        boostersCount = 0;
        _transferOwnership(msg.sender);
    }

    /**
     * @dev 创建新的卡牌集合
     * @param name 集合名称
     * @param cardCount 卡牌总数
     */
    function createCollection(
        string calldata name,
        uint256 cardCount
    ) external onlyOwner {
        Collection collection = new Collection(
            name,
            cardCount,
            address(this)
        );
        collections[collectionCount] = collection;
        emit CollectionCreated(collectionCount, address(collection), name, cardCount);
        collectionCount++;
    }

    /**
     * @dev 铸造新卡牌
     * @param collectionId 集合 ID
     * @param to 接收者地址
     * @param cardNumber 卡牌编号
     * @param imgURI 卡牌图片 URI
     */
    function mintCard(
        uint256 collectionId,
        address to,
        uint256 cardNumber,
        string calldata imgURI
    ) external onlyOwner {
        Collection collection = collections[collectionId];
        collection.mint(to, cardNumber, imgURI);
    }

    /**
     * @dev 设置卡牌为待售状态
     * @param collectionId 集合 ID
     * @param tokenId 卡牌 Token ID
     * @param price 出售价格
     */
    function setCardForSale(
        uint256 collectionId,
        uint256 tokenId,
        int256 price
    ) external {
        Collection collection = collections[collectionId];
        collection.setCardForSale(tokenId, price);
    }

    /**
     * @dev 取消卡牌的待售状态
     * @param collectionId 集合 ID
     * @param tokenId 卡牌 Token ID
     */
    function cancelSale(
        uint256 collectionId,
        uint256 tokenId
    ) external {
        Collection collection = collections[collectionId];
        collection.cancelSale(tokenId);
    }

    /**
     * @dev 创建新的 Boosters 合约实例
     * @param name Boosters 集合的名称
     * @param collectionId 关联的 Collection ID
     */
    function createBoosters(
        string calldata name,
        uint256 collectionId
    ) external onlyOwner {
        Boosters boostersInstance = new Boosters(name, msg.sender, collectionId);
        boosters[boostersCount] = boostersInstance;
        emit BoostersCreated(boostersCount, address(boostersInstance), name);
        boostersCount++;
    }

    /**
     * @dev 在指定的 Boosters 合约中铸造一个 Booster
     * @param boostersId Boosters 合约的 ID
     * @param to 接收者地址
     * @param imgURI Booster 图片 URI
     */
    function createBooster(
        uint256 boostersId,
        address to,
        string calldata imgURI
    ) external onlyOwner {
        Boosters boostersInstance = boosters[boostersId];
        boostersInstance.mintBooster(to, imgURI);
        uint256 boosterTokenId = boostersInstance.totalSupply(); // 获取最新的 Booster Token ID
        emit BoosterMinted(boostersId, boosterTokenId, to, imgURI);
    }

    /**
     * @dev 向指定的 Booster 中添加物品
     * @param boostersId Boosters 合约的 ID
     * @param boosterTokenId Booster 的 Token ID
     * @param cardNumber 卡牌编号
     * @param imgURI 卡牌图片 URI
     */
    function addItemToBooster(
        uint256 boostersId,
        uint256 boosterTokenId,
        uint256 cardNumber,
        string calldata imgURI
    ) external onlyOwner {
        Boosters boostersInstance = boosters[boostersId];
        boostersInstance.addItemToBooster(boosterTokenId, cardNumber, imgURI);
        emit ItemAddedToBooster(boostersId, boosterTokenId, cardNumber);
    }

    /**
     * @dev 设置 Booster 为待售状态
     * @param boostersId Boosters 合约的 ID
     * @param boosterTokenId Booster 的 Token ID
     * @param price 出售价格（单位：wei）
     */
    function setBoosterForSale(
        uint256 boostersId,
        uint256 boosterTokenId,
        int256 price
    ) external {
        Boosters boostersInstance = boosters[boostersId];
        boostersInstance.setBoosterForSale(boosterTokenId, price);
        emit ItemForSale(boostersId, boosterTokenId, price);
    }

    /**
     * @dev 取消 Booster 的出售状态
     * @param boostersId Boosters 合约的 ID
     * @param boosterTokenId Booster 的 Token ID
     */
    function cancelBoosterSale(
        uint256 boostersId,
        uint256 boosterTokenId
    ) external {
        Boosters boostersInstance = boosters[boostersId];
        boostersInstance.cancelSale(boosterTokenId);
        emit SaleCancelled(boostersId, boosterTokenId);
    }

    /**
     * @dev 购买待售的 Booster
     * @param boostersId Boosters 合约的 ID
     * @param boosterTokenId Booster 的 Token ID
     */
    function buyBooster(
        uint256 boostersId,
        uint256 boosterTokenId
    ) external payable {
        Boosters boostersInstance = boosters[boostersId];
        boostersInstance.buyBooster{value: msg.value}(boosterTokenId);
        emit BoosterSold(boostersId, boosterTokenId, msg.sender, msg.value);
    }

    /**
     * @dev 兑换一个 Booster，用户用它换取其中包含的卡牌
     * @param boosterTokenId Booster 的 Token ID
     */
    function redeemBooster(uint256 boosterTokenId) external {
        // 直接使用唯一的 Boosters 实例
        Boosters boostersInstance = boosters[0]; // 假设 boosters[0] 是唯一的 Boosters 实例
        require(boostersInstance.ownerOf(boosterTokenId) == msg.sender, "Main: Only booster owner can redeem");

        // 将 Booster 转移给合约的所有者（即管理员）
        boostersInstance.transferFrom(msg.sender, owner(), boosterTokenId);

        // 获取关联的 Collection
        uint256 collectionId = boostersInstance.collectionId();
        Collection collection = collections[collectionId];

        uint256 itemCount = boostersInstance.getBoosterItemCount(boosterTokenId);
        for (uint256 i = 0; i < itemCount; i++) {
            (uint256 cardNumber, string memory imgURI) = boostersInstance.getBoosterItem(boosterTokenId, i);

            // 铸造卡牌给兑换者
            collection.mint(msg.sender, cardNumber, imgURI);
        }


        // 触发 Booster 兑换事件
        emit BoosterRedeemed(0, boosterTokenId, msg.sender); // boostersId 为 0
    }



    /**
     * @dev 获取集合合约地址
     * @param collectionId 集合 ID
     * @return 集合合约地址
     */
    function getCollection(uint256 collectionId) external view returns (address) {
        return address(collections[collectionId]);
    }

    /**
     * @dev 获取 Boosters 合约地址
     * @param boostersId Boosters 合约的 ID
     * @return Boosters 合约地址
     */
    function getBoosters(uint256 boostersId) external view returns (address) {
        return address(boosters[boostersId]);
    }

    /**
     * @dev 获取总集合数量
     * @return 集合总数
     */
    function totalCollections() external view returns (uint256) {
        return collectionCount;
    }

    /**
     * @dev 获取总 Boosters 数量
     * @return Boosters 总数
     */
    function totalBoosters() external view returns (uint256) {
        return boostersCount;
    }
}