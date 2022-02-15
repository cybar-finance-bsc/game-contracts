require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("solidity-coverage");
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const fs = require('fs');
const private_key = fs.readFileSync("./untracked/private_key").toString().trim();


module.exports = {
  gasReporter: {
    enabled: true,
    currency: 'EUR',
    gasPrice: 21
  },
  networks: {
    hardhat: {
      mining: {
        auto: false,
        interval: 5000
      },
      forking: {
        url: "https://rpc.ftm.tools/",
        // fix mainnet fork to block number
        blockNumber: 31066843,
      },
      blockGasLimit: 13000000,
      gasPrice: 20
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.7.3",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      }
    ]
  }
};
