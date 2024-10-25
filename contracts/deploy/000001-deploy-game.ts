import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployGame: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    // 部署 Main 合约
    const mainDeployment = await deploy("Main", {
        from: deployer,
        args: [], 
        log: true,
    });

    console.log(`Contrat principal déployé pour répondre à：${mainDeployment.address}`);

    // 获取 Main 合约实例
    const mainContract = await ethers.getContractAt("Main", mainDeployment.address);

    // 确认部署者是合约的所有者
    const ownerAddress = await mainContract.owner();
    if (ownerAddress !== deployer) {
        throw new Error("Le déployeur n'est pas le propriétaire du contrat principal, vérifiez le processus de déploiement.");
    }

    console.log(`Les principaux contrats sont détenus par：${ownerAddress}`);
};

export default deployGame;
deployGame.tags = ["Main"];
