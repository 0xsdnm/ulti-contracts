import { Decimal } from 'decimal.js'
import { BigNumber, BigNumberish, utils } from 'ethers'

export function formatTokenAmount(num: BigNumberish): string {
  return new Decimal(num.toString()).dividedBy(new Decimal(10).pow(18)).toPrecision(5)
}

export function toWei(num: BigNumberish): BigNumberish {
  return BigNumber.from(num).mul(BigNumber.from(10).pow(BigNumber.from(18)))
}

export function toEther(num: BigNumberish): BigNumberish {
  return BigNumber.from(num).div(BigNumber.from(10).pow(BigNumber.from(18)))
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/* UltiCoin consts */

const MAX_SUPPLY = toWei(BigNumber.from(250000000000))
const INITIAL_SUPPLY = toWei(BigNumber.from(160620000000))
const CROWDSALE_SUPPLY = toWei(BigNumber.from(59370000000))

const NAME = 'ULTI Coin'
const SYMBOL = 'ULTI'
const DECIMALS = 18

/* Crowdsale consts */

enum Stages {
  Inactive,
  GuaranteedSpot,
  PrivateSale,
  Presale1,
  Presale2,
  Presale3,
  Presale4,
  Presale5,
}

const OPENING_TIME = 1623427200
const CLOSING_TIME = 1631451600
const GUARANTEED_SPOT_WHITELIST = 'GUARANTEED_SPOT_WHITELIST'
const PRIVATE_SALE_WHITELIST = 'PRIVATE_SALE_WHITELIST'
const KYCED_WHITELIST = 'KYCED_WHITELIST'

const VESTING_START_OFFSET = 864000 // 10 days
const VESTING_CLIFF_DURATION = 864000 // 10 days
const VESTING_DURATION = 8640000 // 100 days
const VESTING_INITIAL_PERCENT = 10

type StageData = {
  closeTimestamp: BigNumberish
  rate: BigNumberish
  bonus: BigNumberish
  cap: BigNumberish
  minContribution: BigNumber
  maxContribution: BigNumber
  whitelists?: string[]
  wrongWhitelist?: string[]
}

const stagesData: StageData[] = [
  {
    closeTimestamp: 0,
    rate: 0,
    bonus: 0,
    cap: 0,
    minContribution: BigNumber.from(0),
    maxContribution: BigNumber.from(0),
  },
  {
    closeTimestamp: 1623513600,
    rate: 4000000,
    bonus: 30,
    cap: utils.parseEther('2500'),
    minContribution: utils.parseEther('0.5'),
    maxContribution: utils.parseEther('5'),
    whitelists: [GUARANTEED_SPOT_WHITELIST],
    wrongWhitelist: [PRIVATE_SALE_WHITELIST, KYCED_WHITELIST],
  },
  {
    closeTimestamp: 1624723200,
    rate: 4000000,
    bonus: 30,
    cap: utils.parseEther('2500'),
    minContribution: utils.parseEther('0.5'),
    maxContribution: utils.parseEther('5'),
    whitelists: [PRIVATE_SALE_WHITELIST, GUARANTEED_SPOT_WHITELIST],
    wrongWhitelist: [KYCED_WHITELIST],
  },
  {
    closeTimestamp: 1625932800,
    rate: 2000000,
    bonus: 10,
    cap: utils.parseEther('3500'),
    minContribution: utils.parseEther('1'),
    maxContribution: utils.parseEther('10'),
    whitelists: [KYCED_WHITELIST],
    wrongWhitelist: [PRIVATE_SALE_WHITELIST, GUARANTEED_SPOT_WHITELIST],
  },
  {
    closeTimestamp: 1627142400,
    rate: 1333333,
    bonus: 5,
    cap: utils.parseEther('6000'),
    minContribution: utils.parseEther('1'),
    maxContribution: utils.parseEther('20'),
    whitelists: [KYCED_WHITELIST],
    wrongWhitelist: [PRIVATE_SALE_WHITELIST, GUARANTEED_SPOT_WHITELIST],
  },
  {
    closeTimestamp: 1628352000,
    rate: 1000000,
    bonus: 3,
    cap: utils.parseEther('9000'),
    minContribution: utils.parseEther('1'),
    maxContribution: utils.parseEther('30'),
    whitelists: [KYCED_WHITELIST],
    wrongWhitelist: [PRIVATE_SALE_WHITELIST, GUARANTEED_SPOT_WHITELIST],
  },
  {
    closeTimestamp: 1629561600,
    rate: 800000,
    bonus: 0,
    cap: utils.parseEther('12500'),
    minContribution: utils.parseEther('1'),
    maxContribution: utils.parseEther('50'),
    whitelists: [KYCED_WHITELIST],
    wrongWhitelist: [PRIVATE_SALE_WHITELIST, GUARANTEED_SPOT_WHITELIST],
  },
  {
    closeTimestamp: 1631451600,
    rate: 666667,
    bonus: 0,
    cap: utils.parseEther('16500'),
    minContribution: utils.parseEther('1'),
    maxContribution: utils.parseEther('100'),
    whitelists: [KYCED_WHITELIST],
    wrongWhitelist: [PRIVATE_SALE_WHITELIST, GUARANTEED_SPOT_WHITELIST],
  },
]

export {
  MAX_SUPPLY,
  INITIAL_SUPPLY,
  stagesData,
  ZERO_ADDRESS,
  Stages,
  OPENING_TIME,
  CLOSING_TIME,
  PRIVATE_SALE_WHITELIST,
  GUARANTEED_SPOT_WHITELIST,
  CROWDSALE_SUPPLY,
  NAME,
  SYMBOL,
  DECIMALS,
  KYCED_WHITELIST,
  VESTING_DURATION,
  VESTING_CLIFF_DURATION,
  VESTING_INITIAL_PERCENT,
  VESTING_START_OFFSET,
}
