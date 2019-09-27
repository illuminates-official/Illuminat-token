pragma solidity ^0.5.11;

import "./IToken.sol";
import "./IPaymentService.sol";
import "./SafeMath.sol";
import "./Ownable.sol";

contract Deposit is Ownable {
    using SafeMath
    for uint256;

    IToken public token;
    IPaymentService public paymentService;
    uint public deployTime;
    mapping(address => uint) private _lastDistributionPeriod;

    constructor() public {
        deployTime = now;
    }

    function () external {
        revert();
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

    function distribute() public {
        uint period = period();
        uint currentNow = now;
        require(currentNow >= deployTime.add(period.mul(30 days)), "Not yet time");

        uint holdersCount = currentHoldersCount();

        if (holdersCount == 0)
            revert("No holders");

        uint currentBalance = balance();
        uint validTotalHeldBalance = validTotalHeld(currentNow);

        for (uint i = 0; i < holdersCount; i++) {
            address holder = currentHolders(i);
            uint holds = heldBalancesTimesCountOf(holder);
            if (holds > 0) {
                if (heldBalancesTimesRecordOf(holder, 0) <= currentNow.sub(30 days)) {
                    uint lastDistribution = lastDistributionPeriodOf(holder);
                    if (lastDistribution == period.sub(1)) {
                        uint validHold;
                        for (uint j = 0; j < holds; j++) {
                            uint time = heldBalancesTimesRecordOf(holder, j);
                            if (time <= currentNow.sub(30 days))
                                validHold = validHold.add(heldBalanceByTime(holder, time));
                        }
                        if (validHold > 0) {
                            _lastDistributionPeriod[holder] = period;
                            uint amount = currentBalance.mul((validHold.mul(10000)).div(validTotalHeldBalance)).div(10000);
                            _transfer(holder, amount);
                        }
                    } else {
                        uint difference = period.sub(lastDistribution);
                        if (heldBalancesTimesRecordOf(holder, 0) < currentNow.sub((difference).mul(30 days))){
                            uint validHold;
                            for (uint j = 0; j < holds; j++) {
                                uint time = heldBalancesTimesRecordOf(holder, j);
                                if (time <= deployTime.add(lastDistribution.mul(30 days)).sub(30 days))
                                    validHold = validHold.add(heldBalanceByTime(holder, time));
                            }
                            if (validHold > 0) {
                                _lastDistributionPeriod[holder] = period;
                            uint amount = currentBalance.mul((validHold.mul(10000)).div(validTotalHeldBalance)).div(10000);
                                _transfer(holder, amount);
                            }
                        }
                    }
                }
            }
        }
    }

    function _transfer(address to, uint amount) private {
        token.transfer(to, amount);
    }

    function heldBalanceOf(address _account) public view returns(uint) {
        return paymentService.heldBalanceOf(_account);
    }

    function heldBalanceByTime(address account, uint time) public view returns(uint) {
        return paymentService.heldBalanceByTime(account, time);
    }

    function heldBalanceByTime(uint time) public view returns(uint) {
        return paymentService.heldBalanceByTime(msg.sender, time);
    }

    function heldBalancesTimesRecordOf(address account, uint index) public view returns(uint) {
        return paymentService.heldBalancesTimesRecordOf(account, index);
    }

    function heldBalancesTimesCountOf(address account) public view returns(uint) {
        return paymentService.heldBalancesTimesCountOf(account);
    }

    function totalHeld() public view returns(uint) {
        return paymentService.totalHeld();
    }

    function validTotalHeld(uint time) public view returns(uint) {
        uint validHeld;
        for (uint i = 0; i < currentHoldersCount(); i++) {
            address holder = currentHolders(i);
            for (uint j = 0; j < heldBalancesTimesCountOf(holder); j++) {
                uint heldTime = heldBalancesTimesRecordOf(holder, j);
                if (heldTime <= time.sub(30 days)){
                    validHeld = validHeld.add(heldBalanceByTime(holder, heldTime));
                }
            }
        }
        return validHeld;
    }

    function currentHolders(uint index) public view returns(address) {
        return paymentService.currentHolders(index);
    }

    function currentHoldersCount() public view returns(uint) {
        return paymentService.currentHoldersCount();
    }

    function getHolderIndex(address account) public view returns(uint) {
        return paymentService.getHolderIndex(account);
    }

    function period() public view returns(uint) {
        return (now.sub(deployTime)).div(30 days);
    }

    function lastDistributionPeriodOf(address account) public view returns(uint) {
        return _lastDistributionPeriod[account];
    }

    function balance() public view returns(uint) {
        return token.balanceOf(address(this));
    }
}