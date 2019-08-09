const TokenContract = artifacts.require("./Token.sol");


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
    let auctionOwner = accounts[1];
    let sale = accounts[2];
    let advisors = accounts[4];
    let bounty = accounts[5];
    let team = accounts[6];
    let deposite = accounts[7];

    let zeroAddress = "0x0000000000000000000000000000000000000000";

    let ab = vs(1000000);
    let bb = vs(2000000);
    let tb = vs(15000000);
    let totalSupply = vs(100000000);

    let token;

    let recievers = [accounts[8], accounts[9]];
    let amounts = [vs(120), vs(230)];

    describe('Token information', async () => {
        it('token init', async () => {
            token = await TokenContract.new(advisors, bounty, team, {from: tokenOwner});
        });                
        it('LUM name', async function () {
            assert.equal(await token.name(), "Illuminat token");
        });
        it('LUM symbol', async function () {
            assert.equal(await token.symbol(), "LUM");
        });
        it('LUM decimal', async function () {
            assert.equal(await token.decimals(), 18);
        });
        it('total amount of tokens', async function () {
            assert.equal(await token.totalSupply(), totalSupply);
        });
        it('owner check', async function () {
            assert.equal(await token.owner(), tokenOwner);
        });
        it('advisors check', async function () {
            assert.equal(+(await token.balanceOf(advisors)), ab);
        });
        it('bounty check', async function () {
            assert.equal(+(await token.balanceOf(bounty)), bb);
        });
        it('team check', async function () {
            assert.equal(+(await token.balanceOf(team)), 0);
        });
    });


    describe('Token functionality', async () => {
        beforeEach('init', async function () {
            token = await TokenContract.new(advisors, bounty, team, {from: tokenOwner});
        });

        it('team check', async function () {
            await increaseTime(2 * 365*day);

            await token.getTeamTokens();

            assert.equal(+(await token.balanceOf(team)), tb);
        });

        it('service pay', async function () {
            await token.setDepositeAddress(deposite, {from: tokenOwner});
            assert.equal(+(await token.balanceOf(deposite)), 0);

            await token.payService("test", auctionOwner, vs(100), {from: bounty});
            assert.equal(+(await token.balanceOf(deposite)), vs(10));
            assert.equal(+(await token.balanceOf(auctionOwner)), vs(80));
            assert.equal(+(await token.totalSupply()), vs(100000000-10));

            await token.payService("test", auctionOwner, vs(2000), {from: bounty});
            assert.equal(+(await token.balanceOf(deposite)), vs(210));
            assert.equal(+(await token.balanceOf(auctionOwner)), vs(1680));
            assert.equal(+(await token.totalSupply()), vs(100000000-210));
        });
        
        it('send ether', async () => {
            bal1 = await web3.eth.getBalance(accounts[9]);
            balc1 = await web3.eth.getBalance(token.address);
            try {
                await web3.eth.sendTransaction({from: accounts[9], to: token.address, gas: 150000, value: 1 * decimals});
                console.log("Fail!\n Exception must be thrown before");
            } catch (error) {assert(error.message.includes("revert"));}

            bal2 = await web3.eth.getBalance(accounts[9]);
            balc2 = await web3.eth.getBalance(token.address);

            assert(0 < bal2 - bal1 < 0.01 * decimals);
            assert(2 < 0 < 5)
            assert.equal(balc1, 0);
            assert.equal(balc2, 0);
        });
    });


    describe('Requirement check', async () => {
        beforeEach('init', async function () {
            token = await TokenContract.new(advisors, bounty, team, {from: tokenOwner});
        });

        it('team check', async function () {
            try {
                await token.getTeamTokens();
                console.log("Fail!\n Exception must be thrown before");
            } catch (error) {assert(error.message.includes("2 years have not expired"));}
            assert.equal(+(await token.balanceOf(team)), 0);

            await increaseTime(2 * 365*day);
            await token.getTeamTokens();
            assert.equal(+(await token.balanceOf(team)), tb);

            try {
                await token.getTeamTokens();
                console.log("Fail!\n Exception must be thrown before");
            } catch (error) {assert(error.message.includes("Already paid"));}
            assert.equal(+(await token.balanceOf(team)), tb);
        });

        it('service check (deposit address is zero)', async function () {
            try {
                await token.payService("test", auctionOwner, vs(100), {from: bounty});
                console.log("Fail!\n Exception must be thrown before");
            } catch (error) {assert(error.message.includes("ERC20: transfer to the zero address"));}
            assert.equal(+(await token.balanceOf(deposite)), 0);
            assert.equal(+(await token.balanceOf(bounty)), vs(2000000));
            assert.equal(+(await token.balanceOf(auctionOwner)), 0);
            assert.equal(+(await token.totalSupply()), totalSupply);

            await token.setDepositeAddress(deposite, {from: tokenOwner});

            await token.payService("test", auctionOwner, vs(100), {from: bounty});
            assert.equal(+(await token.balanceOf(deposite)), vs(10));
            assert.equal(+(await token.balanceOf(bounty)), vs(2000000-100));
            assert.equal(+(await token.balanceOf(auctionOwner)), vs(80));
            assert.equal(+(await token.totalSupply()), vs(100000000-10));
        });
        
        it('try to set deposite address not by owner', async function () {
            try {
                await token.setDepositeAddress(deposite, {from: auctionOwner});
                console.log("Fail!\n Exception must be thrown before");
            } catch (error) {assert(error.message.includes("Ownable: caller is not the owner"));}
        });
        
        it('try to get team tokens not by owner', async function () {
            await increaseTime(2 * 365*day);

            try {
                await token.getTeamTokens({from: auctionOwner});
                console.log("Fail!\n Exception must be thrown before");
            } catch (error) {assert(error.message.includes("Ownable: caller is not the owner"));}
            assert.equal(+(await token.balanceOf(team)), 0);
        });
    });

    
    describe('Sending tokens', async () => {

        beforeEach('init', async () => {
            token = await TokenContract.new(advisors, bounty, team, {from: tokenOwner});
        });

        it('send tokens', async () => {
            await token.sendTokens(recievers, amounts, {from: tokenOwner});

            assert.equal(+(await token.balanceOf(accounts[8])), amounts[0]);
            assert.equal(+(await token.balanceOf(accounts[9])), amounts[1]);
            assert.equal(+(await token.balanceOf(token.address)), +vs(97000000 - 350));
        });

        it('sending tokens (different length)', async () => {
            recievers = [accounts[9]];
            amounts = [vs(120), vs(230)];

            try {
                await token.sendTokens(recievers, amounts, {from: tokenOwner});
                console.log("Fail!\n Exception must be thrown before");
            } catch (error) {assert(error.message.includes("The length of the arrays must be equal"));}
            assert.equal(+(await token.balanceOf(accounts[8])), 0);

            recievers = [accounts[9], accounts[8]];
            amounts = [vs(230)];

            try {
                await token.sendTokens(recievers, amounts, {from: tokenOwner});
                console.log("Fail!\n Exception must be thrown before");
            } catch (error) {assert(error.message.includes("The length of the arrays must be equal"));}
            assert.equal(+(await token.balanceOf(accounts[8])), 0);

            recievers = [accounts[9], accounts[8]];
            amounts = [vs(120), vs(230)];
        });

        it('sending tokens (reciever is zero address)', async () => {
            recievers = [accounts[9], zeroAddress];
            amounts = [vs(120), vs(230)];

            try {
                await token.sendTokens(recievers, amounts, {from: tokenOwner});
                console.log("Fail!\n Exception must be thrown before");
            } catch (error) {assert(error.message.includes("ERC20: transfer to the zero address"));}
            assert.equal(+(await token.balanceOf(accounts[8])), 0);
            assert.equal(+(await token.balanceOf(accounts[9])), 0);
            assert.equal(+(await token.balanceOf(token.address)), +vs(97000000));
        });

        it('sending tokens (not by owner)', async () => {
            recievers = [accounts[8], accounts[9]];
            amounts = [vs(120), vs(230)];

            try {
                await token.sendTokens(recievers, amounts, {from: sale});
                console.log("Fail!\n Exception must be thrown before");
            } catch (error) {assert(error.message.includes("Ownable: caller is not the owner"));}
            assert.equal(+(await token.balanceOf(accounts[8])), 0);
            assert.equal(+(await token.balanceOf(accounts[9])), 0);
            assert.equal(+(await token.balanceOf(token.address)), +vs(97000000));
        });
    });  
 });
