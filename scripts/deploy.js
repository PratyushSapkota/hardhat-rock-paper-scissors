const {ethers, network, getNamedAccounts} = require("hardhat")
require("dotenv").config()
const {verifyContract} = require("../utils/verify")

async function deploy(){
    const [deployer] = await ethers.getSigners()
    const chainId = network.config.chainId

    const withContract = await ethers.deployContract("WithContractProduction", {
        from: deployer.address,
    })
    await withContract.waitForDeployment()

    const withPlayer = await ethers.deployContract("WithPlayerProduction", {
        from: deployer.address
    })
    await withPlayer.waitForDeployment()

    if(chainId == 11155111 && process.env.ETHERSCAN_API_KEY){
        await verifyContract(await withContract.getAddress(), [])
        await verifyContract(await withPlayer.getAddress(), [])
    }

    
    console.log(await withContract.getAddress())
    console.log(await withPlayer.getAddress())
    
    
}

deploy().then(() => process.exit(0)).catch((error) => {console.log(error); process.exit(1);});
