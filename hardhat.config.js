require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy")
require("dotenv").config()


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  defaultNetwork: "hardhat",
  networks:{
    hardhat:{
      chainId: 1337,
      forking:{
        url: process.env.RPC_URL_MAINNET,
        accounts: [process.env.PRIVATE_KEY1]
      }
    },
    sepolia:{
      chainId: 11155111,
      accounts: [process.env.PRIVATE_KEY1],
      url: process.env.RPC_URL_SEPOLIA
    }
  },
  etherscan:{
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter:{
    currency: "USD"
  },
  gasPrice: 0,
  namedAccounts:{
    deployer:{
      default: 0
    }
  }
};
