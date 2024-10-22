const express = require('express');
const cors = require('cors');
const ethers = require('ethers');
const CollectionABI = require('../contracts/artifacts/src/Collection.sol/Collection.json').abi;
const MainABI = require('../contracts/artifacts/src/Main.sol/Main.json').abi;
const BoostersABI = require('../contracts/artifacts/src/Boosters.sol/Boosters.json').abi;
const { PokemonTCG } = require('pokemon-tcg-sdk-typescript');

const app = express();
const port = 3000;


const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const mainContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const mainContract = new ethers.Contract(mainContractAddress, MainABI, provider);


app.use(express.json());


let userCardsCache = {};
let userBoostersCache = {};
let forSaleBoostersCache = [];

const zeroAddress = '0x0000000000000000000000000000000000000000';


const convertBigIntToString = (obj) => {
  if (typeof obj === 'bigint') {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, convertBigIntToString(value)]));
  }
  return obj;
};

let pokemonCardsCache = [];

const fetchPokemonCards = async () => {
  try {
    console.log("Fetching Pokémon cards...");
    const response = await PokemonTCG.findSetsByQueries({ q: 'id:base1' });
    if (response.length === 0) {
      throw new Error("Base set not found");
    }
    const baseSetId = response[0].id;
    const cardsResponse = await PokemonTCG.findCardsByQueries({ q: `set.id:${baseSetId}` });
    pokemonCardsCache = cardsResponse;
    console.log("Pokémon cards fetched successfully!");
  } catch (error) {
    console.error("Error fetching Pokémon cards from API:", error);
  }
};


const fetchUserCards = async () => {
  try {

    if (pokemonCardsCache.length === 0) {
      console.error("Error: pokemonCardsCache is empty. Make sure to fetch Pokemon cards first.");
      return;
    }

    console.log("Fetching total collections...");
    const totalCollections = await mainContract.totalCollections();
    let totalCollectionsNumber = Number(totalCollections);

    console.log("Total collections:", totalCollectionsNumber);

    const userCards = {};

    for (let i = 0; i < totalCollectionsNumber; i++) {
      console.log(`Fetching collection address for collection ${i}`);
      const collectionAddress = await mainContract.getCollection(i);
      console.log(`Collection address ${i}:`, collectionAddress);

      const collection = new ethers.Contract(collectionAddress, CollectionABI, provider);

      console.log("Querying Transfer events...");
      const events = await collection.queryFilter(collection.filters.Transfer());
      console.log(`Found ${events.length} Transfer events`);

      for (const event of events) {
        const { from, to, tokenId } = event.args;
        console.log(`Event: from ${from}, to ${to}, tokenId ${tokenId.toString()}`);

        const userAddress = to.toLowerCase();

        if (!userCards[userAddress]) {
          userCards[userAddress] = [];
        }

        const cardIndex = (Number(tokenId) - 1);
        const cardDetails = pokemonCardsCache[cardIndex];

        if (cardDetails) {
          
          const cardDetailFromContract = await collection.cardDetails(tokenId);

          userCards[userAddress].push({
            tokenId: tokenId.toString(),
            name: cardDetails.name,
            image: cardDetails.images.large,
            isForSale: cardDetailFromContract.isForSale,
            price: cardDetailFromContract.price.toString(),
            collectionId: i.toString(),
            collectionAddress: collectionAddress
          });
        } else {
          console.error(`Card details for tokenId ${tokenId} not found in pokemonCardsCache.`);
        }
      }
    }

    userCardsCache = userCards;
    console.log("User cards data cached successfully!");

  } catch (error) {
    console.error("Error fetching user cards from blockchain:", error);
  }
};


