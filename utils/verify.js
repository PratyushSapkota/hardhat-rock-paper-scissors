const { run } = require("hardhat")

async function verifyContract(contractAddress, args) {
    console.log("Verifying on Etherscan");
  
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: args,
      });
      console.log( contractAddress ," verified at https://sepolia.etherscan.io/", contractAddress)
    } catch (e) {
      if (e.message.toLowerCase().includes("does not have bytecode")) {
        console.log("Already Verified at https://sepolia.etherscan.io/", contractAddress)
      } else {
        console.log(e.message);
      }
    }
  }

module.exports = {
    verifyContract,
}