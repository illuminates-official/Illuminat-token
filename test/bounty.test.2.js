const TokenContract = artifacts.require("./Token.sol");
const BountyContract = artifacts.require("./Bounty.sol");


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


contract('Token', function (accounts) {

    let tokenOwner = accounts[0];
    let bountyOwner = accounts[1];
    let advisors = accounts[2];
    let bounty;
    let team = accounts[3];
    let platform = accounts[4];

    let zeroAddress = "0x0000000000000000000000000000000000000000";

    let ab = vs(1000000);
    let bb = vs(2000000);
    let tb = vs(15000000);
    let totalSupply = vs(100000000);

    let token;

    let accs = [accounts[8], accounts[9]];
    let amounts = [vs(25), vs(20)];


    describe('Frozen tokens', async () => {
        beforeEach('init', async function () {
            bounty = await BountyContract.new({from: bountyOwner});
            token = await TokenContract.new(advisors, bounty.address, team, {from: tokenOwner});
            await bounty.setToken(token.address, {from: bountyOwner});
            await token.setFreezeAddress(bounty.address, {from: tokenOwner});
            await token.setPlatformAddress(platform, {from: tokenOwner});
        });

        it('setting platform address (not by owner)', async function () {
            assert.equal(await token.platformAddress(), platform);
            try {
                await token.setPlatformAddress(accounts[5], {from: bountyOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Ownable: caller is not the owner"));}
            assert.equal(await token.platformAddress(), platform);
        });

        it('setting freeze address (not by owner)', async function () {
            assert.equal(await token.freezeAddress(), bounty.address);
            try {
                await token.setFreezeAddress(accounts[5], {from: bountyOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Ownable: caller is not the owner"));}
            assert.equal(await token.freezeAddress(), bounty.address);
        });

        it('frozen transfer', async function () {
            await token.setFreezeAddress(accounts[5], {from: tokenOwner});
            await token.sendTokens([accounts[5]], [vs(50)], {from: tokenOwner});

            assert.equal(+(await token.balanceOf(accounts[6])), 0);
            assert.equal(+(await token.frozenTokens(accounts[6])), 0);

            await token.frozenTransfer(accounts[6], vs(20), {from: accounts[5]});

            assert.equal(+(await token.balanceOf(accounts[6])), vs(20));
            assert.equal(+(await token.frozenTokens(accounts[6])), vs(20));
        });

        it('unfreeze (not by owner)', async function () {
            assert.equal(await token.isFreezed(), true);
            try {
                await token.unfreeze({from: bountyOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Ownable: caller is not the owner"));}
            assert.equal(await token.isFreezed(), true);
        });

        it('unfreeze (already not frozen)', async function () {
            assert.equal(await token.isFreezed(), true);
            await token.unfreeze({from: tokenOwner});
            assert.equal(await token.isFreezed(), false);

            try {
                await token.unfreeze({from: tokenOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("revert"));}
            assert.equal(await token.isFreezed(), false);
        });

        it('unfreeze tokens', async function () {
            await token.setFreezeAddress(accounts[5], {from: tokenOwner});
            await token.sendTokens([accounts[5]], [vs(50)], {from: tokenOwner});

            assert.equal(+(await token.balanceOf(accounts[6])), 0);
            assert.equal(+(await token.frozenTokens(accounts[6])), 0);

            await token.frozenTransfer(accounts[6], vs(20), {from: accounts[5]});

            assert.equal(+(await token.balanceOf(accounts[6])), vs(20));
            assert.equal(+(await token.frozenTokens(accounts[6])), vs(20));

            await token.unfreeze({from: tokenOwner});
            await token.unfreezeMyTokens({from: accounts[6]});

            assert.equal(+(await token.balanceOf(accounts[6])), vs(20));
            assert.equal(+(await token.frozenTokens(accounts[6])), 0);
        });

        it('unfreeze tokens (still freezed)', async function () {
            await token.setFreezeAddress(accounts[5], {from: tokenOwner});
            await token.sendTokens([accounts[5]], [vs(50)], {from: tokenOwner});

            assert.equal(+(await token.balanceOf(accounts[6])), 0);
            assert.equal(+(await token.frozenTokens(accounts[6])), 0);

            await token.frozenTransfer(accounts[6], vs(20), {from: accounts[5]});

            assert.equal(+(await token.balanceOf(accounts[6])), vs(20));
            assert.equal(+(await token.frozenTokens(accounts[6])), vs(20));
            
            assert.equal(await token.isFreezed(), true);

            try {
                await token.unfreezeMyTokens({from: accounts[6]});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("revert"));}
            assert.equal(await token.isFreezed(), true);
            assert.equal(+(await token.balanceOf(accounts[6])), vs(20));
            assert.equal(+(await token.frozenTokens(accounts[6])), vs(20));
        });

        it('unfreeze tokens (not have frozen tokens)', async function () {
            await token.setFreezeAddress(accounts[5], {from: tokenOwner});
            await token.sendTokens([accounts[5]], [vs(50)], {from: tokenOwner});

            assert.equal(+(await token.balanceOf(accounts[6])), 0);
            assert.equal(+(await token.frozenTokens(accounts[6])), 0);

            await token.frozenTransfer(accounts[6], vs(20), {from: accounts[5]});

            assert.equal(+(await token.balanceOf(accounts[6])), vs(20));
            assert.equal(+(await token.frozenTokens(accounts[6])), vs(20));

            await token.unfreeze({from: tokenOwner});
            await token.unfreezeMyTokens({from: accounts[6]});

            assert.equal(+(await token.balanceOf(accounts[6])), vs(20));
            assert.equal(+(await token.frozenTokens(accounts[6])), 0);

            try {
                await token.unfreezeMyTokens({from: accounts[6]});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("revert"));}
            assert.equal(await token.isFreezed(), false);
            assert.equal(+(await token.balanceOf(accounts[6])), vs(20));
            assert.equal(+(await token.frozenTokens(accounts[6])), 0);
        });
    });
});

contract('Bounty', function (accounts) {

    let tokenOwner = accounts[0];
    let bountyOwner = accounts[1];
    let advisors = accounts[2];
    let bounty;
    let team = accounts[3];
    let platform = accounts[4];

    let zeroAddress = "0x0000000000000000000000000000000000000000";

    let ab = vs(1000000);
    let bb = vs(2000000);
    let tb = vs(15000000);
    let totalSupply = vs(100000000);

    let token;

    let accs = [accounts[8], accounts[9]];
    let amounts = [vs(25), vs(20)];


    describe('Frozen tokens', async () => {
        beforeEach('init', async function () {
            bounty = await BountyContract.new({from: bountyOwner});
            token = await TokenContract.new(advisors, bounty.address, team, {from: tokenOwner});
            await bounty.setToken(token.address, {from: bountyOwner});
            await token.setFreezeAddress(bounty.address, {from: tokenOwner});
            await token.setPlatformAddress(platform, {from: tokenOwner});
        });

        it('airdrop script', async function () {
            await bounty.addAirdropAccounts(accs, amounts, {from: bountyOwner});

            await bounty.receiveTokens({from: accs[0]});

            assert.equal(+(await token.balanceOf(accs[0])), amounts[0]);
            assert.equal(+(await token.frozenTokens(accs[0])), amounts[0]);
            assert.equal(await bounty.airdropReceived(accs[0]), true);

            try {
                await bounty.receiveTokens({from: accs[0]});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Airdrop tokens already received"));}
            try {
                await bounty.addAirdropAccounts(accs, amounts, {from: bountyOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Airdrop tokens already received"));}

            await token.transfer(platform, vs(3), {from: accs[0]});
            assert.equal(+(await token.balanceOf(accs[0])), vs(22));
            assert.equal(+(await token.frozenTokens(accs[0])), vs(22));
            assert.equal(await token.isFreezed(), true);

            await token.sendTokens([accs[0]], [vs(20)], {from: tokenOwner});
            assert.equal(+(await token.balanceOf(accs[0])), vs(42));
            assert.equal(+(await token.frozenTokens(accs[0])), vs(22));
            assert.equal(await token.isFreezed(), true);

            await token.transfer(accs[1], vs(7), {from: accs[0]});
            assert.equal(+(await token.balanceOf(accs[0])), vs(35));
            assert.equal(+(await token.frozenTokens(accs[0])), vs(22));
            assert.equal(+(await token.balanceOf(accs[1])), vs(7));
            assert.equal(+(await token.frozenTokens(accs[1])), 0);
            assert.equal(await token.isFreezed(), true);
            
            try {
                await token.transfer(accs[1], vs(14), {from: accs[0]});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Not enough free tokens"));}
            assert.equal(+(await token.balanceOf(accs[0])), vs(35));
            assert.equal(+(await token.frozenTokens(accs[0])), vs(22));
            assert.equal(+(await token.balanceOf(accs[1])), vs(7));
            assert.equal(+(await token.frozenTokens(accs[1])), 0);
            assert.equal(await token.isFreezed(), true);

            await token.unfreeze({from: tokenOwner});

            await token.transfer(accs[1], vs(14), {from: accs[0]});
            assert.equal(+(await token.balanceOf(accs[0])), vs(21));
            assert.equal(+(await token.frozenTokens(accs[0])), vs(22));
            assert.equal(+(await token.balanceOf(accs[1])), vs(21));
            assert.equal(+(await token.frozenTokens(accs[1])), 0);
            assert.equal(await token.isFreezed(), false);

            await token.unfreezeMyTokens({from: accs[0]});
            assert.equal(+(await token.balanceOf(accs[0])), vs(21));
            assert.equal(+(await token.frozenTokens(accs[0])), 0);
            assert.equal(+(await token.balanceOf(accs[1])), vs(21));
            assert.equal(+(await token.frozenTokens(accs[1])), 0);
            assert.equal(await token.isFreezed(), false);
        });
    });
});