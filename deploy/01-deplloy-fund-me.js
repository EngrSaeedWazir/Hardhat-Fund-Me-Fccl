//import
//main function
//calling of main function

const { getNamedAccounts, deployments } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { verify } = require("../utils/verify")
// const helperConfig = require("../helper-hardhat-config") //this is same as above but we use the above to pull because of export
// const networkConfig = helperConfig.networkConfig

// function deployFunc(hre) {
//     console.log("Hi")
//hre.getNameAccounts()
//hre.deployments
// }

// module.exports.default = deployFunc

// module.exports= async (hre) => {
//     const {getNamedAccounts,deployments}=hre
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //hre.getNameAccounts
    //hre.deployments

    //well what happen when we want to change chain
    //when going for localhost or hardhat we want to use a mock

    //if chain id is X use address Y
    //if chainId is Z Use address A
    //const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsPriceFeed"]
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    log("----------------------------------------------------")
    log("Deploying FundMe and waiting for confirmations...")
    //if the contract doesnot exist, we deploy a minimal version of it
    //for our local testing
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, //put pricefeed Address
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
    log("-----------------------------------")
}
module.exports.tags = ["all", "fundme"]
