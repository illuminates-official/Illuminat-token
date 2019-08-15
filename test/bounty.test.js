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


contract('Bounty', function (accounts) {

    let tokenOwner = accounts[0];
    let bountyOwner = accounts[1];
    let advisors = accounts[2];
    let bounty;
    let team = accounts[3];

    let zeroAddress = "0x0000000000000000000000000000000000000000";

    let ab = vs(1000000);
    let bb = vs(2000000);
    let tb = vs(15000000);
    let totalSupply = vs(100000000);

    let token;

    let accs = [accounts[8], accounts[9]];
    let amounts = [vs(25), vs(20)];


    describe('Bounty main', async () => {
        beforeEach('init', async function () {
            bounty = await BountyContract.new({from: bountyOwner});
            token = await TokenContract.new(advisors, bounty.address, team, {from: tokenOwner});
            await bounty.setToken(token.address, {from: bountyOwner});
        });

        it('transfer', async function () {
            assert.equal(+(await token.balanceOf(accounts[4])), 0);
            assert.equal(+(await token.balanceOf(bounty.address)), bb);

            await bounty.transfer(accounts[4], vs(10), {from: bountyOwner});

            assert.equal(+(await token.balanceOf(accounts[4])), vs(10));
            assert.equal(+(await token.balanceOf(bounty.address)), vs(2000000 - 10));
        });

        it('add airdrop account', async function () {
            await bounty.addAirdropAccount(accounts[4], vs(25), {from: bountyOwner});

            assert.equal(+(await bounty.airdropBalances(accounts[4])), vs(25));
            assert.equal(await bounty.airdropReceived(accounts[4]), false);
        });

        it('add airdrop accounts', async function () {
            await bounty.addAirdropAccounts(accs, amounts, {from: bountyOwner});

            assert.equal(+(await bounty.airdropBalances(accs[0])), amounts[0]);
            assert.equal(await bounty.airdropReceived(accs[0]), false);
            assert.equal(+(await bounty.airdropBalances(accs[1])), amounts[1]);
            assert.equal(await bounty.airdropReceived(accs[1]), false);
        });

        it('receiving tokens', async function () {
            await bounty.addAirdropAccounts(accs, amounts, {from: bountyOwner});

            assert.equal(+(await token.balanceOf(accs[0])), 0);
            assert.equal(await bounty.airdropReceived(accs[0]), false);
            assert.equal(+(await token.balanceOf(accs[1])), 0);
            assert.equal(await bounty.airdropReceived(accs[1]), false);

            await bounty.receiveTokens({from: accs[0]});

            assert.equal(+(await token.balanceOf(accs[0])), amounts[0]);
            assert.equal(await bounty.airdropReceived(accs[0]), true);
            assert.equal(+(await token.balanceOf(accs[1])), 0);
            assert.equal(await bounty.airdropReceived(accs[1]), false);

            await bounty.receiveTokens({from: accs[1]});

            assert.equal(+(await token.balanceOf(accs[0])), amounts[0]);
            assert.equal(await bounty.airdropReceived(accs[0]), true);
            assert.equal(+(await token.balanceOf(accs[1])), amounts[1]);
            assert.equal(await bounty.airdropReceived(accs[1]), true);
        });
    });


    describe('Requirements and restrictions', async () => {
        beforeEach('init', async function () {
            bounty = await BountyContract.new({from: bountyOwner});
            token = await TokenContract.new(advisors, bounty.address, team, {from: tokenOwner});
            await bounty.setToken(token.address, {from: bountyOwner});
        });

        it('add airdrop accounts (different length of arrays)', async function () {
            accs = [accounts[8], accounts[9]];
            amounts = [vs(25)];

            try {
                await bounty.addAirdropAccounts(accs, amounts, {from: bountyOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("The length of the arrays must be equal"));}

            assert.equal(+(await bounty.airdropBalances(accs[0])), 0);
            assert.equal(await bounty.airdropReceived(accs[0]), false);
            assert.equal(+(await bounty.airdropBalances(accs[1])), 0);
            assert.equal(await bounty.airdropReceived(accs[1]), false);
  
            accs = [accounts[8], accounts[9]];
            amounts = [vs(25), vs(20), vs(15)];

            try {
                await bounty.addAirdropAccounts(accs, amounts, {from: bountyOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("The length of the arrays must be equal"));}

            assert.equal(+(await bounty.airdropBalances(accs[0])), 0);
            assert.equal(await bounty.airdropReceived(accs[0]), false);
            assert.equal(+(await bounty.airdropBalances(accs[1])), 0);
            assert.equal(await bounty.airdropReceived(accs[1]), false);

            accs = [accounts[8], accounts[9]];
            amounts = [vs(25), vs(20)];
        });

        it('add airdrop accounts (not by owner)', async function () {
            try {
                await bounty.addAirdropAccounts(accs, amounts, {from: tokenOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Ownable: caller is not the owner"));}

            assert.equal(+(await bounty.airdropBalances(accs[0])), 0);
            assert.equal(await bounty.airdropReceived(accs[0]), false);
            assert.equal(+(await bounty.airdropBalances(accs[1])), 0);
            assert.equal(await bounty.airdropReceived(accs[1]), false);
        });

        it('add airdrop account (not by owner)', async function () {
            try {
                await bounty.addAirdropAccount(accounts[4], vs(25), {from: tokenOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Ownable: caller is not the owner"));}

            assert.equal(+(await bounty.airdropBalances(accounts[4])), 0);
            assert.equal(await bounty.airdropReceived(accounts[4]), false);
        });

        it('add airdrop account (zero address)', async function () {
            try {
                await bounty.addAirdropAccount(zeroAddress, vs(25), {from: bountyOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Account is zero address"));}

            assert.equal(+(await bounty.airdropBalances(accounts[4])), 0);
            assert.equal(await bounty.airdropReceived(accounts[4]), false);
            assert.equal(+(await bounty.airdropBalances(zeroAddress)), 0);
            assert.equal(await bounty.airdropReceived(zeroAddress), false);
        });

        it('add airdrop account (balance not zero)', async function () {
            await bounty.addAirdropAccount(accounts[4], vs(25), {from: bountyOwner});
            
            assert.equal(+(await bounty.airdropBalances(accounts[4])), vs(25));
            assert.equal(await bounty.airdropReceived(accounts[4]), false);

            try {
                await bounty.addAirdropAccount(accounts[4], vs(25), {from: bountyOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Airdrop balance already set"));}

            assert.equal(+(await bounty.airdropBalances(accounts[4])), vs(25));
            assert.equal(await bounty.airdropReceived(accounts[4]), false);
        });

        it('add airdrop account (tokens already received)', async function () {
            await bounty.addAirdropAccount(accounts[4], vs(25), {from: bountyOwner});

            assert.equal(+(await bounty.airdropBalances(accounts[4])), vs(25));
            assert.equal(await bounty.airdropReceived(accounts[4]), false);

            await bounty.receiveTokens({from: accounts[4]});

            assert.equal(+(await token.balanceOf(accounts[4])), vs(25));
            assert.equal(await bounty.airdropReceived(accounts[4]), true);

            try {
                await bounty.addAirdropAccount(accounts[4], vs(25), {from: bountyOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Airdrop tokens already received"));}

            assert.equal(+(await bounty.airdropBalances(accounts[4])), 0);
            assert.equal(await bounty.airdropReceived(accounts[4]), true);
        });

        it('receive tokens (tokens already received)', async function () {
            await bounty.addAirdropAccount(accounts[4], vs(25), {from: bountyOwner});

            assert.equal(+(await bounty.airdropBalances(accounts[4])), vs(25));
            assert.equal(await bounty.airdropReceived(accounts[4]), false);

            await bounty.receiveTokens({from: accounts[4]});

            assert.equal(+(await bounty.airdropBalances(accounts[4])), 0);
            assert.equal(+(await token.balanceOf(accounts[4])), vs(25));
            assert.equal(await bounty.airdropReceived(accounts[4]), true);

            try {
                await bounty.receiveTokens({from: accounts[4]});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Airdrop tokens already received"));}

            assert.equal(+(await bounty.airdropBalances(accounts[4])), 0);
            assert.equal(+(await token.balanceOf(accounts[4])), vs(25));
            assert.equal(await bounty.airdropReceived(accounts[4]), true);
        });

        it('set token address (not by owner)', async function () {
            assert.equal(await bounty.token(), token.address);
            try {
                await bounty.setToken(token.address, {from: tokenOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Ownable: caller is not the owner"));}
            assert.equal(await bounty.token(), token.address);
        });

        it('transfer (not by owner)', async function () {
            assert.equal(+(await token.balanceOf(accounts[4])), 0);
            assert.equal(+(await token.balanceOf(bounty.address)), bb);

            try {
                await bounty.transfer(accounts[4], vs(10), {from: tokenOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("Ownable: caller is not the owner"));}

            assert.equal(+(await token.balanceOf(accounts[4])), 0);
            assert.equal(+(await token.balanceOf(bounty.address)), vs(2000000));
        });

        it('transfer (more than have)', async function () {
            assert.equal(+(await token.balanceOf(accounts[4])), 0);
            assert.equal(+(await token.balanceOf(bounty.address)), bb);

            try {
                await bounty.transfer(accounts[4], vs(2000001), {from: bountyOwner});
                throw "Fail!\n Exception must be thrown before";
            } catch (error) {assert(error.message.includes("SafeMath: subtraction overflow"));}

            assert.equal(+(await token.balanceOf(accounts[4])), 0);
            assert.equal(+(await token.balanceOf(bounty.address)), vs(2000000));
        });
    });
});
