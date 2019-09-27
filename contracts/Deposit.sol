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
    uint public accuracy;
    mapping(address => uint) private _lastDistributionPeriod;

    event ValidTotalHeldBalance(uint indexed amount, uint indexed time);
    event Distribution(address indexed receiver, uint indexed amount, uint indexed time);

    constructor() public {
        deployTime = now;
        accuracy = 10 ** 12;
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

    function setAccuracy(uint newAccuracy) public onlyOwner {
        accuracy = newAccuracy;
    }

    function distribute() public {
        uint period = period();
        require(now >= deployTime.add(period.mul(30 days)), "Not yet time");

        uint holdersCount = currentHoldersCount();

        if (holdersCount == 0)
            revert("No holders");

        uint currentBalance = balance();
        uint validTotalHeldBalance = validTotalHeld(now);

        emit ValidTotalHeldBalance(validTotalHeldBalance, now);

        for (uint i = 0; i < holdersCount; i++) {
            address holder = currentHolders(i);
            uint holds = heldBalancesTimesCountOf(holder);
            if (holds > 0) {
                if (heldBalancesTimesRecordOf(holder, 0) <= now.sub(30 days)) {
                    uint lastDistribution = lastDistributionPeriodOf(holder);
                    if (lastDistribution == period.sub(1)) {
                        uint validHold;
                        for (uint j = 0; j < holds; j++) {
                            uint time = heldBalancesTimesRecordOf(holder, j);
                            if (time <= now.sub(30 days))
                                validHold = validHold.add(heldBalanceByTime(holder, time));
                        }
                        if (validHold > 0) {
                            _lastDistributionPeriod[holder] = period;
                            uint amount = currentBalance.mul((validHold.mul(accuracy)).div(validTotalHeldBalance)).div(accuracy);
                            _transfer(holder, amount);
                            emit Distribution(holder, amount, now);
                        }
                    } else {
                        uint validHold;
                        uint difference = period.sub(lastDistribution);
                        uint longestHold = heldBalancesTimesRecordOf(holder, 0);
                        uint periods = (now.sub(longestHold)).div(30 days);
                        uint notPaidPeriods = periods.sub(lastDistribution);
                        if (longestHold <= now.sub((difference.sub(1)).mul(30 days))) {
                            for (uint j = 0; j < holds; j++) {
                                uint time = heldBalancesTimesRecordOf(holder, j);
                                periods = (now.sub(time)).div(30 days);
                                notPaidPeriods = periods.sub(lastDistribution);
                                if (notPaidPeriods > 0)
                                    validHold = validHold.add(heldBalanceByTime(holder, time));
                            }
                        } else if (periods > 0) {
                            uint time;
                            for (uint j = 0; j < holds; j++) {
                                time = heldBalancesTimesRecordOf(holder, j);
                                if (periods > 0)
                                    validHold = validHold.add(heldBalanceByTime(holder, time));
                            }
                        }
                        if (validHold > 0) {
                            _lastDistributionPeriod[holder] = period;
                            uint amount = currentBalance.mul((validHold.mul(accuracy)).div(validTotalHeldBalance)).div(accuracy);
                            _transfer(holder, amount);
                            emit Distribution(holder, amount, now);
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
                if (heldTime <= time.sub(30 days)) {
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