import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import styles from './styles.module.css';
import axios from 'axios';
import CollectionArtifact from './abis/Collection.json';
import BoosterArtifact from './abis/Boosters.json'; // �e Booster ABI

declare global {
  interface Window {
    ethereum: any; // MetaMask � ethereum �a
  }
}

const ADMIN_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // �X0@

export const App = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [forSaleCards, setForSaleCards] = useState<any[]>([]);
  const [userBoosters, setUserBoosters] = useState<any[]>([]);
  const [forSaleBoosters, setForSaleBoosters] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [boosterErrorMessage, setBoosterErrorMessage] = useState<string | null>(null);

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);

          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await provider.getNetwork();
          if (network.chainId !== 5) { // ( Goerli K�Q:�
            setErrorMessage("Please switch to the Goerli network.");
          }
        } else {
          setErrorMessage('No account found.');
        }
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
        setErrorMessage('Error connecting to MetaMask.');
      }
    } else {
      setErrorMessage('MetaMask is not installed.');
    }
  };

  const getAccountBalance = async (account: string) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(account);
      setBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error("Error fetching balance:", error);
      setErrorMessage("Error fetching balance.");
    }
  };

  const fetchUserCards = async (account: string) => {
    try {
      const { data } = await axios.get(`http://localhost:3000/api/cards?userId=${account}`);
      setUserCards(data);
      if (data.length === 0) {
        setErrorMessage("No cards found for this user.");
      } else {
        setErrorMessage(null);
      }
    } catch (error) {
      console.error("Error fetching user cards:", error);
      setErrorMessage("An error occurred while fetching user cards.");
    }
  };

  const fetchUserBoosters = async (account: string) => {
    try {
      const { data } = await axios.get(`http://localhost:3000/api/boosters?userId=${account}`);
      setUserBoosters(data);
      if (data.length === 0) {
        setBoosterErrorMessage("No boosters found for this user.");
      } else {
        setBoosterErrorMessage(null);
      }
    } catch (error) {
      console.error("Error fetching user boosters:", error);
      setBoosterErrorMessage("An error occurred while fetching user boosters.");
    }
  };

  const fetchForSaleCards = async () => {
    try {
      const { data } = await axios.get('http://localhost:3000/api/cards/for-sale');
      setForSaleCards(data);
      if (data.length === 0) {
        setErrorMessage("No cards for sale.");
      } else {
        setErrorMessage(null);
      }
    } catch (error) {
      console.error("Error fetching for-sale cards:", error);
      setErrorMessage("An error occurred while fetching for-sale cards.");
    }
  };

  const fetchForSaleBoosters = async () => {
    try {
      const { data } = await axios.get('http://localhost:3000/api/boosters/for-sale');
      setForSaleBoosters(data);
      if (data.length === 0) {
        setBoosterErrorMessage("No boosters for sale.");
      } else {
        setBoosterErrorMessage(null);
      }
    } catch (error) {
      console.error("Error fetching for-sale boosters:", error);
      setBoosterErrorMessage("An error occurred while fetching for-sale boosters.");
    }
  };

  const purchaseCard = async (card: any) => {
    if (!account) {
      setErrorMessage('No account connected.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const collectionAddress = card.collectionAddress;
      const collectionContract = new ethers.Contract(collectionAddress, CollectionArtifact, signer);

      const priceInWei = ethers.BigNumber.from(card.price);

      const tx = await collectionContract.buyCard(card.tokenId, {
        value: priceInWei,
        gasLimit: ethers.utils.hexlify(300000)
      });

      await tx.wait();

      alert(`Successfully purchased card ${card.tokenId}`);
      fetchForSaleCards();
      fetchUserCards(account);
      getAccountBalance(account);
    } catch (error) {
      console.error("Error purchasing card:", error);
      setErrorMessage("An error occurred while purchasing the card.");
    }
  };

  const purchaseBooster = async (booster: any) => {
    if (!account) {
      setBoosterErrorMessage('No account connected.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const boosterAddress = booster.boosterAddress;
      const boosterContract = new ethers.Contract(booster.boosterAddress, BoosterArtifact, signer);

      const priceInWei = ethers.BigNumber.from(booster.price);

      const tx = await boosterContract.buyBooster(booster.tokenId, {
        value: priceInWei,
        gasLimit: ethers.utils.hexlify(300000)
      });

      await tx.wait();

      alert(`Successfully purchased booster ${booster.tokenId}`);
      fetchForSaleBoosters();
      fetchUserBoosters(account);
      getAccountBalance(account);
    } catch (error) {
      console.error("Error purchasing booster:", error);
      setBoosterErrorMessage("An error occurred while purchasing the booster.");
    }
  };

  const setCardForSale = async (card: any) => {
    if (!account) {
      setErrorMessage('No account connected.');
      return;
    }

    const price = prompt("Enter sale price in ETH:");

    if (price === null || price === '') {
      return;
    }

    try {
      const priceInWei = ethers.utils.parseEther(price);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const collectionAddress = card.collectionAddress;
      const collectionContract = new ethers.Contract(collectionAddress, CollectionArtifact, signer);

      const tx = await collectionContract.setCardForSale(card.tokenId, priceInWei, {
        gasLimit: ethers.utils.hexlify(300000)
      });

      await tx.wait();

      alert(`Card ${card.tokenId} is now for sale at ${price} ETH`);
      fetchUserCards(account);
      fetchForSaleCards();
    } catch (error) {
      console.error("Error setting card for sale:", error);
      setErrorMessage("An error occurred while setting the card for sale.");
    }
  };

  const setBoosterForSale = async (booster: any) => {
    if (!account) {
      setBoosterErrorMessage('No account connected.');
      return;
    }

    const price = prompt("Enter sale price in ETH:");

    if (price === null || price === '') {
      return;
    }

    try {
      const priceInWei = ethers.utils.parseEther(price);

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const boosterAddress = booster.boosterAddress;
      const boosterContract = new ethers.Contract(booster.boosterAddress, BoosterArtifact, signer);

      const tx = await boosterContract.setItemForSale(booster.tokenId, priceInWei, {
        gasLimit: ethers.utils.hexlify(300000)
      });

      await tx.wait();

      alert(`Booster ${booster.tokenId} is now for sale at ${price} ETH`);
      fetchUserBoosters(account);
      fetchForSaleBoosters();
    } catch (error) {
      console.error("Error setting booster for sale:", error);
      setBoosterErrorMessage("An error occurred while setting the booster for sale.");
    }
  };

  const cancelSale = async (card: any) => {
    if (!account) {
      setErrorMessage('No account connected.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const collectionAddress = card.collectionAddress;
      const collectionContract = new ethers.Contract(collectionAddress, CollectionArtifact, signer);

      const tx = await collectionContract.cancelSale(card.tokenId, {
        gasLimit: ethers.utils.hexlify(300000)
      });

      await tx.wait();

      alert(`Sale for card ${card.tokenId} has been canceled`);
      fetchUserCards(account);
      fetchForSaleCards();
    } catch (error) {
      console.error("Error canceling sale:", error);
      setErrorMessage("An error occurred while canceling the sale.");
    }
  };

  const cancelBoosterSale = async (booster: any) => {
    if (!account) {
      setBoosterErrorMessage('No account connected.');
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const boosterAddress = booster.boosterAddress;
      const boosterContract = new ethers.Contract(booster.boosterAddress, BoosterArtifact, signer);

      const tx = await boosterContract.cancelSale(booster.tokenId, {
        gasLimit: ethers.utils.hexlify(300000)
      });

      await tx.wait();

      alert(`Sale for booster ${booster.tokenId} has been canceled`);
      fetchUserBoosters(account);
      fetchForSaleBoosters();
    } catch (error) {
      console.error("Error canceling booster sale:", error);
      setBoosterErrorMessage("An error occurred while canceling the booster sale.");
    }
  };

  useEffect(() => {
    connectMetaMask();
  }, []);

  useEffect(() => {
    if (account) {
      getAccountBalance(account);
      fetchUserCards(account);
      fetchUserBoosters(account);
    }
  }, [account]);

  return (
      <div className={styles.body}>
        <h1>My DApp</h1>
        {account ? (
            <div>
              <p>Connected account: {account.slice(0, 6)}...{account.slice(-4)}</p>
              {balance ? <p>Balance: {balance} ETH</p> : <p>Loading balance...</p>}

              <div>
                <h3>User Cards:</h3>
                {userCards.length > 0 ? (
                    <ul>
                      {userCards.map((card) => (
                          <li key={card.tokenId}>
                            <p>Card ID: {card.tokenId}</p>
                            <p>Name: {card.name}</p>
                            <p>Description: {card.description}</p>
                            <p>For Sale: {card.isForSale ? 'Yes' : 'No'}</p>
                            {card.isForSale && <p>Price: {ethers.utils.formatEther(card.price)} ETH</p>}
                            <img src={card.image} alt={card.name} width="200" />
                            {/* >: isBooster � boosterTokenId�	�X�� */}
                            {account == ADMIN_ADDRESS && (
                                <div>
                                  <p>Is Booster: {card.isInBooster ? 'Yes' : 'No'}</p>
                                  {card.isInBooster && <p>Booster Token ID: {card.boosterInfo}</p>}
                                </div>
                            )}
                            {card.isForSale ? (
                                <button onClick={() => cancelSale(card)}>Cancel Sale</button>
                            ) : (
                                <button onClick={() => setCardForSale(card)}>Set for Sale</button>
                            )}
                          </li>
                      ))}
                    </ul>
                ) : (
                    <p>{errorMessage ? errorMessage : "Loading cards..."}</p>
                )}
              </div>

              <div>
                <button onClick={fetchForSaleCards}>Card Market</button>
                <h3>For Sale Cards:</h3>
                {forSaleCards.length > 0 ? (
                    <ul>
                      {forSaleCards.map((card) => (
                          <li key={card.tokenId}>
                            <p>Card ID: {card.tokenId}</p>
                            <p>Name: {card.name}</p>
                            <p>Description: {card.description}</p>
                            <p>Price: {ethers.utils.formatEther(card.price)} ETH</p>
                            <img src={card.image} alt={card.name} width="200" />
                            <button onClick={() => purchaseCard(card)}>
                              Purchase
                            </button>
                          </li>
                      ))}
                    </ul>
                ) : (
                    <p>{errorMessage ? errorMessage : "Loading for-sale cards..."}</p>
                )}
              </div>

              <div>
                <h3>User Boosters:</h3>
                {userBoosters.length > 0 ? (
                    <ul>
                      {userBoosters.map((booster) => (
                          <li key={booster.tokenId}>
                            <p>Booster ID: {booster.tokenId}</p>
                            <p>Name: {booster.name}</p>
                            <p>Description: {booster.description}</p>
                            <p>For Sale: {booster.isForSale ? 'Yes' : 'No'}</p>
                            {booster.isForSale && <p>Price: {ethers.utils.formatEther(booster.price)} ETH</p>}
                            <img src={booster.image} alt={booster.name} width="200" />
                            {booster.isForSale ? (
                                <button onClick={() => cancelBoosterSale(booster)}>Cancel Sale</button>
                            ) : (
                                <button onClick={() => setBoosterForSale(booster)}>Set for Sale</button>
                            )}
                          </li>
                      ))}
                    </ul>
                ) : (
                    <p>{boosterErrorMessage ? boosterErrorMessage : "Loading boosters..."}</p>
                )}
              </div>

              <div>
                <button onClick={fetchForSaleBoosters}>Booster Market</button>
                <h3>For Sale Boosters:</h3>
                {forSaleBoosters.length > 0 ? (
                    <ul>
                      {forSaleBoosters.map((booster) => (
                          <li key={booster.tokenId}>
                            <p>Booster ID: {booster.tokenId}</p>
                            <p>Name: {booster.name}</p>
                            <p>Description: {booster.description}</p>
                            <p>Price: {ethers.utils.formatEther(booster.price)} ETH</p>
                            <img src={booster.image} alt={booster.name} width="200" />
                            <button onClick={() => purchaseBooster(booster)}>
                              Purchase
                            </button>
                          </li>
                      ))}
                    </ul>
                ) : (
                    <p>{boosterErrorMessage ? boosterErrorMessage : "Loading for-sale boosters..."}</p>
                )}
              </div>
            </div>
        ) : (
            <div>
              {errorMessage ? (
                  <p style={{ color: 'red' }}>{errorMessage}</p>
              ) : (
                  <p>Connecting to MetaMask...</p>
              )}
            </div>
        )}
      </div>
  );
};