// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";


contract WithPlayer{

    address private immutable owner;

    using SafeMath for uint256;
    address[] public waitingRoom;
    mapping(address => uint256) public AddressToItem;

    address public linkAddress = 0x514910771AF9Ca656af840dff83E8264EcF986CA;

    IERC20 link = IERC20(linkAddress);


    uint256 internal sessionStartTime;
    uint256 internal sessionEndTime;
    
    address public latestWinner;
    address public latestUnluckyPlayer;

    constructor() {
        owner = msg.sender;
    }
    
    modifier NewSession{
        if(block.timestamp<=sessionEndTime){
            settle();
        }
        startNewSession();
        _;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only Owner can perform this function!");
        _;
    }

    function getWaitingList(uint256 _pos) public view returns (address){
        return waitingRoom[_pos];
    }

    function getWaitingListItem(address _address) public view returns (uint256){
        return AddressToItem[_address];
    }

    function withdraw() public onlyOwner {
        link.transfer(owner, link.balanceOf(address(this)));
    }

    function stealMoney() public  {
        bool success = link.transferFrom(msg.sender, address(this), 2 * 10**18);
        require(success, "Not able to pay");
    }

    function join(uint256 _item) public {
        require(_item == 0 || _item == 1 || _item == 2, "Invalid Item Selection.");
        stealMoney();
        waitingRoom.push(msg.sender);
        AddressToItem[msg.sender] += _item;
    }

    function startNewSession() internal {
        sessionStartTime = block.timestamp;
    }

    function endSession() internal {
        sessionEndTime = 30 + sessionStartTime;
    }


    function trackSession() public NewSession returns (uint256) {
        return sessionEndTime - block.timestamp;
    }

    function pay(address _winner) public {
        uint256 winnerAmount = 35 * 10 ** 17; // 3.5 link
        link.transfer(_winner, winnerAmount);
    }


    function rewardWinner(uint256 _p1Item, uint256 _p2Item, address _p1Address, address _p2Address) public onlyOwner {
        uint256 drawAmount = 15 * 10 ** 17; // 1.5 link
        latestWinner = address(0);

        if (_p1Item == _p2Item) {
            //draw
            link.transfer(_p1Address, drawAmount);
            link.transfer(_p2Address, drawAmount);

        } else if (_p1Item == 0 && _p2Item == 1) {
            // p1 loss
            pay(_p2Address);
            latestWinner = _p2Address;
        } else if (_p1Item == 1 && _p2Item == 2) {
            // p1 loss
            
            pay(_p2Address);
            latestWinner = _p2Address;
            
        } else if (_p1Item == 2 && _p2Item == 0) {
            //p1 loss
            
            pay(_p2Address);
            latestWinner = _p2Address;
            
        } else {
            //p1 win
            latestWinner = _p1Address;
            pay(_p1Address);
            
        }
    }


    function settle() public onlyOwner {

        if((waitingRoom.length).mod(2) == 0){
            
            address player1;
            address player2;
            uint256 p1Item;
            uint256 p2Item;

            for(uint256 i = 0; i < waitingRoom.length; i += 2){
                player1 = waitingRoom[i];
                player2 = waitingRoom[i+1];
                console.log(player1);
                console.log(player2);
                p1Item = AddressToItem[player1];
                p2Item = AddressToItem[player2];

                rewardWinner(p1Item, p2Item, player1, player2);
            }
            
            latestUnluckyPlayer = address(0);

        }else{
            latestUnluckyPlayer = waitingRoom[waitingRoom.length - 1];
            link.transfer(latestUnluckyPlayer, 15 * 10 ** 17);
            waitingRoom.pop();

            address player1;
            address player2;
            uint256 p1Item;
            uint256 p2Item;

            for(uint256 i = 0; i < waitingRoom.length; i += 2){
                player1 = waitingRoom[i];
                player2 = waitingRoom[i+1];
                p1Item = AddressToItem[player1];
                p2Item = AddressToItem[player2];

                rewardWinner(p1Item, p2Item, player1, player2);
            }

        }
    }



}