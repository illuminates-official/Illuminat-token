pragma solidity ^0.5.10;

import "./IERC20.sol";
import "./SafeMath.sol";
import "./Ownable.sol";

contract Bounty is Ownable {

    using SafeMath for uint;

    IERC20 public token;

    mapping (address => uint) public airdropBalances;
    mapping (address => bool) public airdropReceived;

    event AirdropTokensReceiving(address indexed _account, uint indexed _amount);

    constructor() public {

    }

    function() external {
        revert();
    }

    function setToken(address _token) public onlyOwner {
        token = IERC20(_token);
    }

    function addAirdropAccount(address _account, uint _balance) public onlyOwner {
        _addAirdropAccount(_account, _balance);
    }

    function addAirdropAccounts(address[] memory _account, uint[] memory _balance) public onlyOwner {
        require(_account.length == _balance.length);

        for (uint i = 0; i < _account.length; i++) {
            _addAirdropAccount(_account[i], _balance[i]);
        }
    }

    function receiveTokens() public {
        uint amount = airdropBalances[msg.sender];
        airdropBalances[msg.sender] = 0;
        airdropReceived[msg.sender] = true;
        _transfer(msg.sender, amount);
        emit AirdropTokensReceiving(msg.sender, amount);
    }

    function transfer(address to, uint amount) public onlyOwner {
        _transfer(to, amount);
    }

    function _transfer(address to, uint amount) private {
        token.transfer(to, amount);
    }

    function _addAirdropAccount(address _account, uint _amount) private {
        require(_account != address(0));
        require(airdropBalances[_account] == 0);
        require(!airdropReceived[_account]);
        airdropBalances[_account] = _amount;
    }

}