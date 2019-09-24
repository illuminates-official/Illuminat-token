const truffleAssert = require('truffle-assertions');

const TokenContract = artifacts.require("./Token.sol");
const PSContract = artifacts.require("./PaymentService.sol");
const DepositContract = artifacts.require("./Deposit.sol");


const increaseTime = function (duration) {
    const id = Date.now();
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [duration],
            id: id,
        }, err1 => {
            if (err1) return reject(err1);

            web3.currentProvider.send({
                jsonrpc: '2.0',
                method: 'evm_mine',
                id: id + 1,
            }, (err2, res) => {
                return err2 ? reject(err2) : resolve(res);
            });
        });
    });
};

const hour = 3600;
const day = hour * 24;
const decimals = 10**18;


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

    // describe('Base payment service functionality', async () => {
    //     beforeEach('init', async () => {
    //         token = await TokenContract.new({from: tokenOwner});
    //         ps = await PSContract.new({from: psOwner});
    //         deposit = await DepositContract.new({from: depositOwner});
    //         await token.sendTokens([accounts[5]], [vs(100000)], {from: tokenOwner});
    //         await ps.setToken(token.address, {from: psOwner});
    //         await deposit.setPaymentService(ps.address, {from: depositOwner});
    //         await token.setDepositAddress(deposit.address, {from: tokenOwner});
    //         await token.approve(ps.address, vs(100000), {from: accounts[5]});
    //     });

    //     it('replenishing of the balance', async () => {
    //         await ps.replenishBalance(vs(10000), {from: accounts[5]});

    //         assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));
    //         assert.equal(+(await token.balanceOf(ps.address)), vs(10000));
    //         assert.equal(+(await ps.balanceOf(accounts[5])), vs(10000));
    //     });

    //     it('withdrawal', async () => {
    //         await ps.replenishBalance(vs(10000), {from: accounts[5]});

    //         assert.equal(+(await ps.balanceOf(accounts[5])), vs(10000));
    //         assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));
    //         assert.equal(+(await token.balanceOf(ps.address)), vs(10000));

    //         await ps.withdraw(vs(100), {from: accounts[5]});

    //         assert.equal(+(await ps.balanceOf(accounts[5])), vs(9900));
    //         assert.equal(+(await token.balanceOf(accounts[5])), vs(90100));
    //         assert.equal(+(await token.balanceOf(ps.address)), vs(9900));

    //         await ps.methods["withdraw()"]({from: accounts[5]});

    //         assert.equal(+(await ps.balanceOf(accounts[5])), 0);
    //         assert.equal(+(await token.balanceOf(accounts[5])), vs(100000));
    //         assert.equal(+(await token.balanceOf(ps.address)), 0);
    //     });

    //     it('transfer on payment service contract', async () => {
    //         await ps.replenishBalance(vs(10000), {from: accounts[5]});

    //         assert.equal(+(await ps.balanceOf(accounts[5])), vs(10000));
    //         assert.equal(+(await ps.balanceOf(accounts[4])), 0);
    //         assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));
    //         assert.equal(+(await token.balanceOf(ps.address)), vs(10000));

    //         await ps.transfer(accounts[4], vs(100), {from: accounts[5]});

    //         assert.equal(+(await ps.balanceOf(accounts[5])), vs(9900));
    //         assert.equal(+(await ps.balanceOf(accounts[4])), vs(100));
    //         assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));
    //         assert.equal(+(await token.balanceOf(ps.address)), vs(10000));
    //     });

    //     it('hold tokens', async () => {
    //         await ps.replenishBalance(vs(10000), {from: accounts[5]});

    //         assert.equal(+(await ps.balanceOf(accounts[5])), vs(10000));
    //         assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));
    //         assert.equal(+(await token.balanceOf(ps.address)), vs(10000));

    //         await ps.hold(vs(2000), {from: accounts[5]});

    //         assert.equal(+(await ps.heldBalanceOf(accounts[5])), vs(2000));
    //     });

    //     it('unhold tokens', async () => {
    //         await ps.replenishBalance(vs(10000), {from: accounts[5]});

    //         assert.equal(+(await ps.balanceOf(accounts[5])), vs(10000));
    //         assert.equal(+(await token.balanceOf(accounts[5])), vs(90000));
    //         assert.equal(+(await token.balanceOf(ps.address)), vs(10000));
    //         assert.equal(+(await ps.currentHoldersCount()), 0);

    //         await ps.hold(vs(2000), {from: accounts[5]});

    //         assert.equal(+(await ps.currentHoldersCount()), 1);
    //         assert.equal(+(await ps.heldBalanceOf(accounts[5])), vs(2000));
    //         assert.equal(+(await ps.unHeldBalanceOf(accounts[5])), vs(8000));

    //         await ps.unHold(vs(300), {from: accounts[5]});

    //         assert.equal(+(await ps.currentHoldersCount()), 1);
    //         assert.equal(+(await ps.heldBalanceOf(accounts[5])), vs(1700));
    //         assert.equal(+(await ps.unHeldBalanceOf(accounts[5])), vs(8300));

    //         await ps.methods["unHold()"]({from: accounts[5]});

    //         assert.equal(+(await ps.currentHoldersCount()), 0);
    //         assert.equal(+(await ps.heldBalanceOf(accounts[5])), 0);
    //         assert.equal(+(await ps.unHeldBalanceOf(accounts[5])), vs(10000));
    //     });

    //     it('removing holders from list', async () => {
    //         await token.sendTokens([accounts[4]], [vs(100000)], {from: tokenOwner});
    //         await token.approve(ps.address, vs(100000), {from: accounts[4]});

    //         await ps.replenishBalance(vs(10000), {from: accounts[4]});
    //         await ps.replenishBalance(vs(10000), {from: accounts[5]});

    //         assert.equal(+(await ps.currentHoldersCount()), 0);

    //         await ps.hold(vs(2000), {from: accounts[4]});
    //         await ps.hold(vs(2000), {from: accounts[5]});
    //         assert.equal(+(await ps.currentHoldersCount()), 2);

    //         await ps.unHold(vs(300), {from: accounts[5]});
    //         assert.equal(+(await ps.currentHoldersCount()), 2);

    //         await ps.unHold(vs(1700), {from: accounts[5]});            
    //         assert.equal(+(await ps.currentHoldersCount()), 1);

    //         await ps.methods["unHold()"]({from: accounts[4]});
    //         assert.equal(+(await ps.currentHoldersCount()), 0);
    //     });

    //     it('pay service', async () => {
    //         await ps.replenishBalance(vs(10000), {from: accounts[5]});
    //         assert.equal(+(await ps.balanceOf(accounts[5])), vs(10000));

    //         await ps.payService("test", service, vs(100), {from: accounts[5]});

    //         assert.equal(+(await ps.balanceOf(accounts[5])), vs(9900));
    //         assert.equal(+(await token.balanceOf(ps.address)), vs(9900));
    //         assert.equal(+(await token.balanceOf(deposit.address)), vs(10));
    //         assert.equal(+(await token.totalSupply()), vs(99999990));
    //     });
    // });

    describe('Held balance and time for helding', async () => {
        beforeEach('init', async () => {
            token = await TokenContract.new({from: tokenOwner});
            ps = await PSContract.new({from: psOwner});
            deposit = await DepositContract.new({from: depositOwner});
            await ps.setToken(token.address, {from: psOwner});
            await deposit.setPaymentService(ps.address, {from: depositOwner});
            await token.setDepositAddress(deposit.address, {from: tokenOwner});

            await token.sendTokens([accounts[4]], [vs(100000)], {from: tokenOwner});
            await token.sendTokens([accounts[5]], [vs(100000)], {from: tokenOwner});

            await token.approve(ps.address, vs(100000), {from: accounts[4]});
            await token.approve(ps.address, vs(100000), {from: accounts[5]});

            await ps.replenishBalance(vs(10000), {from: accounts[4]});
            await ps.replenishBalance(vs(10000), {from: accounts[5]});
        });

        it('hold balance', async () => {
            tx1 = await ps.hold(vs(100), {from: accounts[4]});
            tx2 = await ps.hold(vs(100), {from: accounts[5]});

            ht1 = +(await ps.heldBalancesTimesRecordOf(accounts[4], 0));
            ht2 = +(await ps.heldBalancesTimesRecordOf(accounts[5], 0));
            hb1 = +(await ps.methods["heldBalanceByTime(address,uint256)"](accounts[4], ht1));
            hb2 = +(await ps.methods["heldBalanceByTime(address,uint256)"](accounts[5], ht2));

            truffleAssert.eventEmitted(tx1, 'Hold', (ev) => {
                return ev.account === accounts[4] && ev.amount == vs(100);
            });

            truffleAssert.eventEmitted(tx2, 'Hold', (ev) => {
                return ev.account === accounts[5] && ev.amount == vs(100);
            });

            assert.equal(hb1, vs(100));
            assert.equal(hb2, vs(100));
        });

        it('get index of holder', async () => {
            tx1 = await ps.hold(vs(100), {from: accounts[4]});
            tx2 = await ps.hold(vs(100), {from: accounts[5]});

            i1 = +(await ps.getHolderIndex(accounts[4]));
            i2 = +(await ps.getHolderIndex(accounts[5]));

            assert.equal(i1, 0);
            assert.equal(i2, 1);
        });

        it('unhold all balance', async () => {
            tx1 = await ps.hold(vs(100), {from: accounts[4]});
            tx2 = await ps.hold(vs(100), {from: accounts[5]});

            ht1 = +(await ps.heldBalancesTimesRecordOf(accounts[4], 0));
            ht2 = +(await ps.heldBalancesTimesRecordOf(accounts[5], 0));
            hb1 = +(await ps.methods["heldBalanceByTime(address,uint256)"](accounts[4], ht1));
            hb2 = +(await ps.methods["heldBalanceByTime(address,uint256)"](accounts[5], ht2));

            assert.equal(hb1, vs(100));
            assert.equal(hb2, vs(100));
            assert.equal(+(await ps.heldBalanceOf(accounts[4])), vs(100));
            assert.equal(+(await ps.heldBalanceOf(accounts[5])), vs(100));
            assert.equal(+(await ps.totalHeld()), vs(200));

            tx1 = await ps.methods["unHold()"]({from: accounts[4]});
            tx2 = await ps.methods["unHold()"]({from: accounts[5]});

            assert.equal(+(await ps.heldBalanceOf(accounts[4])), 0);
            assert.equal(+(await ps.heldBalanceOf(accounts[5])), 0);
            assert.equal(+(await ps.totalHeld()), 0);
            assert.equal(+(await ps.heldBalancesTimesCountOf(accounts[4])), 0);
            assert.equal(+(await ps.heldBalancesTimesCountOf(accounts[5])), 0);

            hb1 = +(await ps.methods["heldBalanceByTime(address,uint256)"](accounts[4], ht1));
            hb2 = +(await ps.methods["heldBalanceByTime(address,uint256)"](accounts[5], ht2));

            assert.equal(hb1, 0);
            assert.equal(hb2, 0);

            truffleAssert.eventEmitted(tx1, 'Unhold', (ev) => {
                return ev.account === accounts[4] && ev.amount == vs(100);
            });

            truffleAssert.eventEmitted(tx2, 'Unhold', (ev) => {
                return ev.account === accounts[5] && ev.amount == vs(100);
            });
        });

        it('unhold all balance, when account have some held balances in different time', async () => {
            tx1 = await ps.hold(vs(100), {from: accounts[4]});

            await increaseTime(day);

            tx1 = await ps.hold(vs(200), {from: accounts[4]});

            ht1 = +(await ps.heldBalancesTimesRecordOf(accounts[4], 0));
            ht2 = +(await ps.heldBalancesTimesRecordOf(accounts[4], 1));
            hb1 = +(await ps.methods["heldBalanceByTime(address,uint256)"](accounts[4], ht1));
            hb2 = +(await ps.methods["heldBalanceByTime(address,uint256)"](accounts[4], ht2));

            assert.equal(hb1, vs(100));
            assert.equal(hb2, vs(200));
            assert.equal(+(await ps.heldBalanceOf(accounts[4])), vs(300));
            assert.equal(+(await ps.totalHeld()), vs(300));

            tx1 = await ps.methods["unHold()"]({from: accounts[4]});

            assert.equal(+(await ps.heldBalanceOf(accounts[4])), 0);
            assert.equal(+(await ps.totalHeld()), 0);
            assert.equal(+(await ps.heldBalancesTimesCountOf(accounts[4])), 0);

            hb1 = +(await ps.methods["heldBalanceByTime(address,uint256)"](accounts[4], ht1));
            hb2 = +(await ps.methods["heldBalanceByTime(address,uint256)"](accounts[4], ht2));

            assert.equal(hb1, 0);
            assert.equal(hb2, 0);
        });

        it('unhold specified amount of tokens', async () => {
            tx1 = await ps.hold(vs(100), {from: accounts[4]});

            await increaseTime(day);

            ht1 = +(await ps.heldBalancesTimesRecordOf(accounts[4], 0));
            hb1 = +(await ps.methods["heldBalanceByTime(address,uint256)"](accounts[4], ht1));

            assert.equal(hb1, vs(100));
            assert.equal(+(await ps.heldBalanceOf(accounts[4])), vs(100));
            assert.equal(+(await ps.totalHeld()), vs(100));

            tx1 = await ps.methods["unHold(uint256)"](vs(40), {from: accounts[4]});

            assert.equal(+(await ps.heldBalanceOf(accounts[4])), vs(60));
            assert.equal(+(await ps.totalHeld()), vs(60));
            assert.equal(+(await ps.heldBalancesTimesCountOf(accounts[4])), 1);

            hb1 = +(await ps.methods["heldBalanceByTime(address,uint256)"](accounts[4], ht1));

            assert.equal(hb1, vs(60));
        });
    });
});