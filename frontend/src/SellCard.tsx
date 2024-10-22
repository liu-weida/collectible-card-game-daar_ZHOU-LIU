import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from './SellCard.module.css';

const SellCard: React.FC = () => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const [price, setPrice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSell = async () => {
    if (!price || isNaN(Number(price))) {
      setError("Please enter a valid price.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/cards/sell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tokenId, price }),
      });

      if (response.ok) {
        alert("Card listed for sale successfully!");
        navigate("/");
      } else {
        setError("Failed to list the card for sale.");
      }
    } catch (error) {
      console.error("Error listing card for sale:", error);
      setError("An error occurred while listing the card for sale.");
    }
  };

  return (
    <div className={styles.container}>
      <h1>Sell Your NFT Card</h1>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.formGroup}>
        <label>Token ID: {tokenId}</label>
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Enter price in ETH"
        />
        <button onClick={handleSell}>Sell</button>
      </div>
    </div>
  );
};

export default SellCard;