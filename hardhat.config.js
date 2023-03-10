require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()
require("hardhat-deploy")

/** @type import('hardhat/config').HardhatUserConfig */
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ""
const GOERLI_RPC_URL =
    process.env.GOERLI_RPC_URL ||
    "https://eth-goerli.g.alchemy.com/v2/7LP0D8QZiAo2JnyLF5hjMo7LNhzVAq-x"
const PRIVATE_KEY =
    process.env.PRIVATE_KEY ||
    "0xa8d435457ecc795edebcc91ed28f5550c4ce4a1239c280c17149be1bfb644345"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337
            // gasPrice: 130000000000,
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 5,
            blockConfirmations: 6
        }
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "ETH"
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0 // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        }
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY
        // customChains: [], // uncomment this line if you are getting a TypeError: customChains is not iterable
    },

    solidity: { compilers: [{ version: "0.8.17" }, { version: "0.6.6" }] }
}