const fetchBoostersData = async () => {
  try {
    console.log("Fetching total boosters...");
    const totalBoosters = await mainContract.totalBoosters();
    let totalBoostersNumber = Number(totalBoosters);

    console.log(`Total boosters: ${totalBoostersNumber}`);

    const userBoosters = {};
    const forSaleBoosters = [];


    for (let i = 0; i < totalBoostersNumber; i++) {
      console.log(`Fetching booster address for booster ${i}`);
      const boosterAddress = await mainContract.getBoosters(i);
      console.log(`Booster address ${i}: ${boosterAddress}`);

      const booster = new ethers.Contract(boosterAddress, BoostersABI, provider);

      console.log("Querying Transfer events for Booster...");
      const events = await booster.queryFilter(booster.filters.Transfer());
      console.log(`Found ${events.length} Transfer events for Booster ${i}`);

      for (const event of events) {
        const { from, to, tokenId } = event.args;
        console.log(`Booster Event: from ${from}, to ${to}, tokenId ${tokenId.toString()}`);

        const fromAddress = from.toLowerCase();
        const toAddress = to.toLowerCase();


        if (fromAddress !== zeroAddress) {
          if (userBoosters[fromAddress]) {
            userBoosters[fromAddress] = userBoosters[fromAddress].filter(
                (boosterItem) => !(boosterItem.tokenId === tokenId.toString() && boosterItem.boosterAddress === boosterAddress)
            );
          }
        }


        if (!userBoosters[toAddress]) {
          userBoosters[toAddress] = [];
        }


        const boosterDetails = await booster.itemDetails(tokenId);
        const boosterImgURIs = await booster.imgURIs(tokenId);

        userBoosters[toAddress].push({
          tokenId: tokenId.toString(),
          name: `Booster #${tokenId.toString()}`,
          image: boosterImgURIs,
          isForSale: boosterDetails.isForSale,
          price: boosterDetails.price.toString(),
          boosterId: i.toString(),
          boosterAddress: boosterAddress
        });


        if (boosterDetails.isForSale) {
          forSaleBoosters.push({
            tokenId: tokenId.toString(),
            name: `Booster #${tokenId.toString()}`,
            image: boosterImgURIs,
            price: boosterDetails.price.toString(),
            boosterId: i.toString(),
            boosterAddress: boosterAddress,
            owner: toAddress
          });
        }
      }
    }

    userBoostersCache = userBoosters;
    forSaleBoostersCache = forSaleBoosters;

    console.log("User boosters data cached successfully!");
  } catch (error) {
    console.error("Error fetching boosters data from blockchain:", error);
  }
};


(async () => {
  try {
    await fetchPokemonCards();
    await fetchUserCards();
    await fetchBoostersData();
  } catch (error) {
    console.error("Error initializing card data:", error);
  }
})();


setInterval(fetchUserCards, 5000);
setInterval(fetchBoostersData, 5000);


app.use(cors());


app.get('/api/cards', (req, res) => {
  const userId = req.query.userId;
  const cardId = req.query.cardId;

  if (userId) {
    const userCards = userCardsCache[userId.toLowerCase()];
    if (userCards) {
      res.json(convertBigIntToString(userCards));
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } else if (cardId) {
    const cardIdNumber = cardId.toString(); 
    const cards = Object.values(userCardsCache).flat();
    const card = cards.find(c => c.tokenId === cardIdNumber);
    if (card) {
      res.json(convertBigIntToString(card));  
    } else {
      res.status(404).json({ error: 'Card not found' });
    }
  } else {
    res.json(convertBigIntToString(userCardsCache)); 
  }
});


app.get('/api/cards/for-sale', (req, res) => {
  try {
    const forSaleCards = [];

    Object.values(userCardsCache).forEach(userCards => {
      userCards.forEach(card => {
        if (card.isForSale) {
          forSaleCards.push(card);
        }
      });
    });

    res.json(convertBigIntToString(forSaleCards)); 
  } catch (error) {
    console.error("Error fetching for-sale cards:", error);
    res.status(500).json({ error: 'An error occurred while fetching for-sale cards.' });
  }
});


app.get('/nft/all', (req, res) => {
  try {
    const userIds = Object.keys(userCardsCache);
    res.json(userIds);
  } catch (error) {
    console.error("Error fetching all user IDs:", error);
    res.status(500).json({ error: 'An error occurred while fetching all user IDs.' });
  }
});


app.get('/nft/userID', (req, res) => {
  const userId = req.query.userId;

  if (userId) {
    const userCards = userCardsCache[userId.toLowerCase()]; 
    if (userCards) {
      res.json(convertBigIntToString(userCards));  
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } else {
    res.status(400).json({ error: 'User ID is required' });
  }
});


app.get('/api/boosters', (req, res) => {
  const userId = req.query.userId;
  const boosterId = req.query.boosterId;

  if (userId) {
    const userBoosters = userBoostersCache[userId.toLowerCase()]; 
    if (userBoosters) {
      res.json(convertBigIntToString(userBoosters));  
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } else if (boosterId) {
    const boosterIdNumber = boosterId.toString(); 
    const boosters = Object.values(userBoostersCache).flat();
    const booster = boosters.find(b => b.tokenId === boosterIdNumber);
    if (booster) {
      res.json(convertBigIntToString(booster));  
    } else {
      res.status(404).json({ error: 'Booster not found' });
    }
  } else {
    res.json(convertBigIntToString(userBoostersCache)); 
  }
});


app.get('/api/boosters/for-sale', (req, res) => {
  try {
    res.json(convertBigIntToString(forSaleBoostersCache)); 
  } catch (error) {
    console.error("Error fetching for-sale boosters:", error);
    res.status(500).json({ error: 'An error occurred while fetching for-sale boosters.' });
  }
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});