import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployGame: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    // 部署 Main 合约
    const mainDeployment = await deploy("Main", {
        from: deployer,
        args: [], // Main 合约构造函数没有参数
        log: true,
    });

    console.log(`Main 合约已部署到地址：${mainDeployment.address}`);

    // 获取 Main 合约实例
    const mainContract = await ethers.getContractAt("Main", mainDeployment.address);

    // 确认部署者是合约的所有者
    const ownerAddress = await mainContract.owner();
    if (ownerAddress !== deployer) {
        throw new Error("部署者不是 Main 合约的所有者，请检查部署过程。");
    }

    console.log(`Main 合约的所有者为：${ownerAddress}`);
};

export default deployGame;
deployGame.tags = ["Main"];
