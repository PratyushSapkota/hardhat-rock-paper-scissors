const {ethers} = require("hardhat")
const {assert, expect} = require("chai")
const {erc20ABI} = require("../utils/erc20ABI")

describe("Player v Player", async () => {

    let player1, player2, owner, link, p2pContract, kraken, unluckyPlayer
    const player1Item = 0 //rock
    const player2Item = 2 //scissor
    //player1 should win
    
    beforeEach( async () => {
        kraken = await ethers.getImpersonatedSigner("0xDA9dfA130Df4dE4673b89022EE50ff26f6EA73Cf"); //kraken 13
        [owner, player1, player2, unluckyPlayer] = await ethers.getSigners()
        
        provider = ethers.getDefaultProvider()
        
        link = new ethers.Contract("0x514910771AF9Ca656af840dff83E8264EcF986CA", erc20ABI, owner) 
        

        
        p2pContract = await ethers.deployContract("WithPlayer", {
            deployer: owner
        })

        let addy = p2pContract.target

                
        await link.connect(kraken).approve(addy, ethers.parseEther("99"))
        await link.connect(owner).approve(addy, ethers.parseEther("99"))
        await link.connect(player1).approve(addy, ethers.parseEther("99"))
        await link.connect(player2).approve(addy, ethers.parseEther("99"))
        await link.connect(unluckyPlayer).approve(addy, ethers.parseEther("99"))
        
        
        await link.connect(kraken).transfer(await owner.getAddress(), ethers.parseEther("99"))
        await link.connect(kraken).transfer(await player1.getAddress(), ethers.parseEther("99"))
        await link.connect(kraken).transfer(await player2.getAddress(), ethers.parseEther("99"))
        await link.connect(kraken).transfer(await unluckyPlayer.getAddress(), ethers.parseEther("99"))
        await link.connect(kraken).transfer(await p2pContract.getAddress(), ethers.parseEther("99"))


    })

    
    it("All transactions from kraken", async () => {
        const ownerBalance = await link.balanceOf(await owner.getAddress())
        const player1Balance = await link.balanceOf(await player1.getAddress())
        const player2Balance = await link.balanceOf(await player2.getAddress())
        const contractBalance = await link.balanceOf(await p2pContract.getAddress())

        assert.equal(ownerBalance > 0 , true)
        assert.equal(player1Balance > 0 , true)
        assert.equal(player2Balance > 0, true)
        assert.equal(contractBalance > 0, true)
    })
    
    
    
    it("Should add the player in waiting room & update the mapping with the correct item", async () => {

        const tx = await p2pContract.connect(player1).join(player1Item)
        await tx.wait()
        const waitingRoom1pos = await p2pContract.connect(player1).getWaitingList(0)
        const waitingRoom1pos_Item = await p2pContract.connect(player1).getWaitingListItem(waitingRoom1pos)

        assert.equal(waitingRoom1pos, await player1.getAddress())
        assert.equal(waitingRoom1pos_Item.toString(), player1Item.toString())
        
    })

    it("Decide the winner & pay correctly", async () => {
        const initialWinnerBalance = await link.balanceOf(await player1.getAddress())
        const tx = await p2pContract.connect(owner).rewardWinner(player1Item, player2Item, await player1.getAddress(), await player2.getAddress())
        await tx.wait()
        const winner = await p2pContract.latestWinner()
        
        assert.equal(winner, await player1.getAddress())
        
        const finalWinnerBalance = await link.balanceOf(await player1.getAddress())
        const expectedWinnerBalance = initialWinnerBalance + ethers.parseEther("3.5")

        assert.equal(finalWinnerBalance, expectedWinnerBalance)

    })

    it("Should pay the players if draw", async () => {
        const expectedValue1 = await link.balanceOf(await player1.getAddress()) - ethers.parseEther("0.5")
        const expectedValue2 = await link.balanceOf(await player2.getAddress()) - ethers.parseEther("0.5")
        await p2pContract.connect(player1).join(1)
        await p2pContract.connect(player2).join(1)
        
        
        await p2pContract.connect(owner).settle()
        
        
        assert.equal(await link.balanceOf(await player1.getAddress()), expectedValue1 )
        assert.equal(await link.balanceOf(await player2.getAddress()), expectedValue2 )
        
        assert.equal(await p2pContract.latestWinner(), "0x0000000000000000000000000000000000000000")
    })
    
    it("Should pay back the player who did not have a opponent", async () => {

        // pays 2
        // gets 1.5 returns if unlucky

        const expectedBalance = ( await link.balanceOf(await unluckyPlayer.getAddress()) ) - ethers.parseEther("0.5")
        await p2pContract.connect(player1).join(1)
        await p2pContract.connect(player2).join(1)
        await p2pContract.connect(unluckyPlayer).join(1)
        
        await p2pContract.connect(owner).settle()
        
        assert.equal(await link.balanceOf(await unluckyPlayer.getAddress()), expectedBalance)
        assert.equal(await p2pContract.latestUnluckyPlayer(), await unluckyPlayer.getAddress())
        
    })

})
