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

    address[] private _currentHolders;
    uint private _totalHeld;

    event Replenish(address indexed _account, uint indexed _amount);
    event Withdrawal(address indexed _account, uint indexed _amount);
    event DepositTransfer(address indexed _from, address indexed _to, uint indexed _amount);
    event ServicePayment(address indexed _payer, address indexed _service, uint indexed _amount);

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
        require(amount >= _balances[msg.sender], "Not enough balance on payment service contract");
        _heldBalances[msg.sender] = _heldBalances[msg.sender].add(amount);
        _currentHolders.push(msg.sender);
        _totalHeld = _totalHeld.add(amount);
    }

    function unHold(uint amount) public {
        require(amount <= _heldBalances[msg.sender], "Not enough held balance on payment service contract");
        _heldBalances[msg.sender] = _heldBalances[msg.sender].sub(amount);
        if(_heldBalances[msg.sender] == 0) {
            _removeHolder(getHolderIndex(msg.sender));
        }
        _totalHeld = _totalHeld.sub(amount);
    }

    function unHold() public {
        _totalHeld = _totalHeld.sub(_heldBalances[msg.sender]);
        _heldBalances[msg.sender] = 0;
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

    function totalHeld() public view returns(uint) {
        return _totalHeld;
    }

    function _transfer(address to, uint amount) private {
        token.transfer(to, amount);
    }

    function getHolderIndex(address account) internal view returns(int) {
        for (uint i = 0; i < _currentHolders.length; i++)
            if(_currentHolders[i] == account)
                return i;
        revert("Holder not found");
    }

    function _removeHolder(uint index) private {
        require(_currentHolders.length - 1 >= _currentHolders, "Holder not found");

        _currentHolders[index] = _currentHolders[_currentHolders.length - 1];
        _currentHolders.pop();
    }
}
