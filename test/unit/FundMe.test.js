const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { createImportsForUsedIdentifiers } = require("typechain")

describe("FundMe", async function() {
    let deployer
    let fundMe
    let mockV3Aggregator
    let sendValue = ethers.utils.parseEther("1") //1 ETH
    beforeEach(async function() {
        //deploy our fundme contract
        //using hardhat deploy
        //const accounts= wait ethers.getSigners()

        // const accountZero= accounts[0]
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture("all")
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })
    describe("constructor", async function() {
        it("set the aggregator addresses correctly", async function() {
            const response = await fundMe.s_priceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })
    describe("fund", async function() {
        it("fails if you dont send enough ETH", async function() {
            await expect(fundMe.Fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            )
        })
        it("Update the amount funded data structure", async function() {
            await fundMe.Fund({ value: sendValue })
            const response = await fundMe.s_addressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Add funder to array of s_funders", async function() {
            await fundMe.Fund({ value: sendValue })
            const funder = await fundMe.s_funders(0)
            assert.equal(funder, deployer)
        })
    })
    describe("withdraw", async function() {
        beforeEach(async function() {
            await fundMe.Fund({ value: sendValue })
        })
        it("withdraw ETH from a single founder", async function() {
            // Arrange
            const startingfundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //Act
            const transactionResponse = await fundMe.Withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingfundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //assert
            assert.equal(endingfundMeBalance, 0)
            assert.equal(
                startingfundMeBalance.add(startingDeployerBalance),
                endingDeployerBalance.add(gasCost).toString()
            )
        })

        // this test is overloaded. Ideally we'd split it into multiple tests
        // but for simplicity we left it as one
        it("allows us to withdraw with multiple s_funders", async () => {
            // Arrange
            const accounts = await ethers.getSigners()
            for (i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.Fund({ value: sendValue })
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            // Act
            const transactionResponse = await fundMe.Withdraw()
            // Let's comapre gas costs :)
            // const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait()
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const withdrawGasCost = gasUsed.mul(effectiveGasPrice)
            // console.log(`GasCost: ${withdrawGasCost}`)
            // console.log(`GasUsed: ${gasUsed}`)
            // console.log(`GasPrice: ${effectiveGasPrice}`)
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // Assert
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(withdrawGasCost).toString()
            )
            //make sure that the s_funders are reset properly
            await expect(fundMe.s_funders(0)).to.be.reverted
            for (i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.s_addressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })

        it("Only allows the i_owner to withdraw", async function() {
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const fundMeConnectedContract = await fundMe.connect(attacker)
            await expect(fundMeConnectedContract.Withdraw()).to.be.revertedWith(
                "Sender is not i_owner"
            )
        })

        it("cheaperWithdraw testing...", async () => {
            // Arrange
            const accounts = await ethers.getSigners()
            for (i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.Fund({ value: sendValue })
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            // Act
            const transactionResponse = await fundMe.cheaperWithdraw()
            // Let's comapre gas costs :)
            // const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait()
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const withdrawGasCost = gasUsed.mul(effectiveGasPrice)
            // console.log(`GasCost: ${withdrawGasCost}`)
            // console.log(`GasUsed: ${gasUsed}`)
            // console.log(`GasPrice: ${effectiveGasPrice}`)
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            // Assert
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(withdrawGasCost).toString()
            )
            //make sure that the s_funders are reset properly
            await expect(fundMe.s_funders(0)).to.be.reverted
            for (i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.s_addressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })

        it("withdraw ETH from a single founder", async function() {
            // Arrange
            const startingfundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //Act
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingfundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            //assert
            assert.equal(endingfundMeBalance, 0)
            assert.equal(
                startingfundMeBalance.add(startingDeployerBalance),
                endingDeployerBalance.add(gasCost).toString()
            )
        })
    })
})
