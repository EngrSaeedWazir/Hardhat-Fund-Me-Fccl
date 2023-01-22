//Get Fund From Users
//WithDraw Funds
//Set A minimum Funding Value in USD

//SPDX-License-Identifier: MIT

//Prama
pragma solidity ^0.8.17; // You can use other version See Slides for more info
//Imports

/* interface AggregatorV3Interface {                     // We are importing it by Link because this a an                                                   //
  function decimals() external view returns (uint8);    // an ugly practice

  function description() external view returns (string memory);

  function version() external view returns (uint256);

  function getRoundData(uint80 _roundId)
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );

  function latestRoundData()
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    );
    } */

import "./PriceConverter.sol";

//error code

// Constant, immutable
//	841840 gas
//  822310 gas
//-------------
//error FundMe__Noti_owner();// for revert use which is ga efficient

/**@title A sample Funding Contract
 * @author EngrSaeedWazir
 * @notice This contract is for creating a sample funding contract
 * @dev This implements price feeds as our library
 */

contract FundMe {
    //type Declaration //styeguide
    using PriceConverter for uint256;
    //uint256 public number; // For Now Commented it

    //	21371 gas, for constant in view function
    //23,400 gas , for non-constant in view function

    //State variables //styeguide
    mapping(address => uint256) public s_addressToAmountFunded; // map to specific address
    address[] public s_funders; // All the addreses who funded

    address public immutable i_owner; //a global variable
    uint256 public constant MINIMUM_USD = 50 * 1e18; //1*10**18

    // 21508 gas, immutable
    //23644 gas, without immutable
    AggregatorV3Interface public s_priceFeed;

    // Events (we have none!)

    // Modifiers
    modifier onlyowner() {
        require(msg.sender == i_owner, "Sender is not i_owner"); //Noti_owner());
        //if(msg.sender !=i_owner){revert FundMe__Noti_owner();}
        _;
    }

    // Functions Order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /// @notice Funds our contract based on the ETH/USD price
    function Fund() public payable {
        //Want to be able to Send a minimum fund amount in USD
        //1.  How do we send ETH to this conaract
        //number=5;  // For Now Commented it
        //require(msg.value > MINIMUM_USD, "Donot Send Enough");

        //require(getConversionRate(msg.value) >= MINIMUM_USD, "Donot Send Enough"); //1e18 == 1*10**18= 1000000000000000000
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        ); //value paramter pass to function in Library

        //a Ton of computation
        // What is Reverting
        //Undo any action before, and send ramaining gas back
        s_funders.push(msg.sender); // sender address
        s_addressToAmountFunded[msg.sender] += msg.value; // how much a specific adress send
    }

    function Withdraw() public onlyowner {
        //require(msg.sender == i_owner, "Sender is not i_owner");/*May be other function in this contract need
        // this rquire statement therefore our focus is modifier.                                                        //
        /*starting index, ending index, step amount */
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        //reset the address
        s_funders = new address[](0);
        // actually withdraw the fund

        /*
      // transfer
      payable(msg.sender).transfer(address(this).balance);   // Call is used today so comment the other
      // send
      bool sendSuccess=payable(msg.sender).send(address(this).balance);
      require(sendSuccess, "Send failed"); */

        //call
        (bool callSuccess /* byte memory storedata */, ) = payable(msg.sender)
            .call{value: address(this).balance}("");
        require(callSuccess, "Send failed");

        //msg.sender=address
        //payable(msg.sender)=payable address
        //payable(msg.sender).transfer(address(this).balance);
    }

    function cheaperWithdraw() public onlyowner {
        address[] memory funders = s_funders;
        // mappings can't be in memory, sorry!
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // payable(msg.sender).transfer(address(this).balance);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    // what happen if some one send eth without calling the fund function
    // recieve()
    //fallback()
    // receive() external payable {
    //     Fund();
    // }

    // fallback() external payable {
    //     Fund();
    // }
}
