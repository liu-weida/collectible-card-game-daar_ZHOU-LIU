import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { PokemonTCG } from "pokemon-tcg-sdk-typescript";
import dotenv from "dotenv";

dotenv.config();

const setupPokemonCollections: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deployer } = await getNamedAccounts();


    const main = await ethers.getContract("Main", deployer);


    const accounts = await ethers.getSigners();
    const userAddresses = accounts.map(account => account.address);


    const ownerAddress = await main.owner();
    console.log(`Current contract owner: ${ownerAddress}`);

    if (ownerAddress !== deployer) {
        throw new Error("Deployer is not the contract owner. Please verify the deployer address.");
    }


    console.log("Creating a new Pokemon collection...");
    const collectionTx = await main.createCollection("Pokemon Base Set", 102);
    await collectionTx.wait();
    console.log("Pokemon collection created successfully!");


    const collectionAddress = await main.getCollection(0);
    const collection = await ethers.getContractAt("Collection", collectionAddress);


       console.log("Fetching Pokemon Base Set cards...");
    let baseSetCards;
    try {
        baseSetCards = await PokemonTCG.findSetByID('base1');
        console.log(`Fetched set: ${baseSetCards.name}`);
    } catch (error) {
        console.error("Error fetching base set: ", error);
        return;
    }

    const paramsV2 = { q: `set.id:${baseSetCards.id}` };
    let cards;
    try {
        cards = await PokemonTCG.findCardsByQueries(paramsV2);
        console.log(`Fetched ${cards.length} cards from Pokemon Base Set.`);
    } catch (error) {
        console.error("Error fetching cards: ", error);
        return;
    }


    for (let i = 0; i < cards.length && i < 100; i++) {
        const card = cards[i];
        console.log(`Minting a card for user ${i + 1}...`);
        const cardNumber = parseInt(card.number);
        const imgURI = card.images.large;
        try {
            const mintTx = await main.mintCard(0, userAddresses[i % userAddresses.length], cardNumber, imgURI);
            await mintTx.wait();
            console.log(`Card minted for user ${i + 1} with tokenId ${cardNumber} , img ${imgURI} successfully!`);
        } catch (error) {
            console.error(`Error minting card for user ${i + 1}: `, error);
        }
    }
};

export default setupPokemonCollections;
setupPokemonCollections.tags = ["SetupPokemonCollections"];
