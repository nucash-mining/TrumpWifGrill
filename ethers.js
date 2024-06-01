// Ethers.js module
const ethers = window.ethers;

// ABIs
const interchainTokenABI = [/* ABI array here */];
const wETHABI = [/* Wrapped Ethereum ABI here */];
const wrappedFTMABI = [/* Axelar Wrapped FTM ABI here */];
const wrappedWMATICABI = [/* Axelar Wrapped WMATIC ABI here */];

// Network configurations
const networks = {
    fantom: {
        chainId: "0xfa2",
        rpcUrl: "https://fantom.api.onfinality.io/public",
        logo: "https://avatars.githubusercontent.com/u/39045722?s=48&v=4"
    },
    blast: {
        chainId: "0x1a4",
        rpcUrl: "https://sepolia.blast.io",
        logo: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ffreecoins24.io%2Fwp-content%2Fuploads%2F2023%2F11%2FBlast-network-logo.jpg&f=1&nofb=1&ipt=db0dcbd5c3cbb1eb8607d162e2758193fe79be975e3214756fa7b428a60a773a&ipo=images"
    },
    ethereum: {
        chainId: "0xaa36a7",
        rpcUrl: "https://ethereum-sepolia-rpc.publicnode.com",
        logo: "https://avatars.githubusercontent.com/u/6250754?s=48&v=4"
    },
    moonbeam: {
        chainId: "0x507",
        rpcUrl: "https://moonbase-alpha.public.blastapi.io",
        logo: "https://avatars.githubusercontent.com/u/84856768?s=48&v=4"
    }
};

let currentAccount = null;
let currentNetwork = null;

async function connectWallet() {
    try {
        if (window.ethereum) {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            currentAccount = window.ethereum.selectedAddress;
            console.log('Connected to MetaMask');
            const connectWalletButton = document.getElementById('connectWalletButton');
            connectWalletButton.innerText = 'Disconnect Wallet';
            if (currentNetwork && currentNetwork.logo) {
                connectWalletButton.style.backgroundImage = `url(${currentNetwork.logo})`;
                connectWalletButton.style.backgroundSize = '40px 40px';
                connectWalletButton.style.backgroundRepeat = 'no-repeat';
                connectWalletButton.style.backgroundPosition = '10px center';
            }
            showTokenBalance();
        } else {
            console.error('MetaMask not detected');
        }
    } catch (error) {
        console.error('Failed to connect wallet:', error);
    }
}

async function disconnectWallet() {
    try {
        if (window.ethereum) {
            currentAccount = null;
            window.location.reload();
        } else {
            console.error('MetaMask not detected');
        }
    } catch (error) {
        console.error('Failed to disconnect wallet:', error);
    }
}

async function switchBlockchain(chainId, rpcUrl, chainName) {
    try {
        if (window.ethereum) {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ethers.utils.hexValue(parseInt(chainId, 16)) }]
            });
            setNetwork(chainName);
            showTokenBalance();
        } else {
            console.error('MetaMask not detected');
        }
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

function setNetwork(chainName) {
    currentNetwork = networks[chainName];
    document.getElementById('networkButton').innerText = chainName;
    updateTokenOptions(chainName);
    showTokenBalance();
}

function updateTokenOptions(chainName) {
    const sourceTokenSelect = document.getElementById('sourceToken');
    sourceTokenSelect.innerHTML = '';
    sourceTokenSelect.innerHTML += '<option value="tTWG">Trump Wif Grill (tTWG)</option>';
    sourceTokenSelect.innerHTML += '<option value="wETH">Wrapped Ethereum (wETH)</option>';
    sourceTokenSelect.innerHTML += '<option value="wFTM">Wrapped Fantom (wFTM)</option>';
    sourceTokenSelect.innerHTML += '<option value="wMATIC">Wrapped Matic (wMATIC)</option>';
    sourceTokenSelect.innerHTML += '<option value="custom">Custom Token</option>';
}

async function showTokenBalance() {
    try {
        if (!currentAccount) return;
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        let balance;
        const selectedToken = document.getElementById('sourceToken').value;
        let tokenAddress;
        let tokenABI;

        if (selectedToken === 'tTWG') {
            tokenAddress = '0xF659A577B56A8D5d124ac740670429AbEE9160C4';
            tokenABI = interchainTokenABI;
        } else if (selectedToken === 'wETH') {
            tokenAddress = '0x4200000000000000000000000000000000000023';
            tokenABI = wETHABI;
        } else if (selectedToken === 'wFTM') {
            tokenAddress = '0x594D8b81eC765410536ab59E98091700b99508D8';
            tokenABI = wrappedFTMABI;
        } else if (selectedToken === 'wMATIC') {
            tokenAddress = '0x21ba4f6aEdA155DD77Cc33Fb93646910543F0380';
            tokenABI = wrappedWMATICABI;
        } else if (selectedToken === 'custom') {
            tokenAddress = document.getElementById('customTokenAddress').value;
            tokenABI = interchainTokenABI; // This should be updated with the custom token ABI
        } else {
            balance = await provider.getBalance(currentAccount);
            document.getElementById('tokenBalance').innerText = `Balance: ${ethers.utils.formatUnits(balance, 18)}`;
            return;
        }

        const contract = new ethers.Contract(tokenAddress, tokenABI, provider);
        balance = await contract.balanceOf(currentAccount);
        document.getElementById('tokenBalance').innerText = `Balance: ${ethers.utils.formatUnits(balance, 18)}`;
    } catch (error) {
        console.error('Failed to fetch token balance:', error);
    }
}

async function swapTokens() {
    try {
        const sourceToken = document.getElementById('sourceToken').value;
        const amount = document.getElementById('amount').value;
        const destinationBlockchain = document.getElementById('destinationBlockchain').value;
        const destinationAddress = document.getElementById('destinationAddress').value;

        const network = networks[destinationBlockchain];
        const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, interchainTokenABI, signer);

        const tx = await contract.sendToken(destinationBlockchain, destinationAddress, ethers.utils.parseUnits(amount, 18));
        await tx.wait();
        console.log('Transaction successful');
    } catch (error) {
        console.error('Failed to swap tokens:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const connectWalletButton = document.getElementById('connectWalletButton');
    connectWalletButton.addEventListener('click', () => {
        if (connectWalletButton.innerText === 'Connect Wallet') {
            connectWallet();
        } else {
            disconnectWallet();
        }
    });

    document.querySelectorAll('.dropdown-content a').forEach(item => {
        item.addEventListener('click', async (event) => {
            const chainId = event.target.getAttribute('data-chain-id');
            const rpcUrl = event.target.getAttribute('data-rpc-url');
            const chainName = event.target.getAttribute('data-chain-name');
            await switchBlockchain(chainId, rpcUrl, chainName);
        });
    });

    document.getElementById('sourceToken').addEventListener('change', showTokenBalance);
    document.getElementById('sourceToken').addEventListener('change', () => {
        const customTokenAddressInput = document.getElementById('customTokenAddress');
        if (document.getElementById('sourceToken').value === 'custom') {
            customTokenAddressInput.style.display = 'block';
        } else {
            customTokenAddressInput.style.display = 'none';
        }
    });

    document.getElementById('customTokenAddress').addEventListener('input', showTokenBalance);
    document.getElementById('swapButton').addEventListener('click', swapTokens);
});
