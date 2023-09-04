const {ethers} = require("hardhat")
const {assert} = require("chai")
const {erc20ABI} = require("../utils/erc20ABI.js")

describe("WithContract", async () => {

    let owner, withContract, link, provider

    beforeEach(async () => {
        [owner] = await ethers.getSigners()
        binance = await ethers.getImpersonatedSigner("0xF977814e90dA44bFA03b6295A0616a897441aceC") // binance 8

        provider = ethers.getDefaultProvider()

        link = new ethers.Contract("0x514910771af9ca656af840dff83e8264ecf986ca", erc20ABI, owner)

        
        withContract = await ethers.deployContract("WithContract", {
            deployer: owner,
        })

        await withContract.waitForDeployment()
        let addy = withContract.target

        const signedTx = await owner.sendTransaction({
            value: ethers.parseEther("2"),
            to: withContract,
        })

        await signedTx.wait();

        await link.connect(binance).approve(addy, ethers.parseEther("99"))
        await link.connect(owner).approve(addy, ethers.parseEther("99"))
        
        await link.connect(binance).transfer(await owner.getAddress(), ethers.parseEther("99"))
        await link.connect(binance).transfer(await withContract.getAddress(), ethers.parseEther("99"))
        
    })

    it("Owner Should recieve link", async () => {
        const ownerBalance = await link.balanceOf(await owner.getAddress())
        assert.equal(ownerBalance > 0, true)
    })
 
    it("Contract should recieve link & eth", async () => {
        const contractBalance = await link.balanceOf(await withContract.getAddress())
        const contractETH = await provider.getBalance(await withContract.getAddress())
        console.log(contractETH)
        assert.equal(contractBalance > 0, true)
    })


    // it is not generating random number because the contract does not have any eth

    // it("Should generate random number" , async () => {
    //     await withContract.requestRandomNumber()
    //     const randomWord = await withContract.getRandomWord()
    //     console.log(randomWord)
    // })



    it("Should calculate the results correctly", async () => {
        const result = await withContract.connect(owner).calculateResults(0, 2)
        assert.equal(result, BigInt(10))
    })

    it("Should pay the winner if player wins or pays when if draw", async () => {
        await withContract.connect(owner).playWithContract(1, 2)
        const randomWord = await withContract.connect(owner).getRandomWord()
        const contractItem = randomWord % BigInt(3)
        contractItem = Number(contractItem)
        let expectedBalance

        if(contractItem == 0){ //win
            expectedBalance = await link.balanceOf(await owner.getAddress()) + BigInt(3.5)
        }else if(contractItem == 1){ //draw
            expectedBalance = await link.balanceOf(await owner.getAddress()) + BigInt(1.5)
        }else if(contractItem == 2){ //loss
            expectedBalance = await link.balanceOf(await owner.getAddress())
        }

        assert.equal(await link.balanceOf(await owner.getAddress()), expectedBalance)
        
    })



    
})