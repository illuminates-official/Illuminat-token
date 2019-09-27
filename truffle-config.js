
module.exports = {

  networks: {
    development: {
     host: "127.0.0.1",
     port: 8545,
     network_id: "*",
    },
  },

  mocha: {
    // reporter: 'eth-gas-reporter',
    // reporterOptions : {
    //   currency: 'USD',
    //   showTimeSpent: true,
    //   excludeContracts: ['Migrations'],
    //   onlyCalledMethods: true
    //  }
  },

  compilers: {
    solc: {
      version: "0.5.11",
      docker: false,
      settings: {
       optimizer: {
         enabled: true,
         runs: 200
       },
       evmVersion: "petersburg"
      }
    }
  }
};
