import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployGame: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();


    const mainDeployment = await deploy("Main", {
        from: deployer,
        args: [],
        log: true,
    });

    console.log(`The main contract has been deployed to the address:${mainDeployment.address}`);


    const mainContract = await ethers.getContractAt("Main", mainDeployment.address);


    const ownerAddress = await mainContract.owner();
    if (ownerAddress !== deployer) {
        throw new Error("The deployer is not the owner of the Main contract, please check the deployment process.");
    }

    console.log(`Main Contract owner:${ownerAddress}`);
};

export default deployGame;
deployGame.tags = ["Main"];
