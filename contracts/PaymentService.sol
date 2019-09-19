pragma solidity ^0.5.11;

import "./IToken.sol";
import "./IDeposit.sol";
import "./SafeMath.sol";
import "./Ownable.sol";

contract PaymentService is Ownable {
    using SafeMath for uint256;

    IToken public token;
    IDeposit public deposit;

    mapping(address => uint) private _balances;
    mapping(address => uint) private _heldBalances;
    mapping(address => uint[]) private _heldBalancesTimes;
    mapping(address => mapping(uint => uint)) private _heldTime;

    address[] private _currentHolders;
    uint private _totalHeld;

    event Replenish(address indexed _account, uint indexed _amount);
    event Withdrawal(address indexed _account, uint indexed _amount);
    event DepositTransfer(address indexed _from, address indexed _to, uint indexed _amount);
    event ServicePayment(address indexed _payer, address indexed _service, uint indexed _amount);
    event Hold(address indexed account, uint indexed amount, uint indexed time);
    event Unhold(address indexed account, uint indexed amount, uint indexed time);

    constructor() public {}

    function() external {
        revert();
    }

    function setToken(address _token) public onlyOwner {
        token = IToken(_token);
    }

    function setDeposit(address _deposit) public onlyOwner {
        deposit = IDeposit(_deposit);
    }

    function _serviceTransfer(address to, uint amount) public onlyOwner {
        _transfer(to, amount);
    }

    function transfer(address to, uint amount) public {
        require(amount <= _balances[msg.sender].sub(_heldBalances[msg.sender]), "Not enough unhold tokens");
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        _balances[to] = _balances[to].add(amount);
        token.transferFrom(msg.sender, to, amount);
        emit DepositTransfer(msg.sender, to, amount);
    }

    function replenishBalance(uint amount) public {
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        token.transferFrom(msg.sender, address(this), amount);
        emit Replenish(msg.sender, amount);
    }

    function withdraw() public {
        uint balance = _balances[msg.sender].sub(_heldBalances[msg.sender]);
        _balances[msg.sender] = _heldBalances[msg.sender];
        _transfer(msg.sender, balance);
        emit Withdrawal(msg.sender, balance);
    }

    function withdraw(uint amount) public {
        require(amount <= _balances[msg.sender].sub(_heldBalances[msg.sender]), "Not enough unhold tokens");
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        _transfer(msg.sender, amount);
        emit Withdrawal(msg.sender, amount);
    }

    function hold(uint amount) public {
        require(amount <= _balances[msg.sender], "Not enough balance on payment service contract");

        uint currentTime = now;

        _heldBalances[msg.sender] = _heldBalances[msg.sender].add(amount);
        _heldTime[msg.sender][currentTime] = amount;

        _heldBalancesTimes[msg.sender].push(currentTime);
        _currentHolders.push(msg.sender);
        _totalHeld = _totalHeld.add(amount);

        emit Hold(msg.sender, amount, currentTime);
    }

    function unHold(uint amount) public {
        require(amount <= _heldBalances[msg.sender], "Not enough held balance on payment service contract");

        _heldBalances[msg.sender] = _heldBalances[msg.sender].sub(amount);

        if(_heldBalances[msg.sender] == 0) {
            _removeHolder(getHolderIndex(msg.sender));
        }

        _totalHeld = _totalHeld.sub(amount);

        if(_heldTime[msg.sender][heldBalancesTimesOf(msg.sender).sub(1)] >= amount){
            _heldTime[msg.sender][heldBalancesTimesOf(msg.sender).sub(1)] = _heldTime[msg.sender][heldBalancesTimesOf(msg.sender).sub(1)].sub(amount);

            emit Unhold(msg.sender, amount, heldBalancesTimesOf(msg.sender).sub(1));

            if(_heldTime[msg.sender][heldBalancesTimesOf(msg.sender).sub(1)] == amount) _heldBalancesTimes[msg.sender].pop();
        } else {
            uint remaining = amount;
            for(uint i = heldBalancesTimesOf(msg.sender).sub(1); i > 0; i--){
                if(remaining >= _heldTime[msg.sender][_heldBalancesTimes[msg.sender][i]]) {
                    remaining = remaining.sub(_heldTime[msg.sender][_heldBalancesTimes[msg.sender][i]]);

                    emit Unhold(msg.sender, _heldTime[msg.sender][_heldBalancesTimes[msg.sender][i]], _heldBalancesTimes[msg.sender][i]);

                    _heldTime[msg.sender][_heldBalancesTimes[msg.sender][i]] = 0;
                    _heldBalancesTimes[msg.sender].pop();
                } else if (remaining == 0) {
                    return;
                } else {
                    _heldTime[msg.sender][_heldBalancesTimes[msg.sender][i]] = _heldTime[msg.sender][_heldBalancesTimes[msg.sender][i]].sub(remaining);
                    remaining = 0;
                    return;
                }
            }
        }
    }

    function unHold() public {
        _totalHeld = _totalHeld.sub(_heldBalances[msg.sender]);
        _heldBalances[msg.sender] = 0;

        for(uint i = heldBalancesTimesOf(msg.sender).sub(1); i > 0; i--){
            _heldTime[msg.sender][_heldBalancesTimes[msg.sender][i]] = 0;
            _heldBalancesTimes[msg.sender].pop();
        }
        _removeHolder(getHolderIndex(msg.sender));
    }

    function payService(string memory service, address _to, uint amount) public {
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        token.payService(service, _to, amount);
        emit ServicePayment(msg.sender, _to, amount);
    }

    function balanceOf(address _account) public view returns(uint) {
        return _balances[_account];
    }

    function heldBalanceOf(address _account) public view returns(uint) {
        return _heldBalances[_account];
    }

    function unHeldBalanceOf(address _account) public view returns(uint) {
        return _balances[_account].sub(_heldBalances[_account]);
    }

    function currentHolders(uint index) public view returns(address) {
        return _currentHolders[index];
    }

    function currentHoldersNumber() public view returns(uint) {
        return _currentHolders.length;
    }

    function heldBalancesTimesOf(address account) public view returns(uint) {
        return _heldBalancesTimes[account].length;
    }

    function totalHeld() public view returns(uint) {
        return _totalHeld;
    }

    function _transfer(address to, uint amount) private {
        token.transfer(to, amount);
    }

    function getHolderIndex(address account) public view returns(uint) {
        for (uint i = 0; i < _currentHolders.length; i++)
            if(_currentHolders[i] == account)
                return i;
        revert("Holder not found");
    }

    // function _removeHolder(uint index) private {
    //     require(index <= currentHoldersNumber(), "Holder not found");

    //     _currentHolders[index] = _currentHolders[_currentHolders.length.sub(1)];
    //     _currentHolders.pop();
    // }

    // function _removeHoldTime(address account, uint index) private {
    //     require(index <= heldBalancesTimesOf(account), "Time record not found");

    //     _heldBalancesTimes[account][index] = _heldBalancesTimes[account][_currentHolders.length.sub(1)];
    //     _heldBalancesTimes[account].pop();
    // }

    function _removeHolder(uint index) private {
        require(index <= currentHoldersNumber(), "Holder not found");

        for (uint i = index; i < currentHoldersNumber().sub(1); i++)
            _currentHolders[i] = _currentHolders[i.add(1)];

        _currentHolders.pop();
    }

    function _removeHoldTime(address account, uint index) private {
        require(index <= heldBalancesTimesOf(account), "Time record not found");

        for (uint i = index; i < heldBalancesTimesOf(account).sub(1); i++)
            _heldBalancesTimes[account][i] = _heldBalancesTimes[account][i.add(1)];

        _heldBalancesTimes[account].pop();
    }
}
