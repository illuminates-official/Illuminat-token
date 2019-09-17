pragma solidity ^0.5.11;

import "./IToken.sol";
import "./IPaymentService.sol";
import "./SafeMath.sol";
import "./Ownable.sol";

contract Deposit is Ownable {
    using SafeMath for uint256;

    IToken public token;
    IPaymentService public paymentService;
    uint public lastDistribution;

    mapping(address => uint) public paid;

    constructor() public {
        lastDistribution = now;
    }

    function() external {
        revert();
    }

    function distribute() public {
        require(now >= lastDistribution.add(30 days));
        uint currentBalance = balance();
        for (uint i = 0; i < paymentService.currentHoldersNumber(); i++) {
            _transfer(
                paymentService.currentHolders(i),
                currentBalance.mul(paymentService.heldBalanceOf(paymentService.currentHolders(i)).div(paymentService.totalHeld()))
            );
        }
        lastDistribution = now;
    }

    function setToken(address _token) public onlyOwner {
        token = IToken(_token);
    }

    function setPaymentService(address _ps) public onlyOwner {
        paymentService = IPaymentService(_ps);
    }

    function _serviceTransfer(address to, uint amount) public onlyOwner {
        _transfer(to, amount);
    }

    function heldBalanceOf(address _account) public view returns(uint) {
        return paymentService.heldBalanceOf(_account);
    }

    function _transfer(address to, uint amount) private {
        token.transfer(to, amount);
    }

    function balance() public view returns(uint){
        token.balanceOf(address(this));
    }
}
