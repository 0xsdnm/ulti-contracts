import { ethers } from 'hardhat'

async function main() {
  const tokenFactory = await ethers.getContractFactory('UltiCoin')

  const owner = '0x'
  // mainnet BSC Router Address: 0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F
  // testnet BSC Router Address: 0xD99D1c33F9fC3444f8101754aBC46c52416550D1
  const pancakeRouterAddress = '0x'
  const deployTx = await tokenFactory.getDeployTransaction(owner, pancakeRouterAddress)

  console.log('UltiCoin bytecode:')
  console.log(deployTx.data)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
