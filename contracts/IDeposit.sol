pragma solidity ^0.5.11;

interface IDeposit {

    function heldBalanceOf(address _account) external view returns(uint);

    function payService(string calldata service, address _to, uint amount) external;
}