// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/VRFV2WrapperConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error WithContract__NotOwner();

contract WithContract is VRFV2WrapperConsumerBase{
    using SafeMath for uint;

    address public linkAddress = 0x514910771AF9Ca656af840dff83E8264EcF986CA;
    address constant vrfWrapperAddress = 0x5A861794B927983406fCE1D062e00b9368d97Df6;

    uint32 constant numWords = 1;
    uint32 constant callbackGasLimit = 1_00_000;
    uint16 constant requestConfirmations = 3;
    uint256 internal requestId; 

    address private immutable i_owner;

    mapping (uint256 => RandomStatus) statues;
    
    IERC20 link = IERC20(linkAddress);


    constructor() VRFV2WrapperConsumerBase(linkAddress, vrfWrapperAddress) {
        i_owner = msg.sender;
    }

    struct RandomStatus {
        uint256 fees;
        uint256 randomWord;
    }

    modifier onlyOwner {
        if (msg.sender != i_owner) revert WithContract__NotOwner();
        _;
    }

    function donate() public payable {}

    function requestRandomNumber() public onlyOwner {
        requestId = requestRandomness(
            callbackGasLimit,
            requestConfirmations,
            numWords
        );

        statues[requestId] =  RandomStatus({
            fees: VRF_V2_WRAPPER.calculateRequestPrice(callbackGasLimit),
            randomWord: 0
        });
    }

    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        require(statues[_requestId].fees > 0, "Request not found");
        statues[_requestId].randomWord = _randomWords[0];
    }

    function getRandomWord() view public onlyOwner returns (uint256) {
        return statues[requestId].randomWord;
    }


    function calculateResults(uint256 _playerItem, uint256 contractItem ) public view onlyOwner returns (uint256){
        if (_playerItem == contractItem) {
            //draw
            return 11;
        } else if (_playerItem == 0 && contractItem == 1) {
            // contract loss
            return 1;
        } else if (_playerItem == 1 && contractItem == 2) {
            // contract loss
            return 1;
        } else if (_playerItem == 2 && contractItem == 0) {
            // contract loss
            return 1;
        } else {
            // contract win
            return 10;
        }
    }



    function playWithContract(uint256 _playerItem, uint256 betAmount) public {
        uint256 betAmount18 = betAmount * 10 * 18;
        require(_playerItem == 0 || _playerItem == 1 || _playerItem == 2, "Invalid Item Selection.");
        link.transferFrom(msg.sender, address(this), betAmount18);
        requestRandomNumber();  
        uint256 rawRand = getRandomWord();
        uint256 contractItem = rawRand.mod(3);
        uint256 result = calculateResults(_playerItem, contractItem);

        if(result == 11){
            uint256 takeDrawCut = betAmount18.mul(75 * 10 ** 16);
            link.transfer(msg.sender, takeDrawCut);
        }
        if(result == 1){
            uint256 winAmount = betAmount18.mul(175 * 10 ** 16);
            link.transfer(msg.sender, winAmount);
        }
    }
    
}