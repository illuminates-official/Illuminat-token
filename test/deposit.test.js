const TokenContract = artifacts.require("./Token.sol");
const DepositContract = artifacts.require("./Deposit.sol");

function v(value){
    return (value * decimals).toString();
}

function dec(decimals){
    return '0'.repeat(decimals);
}

function vs(value){
    return (value.toString() + dec(18));
}


contract('Deposit', function (accounts) {

    let tokenOwner = accounts[0];
    let depositOwner = accounts[1];
    let service = accounts[2];

    describe('Base deposit functionality', async () => {
        beforeEach('init', async () => {
            token = await TokenContract.new({from: tokenOwner});
            deposit = await DepositContract.new({from: depositOwner});
            await token.sendTokens([accounts[3]], [vs(100000)], {from: tokenOwner});
            await deposit.setToken(token.address, {from: depositOwner});
            await token.setDepositAddress(deposit.address, {from: tokenOwner});
            await token.approve(deposit.address, vs(100000), {from: accounts[3]});
        });

        it('try to pay', async () => {
            await deposit.replenishBalance(vs(10000), {from: accounts[3]});
            await deposit.payService("test", service, vs(10), {from: accounts[3]});

            assert.equal(+(await token.balanceOf(accounts[3])), vs(90000));
            assert.equal(+(await token.balanceOf(service)), vs(8));
            assert.equal(+(await deposit.paid(accounts[3])), vs(10));
        });
    });
});