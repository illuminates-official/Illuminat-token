pragma solidity ^0.5.11;

interface IPaymentService {

    function balanceOf(address account) external view returns (uint);
    function heldBalanceOf(address _account) external view returns(uint);

    function transfer(address to, uint amount) external;

    function payService(string calldata service, address _to, uint amount) external;
}