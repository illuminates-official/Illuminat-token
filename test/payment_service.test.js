const TokenContract = artifacts.require("./Token.sol");
const PSContract = artifacts.require("./PaymentService.sol");
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


contract('PaymentService', function (accounts) {

    let tokenOwner = accounts[0];
    let psOwner = accounts[1];
    let depositOwner = accounts[3];
    let service = accounts[2];

    describe('Base payment service functionality', async () => {
        beforeEach('init', async () => {
            token = await TokenContract.new({from: tokenOwner});
            ps = await PSContract.new({from: psOwner});
            deposit = await DepositContract.new({from: depositOwner});
            await token.sendTokens([accounts[5]], [vs(100000)], {from: tokenOwner});
            await ps.setToken(token.address, {from: psOwner});
            await deposit.setPaymentService(ps.address, {from: depositOwner});
            await token.setDepositAddress(deposit.address, {from: tokenOwner});
            await token.approve(ps.address, vs(100000), {from: accounts[5]});
        });

        it('replenishing of the balance', async () => {
            await ps.replenishBalance(vs(10000), {from: accounts[5]});

            assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));
            assert.equal(+(await token.balanceOf(ps.address)), vs(10000));
            assert.equal(+(await ps.balanceOf(accounts[5])), vs(10000));
        });

        it('withdrawal', async () => {
            await ps.replenishBalance(vs(10000), {from: accounts[5]});

            assert.equal(+(await ps.balanceOf(accounts[5])), vs(10000));
            assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));
            assert.equal(+(await token.balanceOf(ps.address)), vs(10000));

            await ps.withdraw(vs(100), {from: accounts[5]});

            assert.equal(+(await ps.balanceOf(accounts[5])), vs(9900));
            assert.equal(+(await token.balanceOf(accounts[5])), vs(90100));
            assert.equal(+(await token.balanceOf(ps.address)), vs(9900));

            await ps.methods["withdraw()"]({from: accounts[5]});

            assert.equal(+(await ps.balanceOf(accounts[5])), 0);
            assert.equal(+(await token.balanceOf(accounts[5])), vs(100000));
            assert.equal(+(await token.balanceOf(ps.address)), 0);
        });

        it('transfer on payment service contract', async () => {
            await ps.replenishBalance(vs(10000), {from: accounts[5]});

            assert.equal(+(await ps.balanceOf(accounts[5])), vs(10000));
            assert.equal(+(await ps.balanceOf(accounts[4])), 0);
            assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));
            assert.equal(+(await token.balanceOf(ps.address)), vs(10000));

            await ps.transfer(accounts[4], vs(100), {from: accounts[5]});

            assert.equal(+(await ps.balanceOf(accounts[5])), vs(9900));
            assert.equal(+(await ps.balanceOf(accounts[4])), vs(100));
            assert.equal(+(await token.balanceOf(accounts[5])), vs(89900));
            assert.equal(+(await token.balanceOf(ps.address)), vs(10000));
        });

        it('hold tokens', async () => {
            await ps.replenishBalance(vs(10000), {from: accounts[5]});

            assert.equal(+(await ps.balanceOf(accounts[5])), vs(10000));
            assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));
            assert.equal(+(await token.balanceOf(ps.address)), vs(10000));

            await ps.hold(vs(2000), {from: accounts[5]});

            assert.equal(+(await ps.heldBalanceOf(accounts[5])), vs(2000));
        });

        it('unhold tokens', async () => {
            await ps.replenishBalance(vs(10000), {from: accounts[5]});

            assert.equal(+(await ps.balanceOf(accounts[5])), vs(10000));
            assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));
            assert.equal(+(await token.balanceOf(ps.address)), vs(10000));
            assert.equal(+(await ps.currentHoldersNumber()), 0);

            await ps.hold(vs(2000), {from: accounts[5]});

            assert.equal(+(await ps.currentHoldersNumber()), 1);
            assert.equal(+(await ps.heldBalanceOf(accounts[5])), vs(2000));
            assert.equal(+(await ps.unHeldBalanceOf(accounts[5])), vs(8000));

            await ps.unHold(vs(300), {from: accounts[5]});

            assert.equal(+(await ps.currentHoldersNumber()), 1);
            assert.equal(+(await ps.heldBalanceOf(accounts[5])), vs(1700));
            assert.equal(+(await ps.unHeldBalanceOf(accounts[5])), vs(8300));

            await ps.methods["unHold()"]({from: accounts[5]});

            assert.equal(+(await ps.currentHoldersNumber()), 0);
            assert.equal(+(await ps.heldBalanceOf(accounts[5])), 0);
            assert.equal(+(await ps.unHeldBalanceOf(accounts[5])), vs(10000));
        });

        it('removing holders from list', async () => {
            await token.sendTokens([accounts[4]], [vs(100000)], {from: tokenOwner});
            await token.approve(ps.address, vs(100000), {from: accounts[4]});

            await ps.replenishBalance(vs(10000), {from: accounts[4]});
            await ps.replenishBalance(vs(10000), {from: accounts[5]});

            assert.equal(+(await ps.currentHoldersNumber()), 0);

            await ps.hold(vs(2000), {from: accounts[4]});
            await ps.hold(vs(2000), {from: accounts[5]});
            assert.equal(+(await ps.currentHoldersNumber()), 2);

            await ps.unHold(vs(300), {from: accounts[5]});
            assert.equal(+(await ps.currentHoldersNumber()), 2);

            await ps.unHold(vs(1700), {from: accounts[5]});            
            assert.equal(+(await ps.currentHoldersNumber()), 1);

            await ps.methods["unHold()"]({from: accounts[4]});
            assert.equal(+(await ps.currentHoldersNumber()), 0);
        });

        it('pay service', async () => {
            await ps.replenishBalance(vs(10000), {from: accounts[5]});
            assert.equal(+(await ps.balanceOf(accounts[5])), vs(10000));

            await ps.payService("test", service, vs(100), {from: accounts[5]});

            assert.equal(+(await ps.balanceOf(accounts[5])), vs(9900));
            assert.equal(+(await token.balanceOf(ps.address)), vs(9900));
            assert.equal(+(await token.balanceOf(deposit.address)), vs(10));
            assert.equal(+(await token.totalSupply()), vs(99999990));
        });
    });
});