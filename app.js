import React, { useState } from 'react';
import { ethers } from 'ethers';
import './App.css';

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [networkName, setNetworkName] = useState('');
  const [tokenBalance, setTokenBalance] = useState(0);

  const networks = {
    fantom: { chainId: "0xfa2", rpcUrl: "https://fantom.api.onfinality.io/public", logo: "https://avatars.githubusercontent.com/u/39045722?s=48&v=4" },
    blast: { chainId: "0x1a4", rpcUrl: "https://sepolia.blast.io", logo: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ffreecoins24.io%2Fwp-content%2Fuploads%2F2023%2F11%2FBlast-network-logo.jpg&f=1&nofb=1&ipt=db0dcbd5c3cbb1eb8607d162e2758193fe79be975e3214756fa7b428a60a773a&ipo=images" },
    ethereum: { chainId: "0xaa36a7", rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com", logo: "https://avatars.githubusercontent.com/u/6250754?s=48&v=4" },
    moonbeam: { chainId: "0x507", rpcUrl: "https://moonbase-alpha.public.blastapi.io", logo: "https://avatars.githubusercontent.com/u/84856768?s=48&v=4" }
  };

  const interchainTokenABI = [/* ABI array here */];
  const wETHABI = [/* Wrapped Ethereum ABI here */];
  const wrappedFTMABI = [/* Axelar Wrapped FTM ABI here */];
  const wrappedWMATICABI = [/* Axelar Wrapped WMATIC ABI here */];

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setCurrentAccount(accounts[0]);
        console.log('Connected to MetaMask');
        showTokenBalance();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      console.error('MetaMask not detected');
    }
  };

  const disconnectWallet = () => {
    setCurrentAccount(null);
    window.location.reload();
  };

  const switchBlockchain = async (chainId, rpcUrl, chainName) => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.utils.hexValue(parseInt(chainId, 16)) }]
        });
        setNetwork(chainName);
        showTokenBalance();
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: ethers.utils.hexValue(parseInt(chainId, 16)),
                rpcUrls: [rpcUrl],
                chainName: chainName
              }]
            });
            setNetwork(chainName);
            showTokenBalance();
          } catch (addError) {
            console.error('Failed to add or switch blockchain network:', addError);
          }
        } else {
          console.error('Failed to switch blockchain network:', switchError);
        }
      }
    }
  };

  const setNetwork = (chainName) => {
    setNetworkName(chainName);
    updateTokenOptions(chainName);
  };

  const updateTokenOptions = (chainName) => {
    const sourceTokenSelect = document.getElementById('sourceToken');
    sourceTokenSelect.innerHTML = `
      <option value="tTWG">Trump Wif Grill (tTWG)</option>
      <option value="wETH">Wrapped Ethereum (wETH)</option>
      <option value="wFTM">Wrapped Fantom (wFTM)</option>
      <option value="wMATIC">Wrapped Matic (wMATIC)</option>
      <option value="custom">Custom Token</option>
    `;
  };

  const showTokenBalance = async () => {
    if (!currentAccount) return;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const selectedToken = document.getElementById('sourceToken').value;
    let tokenAddress;
    let tokenABI;

    switch (selectedToken) {
      case 'tTWG':
        tokenAddress = '0xF659A577B56A8D5d124ac740670429AbEE9160C4';
        tokenABI = interchainTokenABI;
        break;
      case 'wETH':
        tokenAddress = '0x4200000000000000000000000000000000000023';
        tokenABI = wETHABI;
        break;
      case 'wFTM':
        tokenAddress = '0x594D8b81eC765410536ab59E98091700b99508D8';
        tokenABI = wrappedFTMABI;
        break;
      case 'wMATIC':
        tokenAddress = '0x21ba4f6aEdA155DD77Cc33Fb93646910543F0380';
        tokenABI = wrappedWMATICABI;
        break;
      case 'custom':
        tokenAddress = document.getElementById('customTokenAddress').value;
        tokenABI = interchainTokenABI;
        break;
      default:
        const balance = await provider.getBalance(currentAccount);
        setTokenBalance(ethers.utils.formatUnits(balance, 18));
        return;
    }

    const contract = new ethers.Contract(tokenAddress, tokenABI, provider);
    const balance = await contract.balanceOf(currentAccount);
    setTokenBalance(ethers.utils.formatUnits(balance, 18));
  };

  const swapTokens = async () => {
    try {
      const sourceToken = document.getElementById('sourceToken').value;
      const amount = document.getElementById('amount').value;
      const destinationBlockchain = document.getElementById('destinationBlockchain').value;
      const destinationAddress = document.getElementById('destinationAddress').value;

      const network = networks[destinationBlockchain];
      const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
      const signer = provider.getSigner();
      const contract = new ethers.Contract('0xF659A577B56A8D5d124ac740670429AbEE9160C4', interchainTokenABI, signer);

      const tx = await contract.sendToken(destinationBlockchain, destinationAddress, ethers.utils.parseUnits(amount, 18));
      await tx.wait();
      console.log('Transaction successful');
    } catch (error) {
      console.error('Failed to swap tokens:', error);
    }
  };

  return (
    <div className="App">
      <header>
        <img src="TWG.gif" alt="Logo" className="logo" />
        <h1>Trump Wif Grill Interchain Protocol</h1>
        <div className="wallet-menu">
          <button id="connectWalletButton" onClick={currentAccount ? disconnectWallet : connectWallet}>
            {currentAccount ? 'Disconnect Wallet' : 'Connect Wallet'}
          </button>
          <div className="dropdown">
            <button className="dropbtn" id="networkButton">{networkName || 'Network'}</button>
            <div className="dropdown-content">
              {Object.keys(networks).map(key => (
                <a key={key} href="#" data-chain-id={networks[key].chainId} data-rpc-url={networks[key].rpcUrl} data-chain-name={key} onClick={(e) => {
                  e.preventDefault();
                  switchBlockchain(e.target.getAttribute('data-chain-id'), e.target.getAttribute('data-rpc-url'), e.target.getAttribute('data-chain-name'));
                }}>
                  <img src={networks[key].logo} alt={`${key} logo`} />{key}
                </a>
              ))}
            </div>
          </div>
        </div>
      </header>
      <div className="contract-address">
        CA: 0xF659A577B56A8D5d124ac740670429AbEE9160C4
      </div>
      <main>
        <div className="container">
          <div id="walletInfo">
            {/* Wallet information and token balances will be displayed here */}
          </div>
          <div id="swapForm" className="clearfix">
            <select id="sourceToken" onChange={showTokenBalance}>
              <option value="tTWG">Trump Wif Grill (tTWG)</option>
              <option value="wETH">Wrapped Ethereum (wETH)</option>
              <option value="wFTM">Wrapped Fantom (wFTM)</option>
              <option value="wMATIC">Wrapped Matic (wMATIC)</option>
              <option value="custom">Custom Token</option>
            </select>
            <div className="balance-box">Balance: {tokenBalance}</div>
            <input type="text" id="customTokenAddress" placeholder="Custom Token Address" style={{ display: 'none' }} />
            <input type="number" id="amount" placeholder="Amount" />
            <select id="destinationBlockchain">
              <option value="fantom">Fantom Testnet</option>
              <option value="blast">Blast Sepolia</option>
              <option value="ethereum">Ethereum Sepolia Testnet</option>
              <option value="moonbeam">Moonbeam Alpha Testnet</option>
            </select>
            <input type="text" id="destinationAddress" placeholder="Destination Address" />
            <button id="swapButton" onClick={swapTokens}>Swap Tokens</button>
          </div>
          <div id="transactionStatus">
            {/* Transaction status will be displayed here */}
          </div>
        </div>
      </main>
      <footer>
        <p>&copy; 2024 Trump Wif Grill Interchain Protocol</p>
      </footer>
    </div>
  );
}

export default App;
