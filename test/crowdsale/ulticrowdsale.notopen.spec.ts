import { expect, use } from 'chai'
import { ethers } from 'hardhat'
import { UltiCrowdsale__factory, UltiCoinUnswappable__factory } from '../../typechain'
import { solidity } from 'ethereum-waffle'
import { utils } from 'ethers'
import {
  PRIVATE_SALE_WHITELIST,
  Stages,
  CROWDSALE_SUPPLY,
  ZERO_ADDRESS,
  MAX_SUPPLY,
  GUARANTEED_SPOT_WHITELIST,
  KYCED_WHITELIST,
} from '../common'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { keccak256 } from 'ethers/lib/utils'

use(solidity)

describe('UltiCrowdsale', () => {
  let deployer: SignerWithAddress
  let admin: SignerWithAddress
  let investor: SignerWithAddress
  let wallet: SignerWithAddress
  let purchaser: SignerWithAddress
  let addrs: SignerWithAddress[]

  const value = utils.parseEther('1')

  let tokenFactory: UltiCoinUnswappable__factory
  let crowdsaleFactory: UltiCrowdsale__factory

  const guaranteedSpotWhitelistBytes = keccak256(Buffer.from(GUARANTEED_SPOT_WHITELIST))
  const privateSaleWhitelistBytes = keccak256(Buffer.from(PRIVATE_SALE_WHITELIST))
  const kycedWhitelistBytes = keccak256(Buffer.from(KYCED_WHITELIST))

  before(async () => {
    await ethers.provider.send('hardhat_reset', [])
  })

  beforeEach(async () => {
    ;[deployer, admin, wallet, investor, purchaser, ...addrs] = await ethers.getSigners()
    tokenFactory = (await ethers.getContractFactory('UltiCoinUnswappable')) as UltiCoinUnswappable__factory
    crowdsaleFactory = (await ethers.getContractFactory('UltiCrowdsale')) as UltiCrowdsale__factory
  })

  it('requires a non-null token', async function () {
    await expect(crowdsaleFactory.deploy(admin.address, wallet.address, ZERO_ADDRESS)).to.be.revertedWith(
      'Crowdsale: token is the zero address'
    )
  })

  context('with token', async function () {
    beforeEach(async function () {
      this.token = await tokenFactory.connect(deployer).deploy(wallet.address)
      expect(await this.token.balanceOf(wallet.address)).to.equal(MAX_SUPPLY)
    })

    it('requires a non-null wallet', async function () {
      this.token = await tokenFactory.connect(deployer).deploy(wallet.address)
      expect(await this.token.balanceOf(wallet.address)).to.equal(MAX_SUPPLY)

      await expect(crowdsaleFactory.deploy(admin.address, ZERO_ADDRESS, this.token.address)).to.be.revertedWith(
        'Crowdsale: wallet is the zero address'
      )
    })

    it('requires a non-null admin', async function () {
      this.token = await tokenFactory.connect(deployer).deploy(wallet.address)
      await expect(crowdsaleFactory.deploy(ZERO_ADDRESS, wallet.address, this.token.address)).to.be.revertedWith(
        'WhitelistAccess: admin is the zero address'
      )
    })

    context('once deployed and not yet open', async function () {
      beforeEach(async function () {
        this.crowdsale = await crowdsaleFactory.connect(admin).deploy(admin.address, wallet.address, this.token.address)
        await this.crowdsale.connect(admin).addToWhitelist(guaranteedSpotWhitelistBytes, investor.address)
        await this.crowdsale.connect(admin).addToWhitelist(kycedWhitelistBytes, investor.address)
        await this.token.connect(wallet).transfer(this.crowdsale.address, CROWDSALE_SUPPLY)
        expect(await this.token.balanceOf(this.crowdsale.address)).to.equal(CROWDSALE_SUPPLY)
      })

      it('reverts on positive payments', async function () {
        await expect(purchaser.sendTransaction({ to: this.crowdsale.address, value: value })).to.be.revertedWith(
          'TimedCrowdsale: not open'
        )
      })

      it('reverts on ZERO payments', async function () {
        await expect(purchaser.sendTransaction({ to: this.crowdsale.address, value: 0 })).to.be.revertedWith(
          'TimedCrowdsale: not open'
        )
      })

      it('reverts on tokens purchase', async function () {
        await expect(
          this.crowdsale.connect(purchaser).buyTokens(investor.address, { value: value })
        ).to.be.revertedWith('TimedCrowdsale: not open')
      })

      it('reverts on tokens withdrawal', async function () {
        await expect(this.crowdsale.connect(purchaser).releaseTokens(investor.address)).to.be.revertedWith(
          'PostVestingCrowdsale: not closed'
        )
      })

      it('is in Inactive stage', async function () {
        expect(await this.crowdsale.connect(purchaser).stage()).to.be.equal(Stages.Inactive.valueOf())
      })

      it('has ZERO rate', async function () {
        expect(await this.crowdsale.connect(purchaser).rate()).to.be.equal(0)
      })

      it('has ZERO bonus', async function () {
        expect(await this.crowdsale.connect(purchaser).bonus()).to.be.equal(0)
      })

      it('has ZERO cap', async function () {
        expect(await this.crowdsale.connect(purchaser).cap()).to.be.equal(0)
      })

      it('has ZERO tokens sold', async function () {
        expect(await this.crowdsale.connect(purchaser).tokensSold()).to.be.equal(0)
      })

      it('has ZERO tokens released', async function () {
        expect(await this.crowdsale.connect(purchaser).tokensReleased()).to.be.equal(0)
      })

      it('has ZERO min contribution', async function () {
        expect(await this.crowdsale.connect(purchaser).minContribution()).to.be.equal(0)
      })

      it('has ZERO max contribution', async function () {
        expect(await this.crowdsale.connect(purchaser).maxContribution()).to.be.equal(0)
      })

      it('has ZERO wei raised in stage', async function () {
        expect(await this.crowdsale.connect(purchaser).weiRaisedInStage(Stages.Inactive.valueOf())).to.be.equal(0)
      })

      it('has ZERO left to stage cap', async function () {
        expect(await this.crowdsale.connect(purchaser).weiToStageCap()).to.be.equal(0)
      })

      context('whitelisting', async function () {
        context('addToWhitelist', async function () {
          it('reverts when not called by whitelist manager', async function () {
            await expect(
              this.crowdsale.connect(purchaser).addToWhitelist(privateSaleWhitelistBytes, investor.address)
            ).to.be.revertedWith(
              `AccessControl: account ${purchaser.address.toLowerCase()} is missing role ${await this.crowdsale.WHITELIST_MANAGER_ROLE()}`
            )
          })

          it('adds address to whitelist when called by admin', async function () {
            await this.crowdsale.connect(admin).addToWhitelist(privateSaleWhitelistBytes, investor.address)
            await expect(
              await this.crowdsale.connect(admin).isWhitelisted(privateSaleWhitelistBytes, investor.address)
            ).to.be.true
          })

          it('adds address to whitelist when called by whitelist manager', async function () {
            const whitelistMangerRole = await this.crowdsale.WHITELIST_MANAGER_ROLE()
            await this.crowdsale.connect(admin).grantRole(whitelistMangerRole, deployer.address)
            await expect(
              await this.crowdsale.connect(deployer).hasRole(whitelistMangerRole, deployer.address)
            ).to.be.true
            await this.crowdsale.connect(deployer).addToWhitelist(privateSaleWhitelistBytes, investor.address)
            await expect(
              await this.crowdsale.connect(deployer).isWhitelisted(privateSaleWhitelistBytes, investor.address)
            ).to.be.true
          })

          it('should log whitelisting', async function () {
            await expect(this.crowdsale.connect(admin).addToWhitelist(privateSaleWhitelistBytes, investor.address))
              .to.emit(this.crowdsale, 'WhitelistAdded')
              .withArgs(privateSaleWhitelistBytes, investor.address)
          })
        })

        context('bulkAddToWhitelists', async function () {
          let addresses: string[]
          beforeEach(async function () {
            addresses = addrs.map(function (a) {
              return a.address
            })
          })

          it('reverts when not called by admin', async function () {
            await expect(
              this.crowdsale.connect(purchaser).bulkAddToWhitelists([privateSaleWhitelistBytes], addresses)
            ).to.be.revertedWith(
              `AccessControl: account ${purchaser.address.toLowerCase()} is missing role ${await this.crowdsale.WHITELIST_MANAGER_ROLE()}`
            )
          })

          it('adds addresses to whitelists', async function () {
            await this.crowdsale
              .connect(admin)
              .bulkAddToWhitelists([privateSaleWhitelistBytes, kycedWhitelistBytes], addresses)
            for (let address of addresses) {
              await expect(await this.crowdsale.isWhitelisted(privateSaleWhitelistBytes, address)).to.be.true
              await expect(await this.crowdsale.isWhitelisted(kycedWhitelistBytes, address)).to.be.true
            }
          })
        })

        context('removeFromWhitelist', async function () {
          beforeEach(async function () {
            await this.crowdsale.connect(admin).addToWhitelist(privateSaleWhitelistBytes, investor.address)
          })

          it('reverts when not called by admin', async function () {
            await expect(
              this.crowdsale.connect(purchaser).removeFromWhitelist(privateSaleWhitelistBytes, investor.address)
            ).to.be.revertedWith(
              `AccessControl: account ${purchaser.address.toLowerCase()} is missing role ${await this.crowdsale.WHITELIST_MANAGER_ROLE()}`
            )
          })

          it('removes address from whitelist', async function () {
            await this.crowdsale.connect(admin).removeFromWhitelist(privateSaleWhitelistBytes, investor.address)
            await expect(
              await this.crowdsale.connect(admin).isWhitelisted(privateSaleWhitelistBytes, investor.address)
            ).to.be.false
          })

          it('should log removing from whitelist', async function () {
            await expect(this.crowdsale.connect(admin).removeFromWhitelist(privateSaleWhitelistBytes, investor.address))
              .to.emit(this.crowdsale, 'WhitelistRemoved')
              .withArgs(privateSaleWhitelistBytes, investor.address)
          })
        })
      })

      context('changeTokenAddress', async function () {
        beforeEach(async function () {
          this.newToken = await tokenFactory.connect(deployer).deploy(wallet.address)
        })

        it('reverts when not called by admin', async function () {
          await expect(this.crowdsale.connect(purchaser).changeTokenAddress(this.newToken.address)).to.be.revertedWith(
            `AccessControl: account ${purchaser.address.toLowerCase()} is missing role ${await this.crowdsale.DEFAULT_ADMIN_ROLE()}`
          )
        })

        it('reverts when token is ZERO_ADDRESS', async function () {
          await expect(this.crowdsale.connect(admin).changeTokenAddress(ZERO_ADDRESS)).to.be.revertedWith(
            'Crowdsale: token is the zero address'
          )
        })

        it('changes token address', async function () {
          await this.crowdsale.connect(admin).changeTokenAddress(this.newToken.address)
          expect(await this.crowdsale.connect(admin).token()).to.be.equal(this.newToken.address)
        })

        it('emits TokenChanged event', async function () {
          await expect(this.crowdsale.connect(admin).changeTokenAddress(this.newToken.address))
            .to.emit(this.crowdsale, 'TokenChanged')
            .withArgs(this.newToken.address)
        })
      })
    })
  })
})
