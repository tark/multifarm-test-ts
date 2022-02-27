import {
  getContractName,
  getListOfTokenTransferredByAddress,
  getListOfTokenTransferredByContractAddress,
  getTransactionDetails
} from "../api/etherscan_api";
import Logger from "../util/logger";
import moment from "moment";
import {getSymbolRateLatest} from "../api/coinmarketcap_api";

const L = new Logger('MainController');

export default class MainController {

  async getRevenue(txHash: string): Promise<any[]> {

    try {
      // get the transaction details
      const transactionDetails = await getTransactionDetails(txHash)

      // check just in case wrong tx hash has been provided
      // ideally need to check the hash for validity and return the meaningful error
      if (!transactionDetails) {
        return []
      }

      const fromAddress = transactionDetails.from
      const toAddress = transactionDetails.to

      // the logic below is pretty questionable
      // we are getting all the events of ERC20 tokens transferred FROM or TO any of these addresses
      // the goal is to find any token transfer from or to known addresses
      // such an events can be pretty lot (1000+).
      // so we need to think how to make it more efficiently
      const events = [
        ...await getListOfTokenTransferredByAddress(fromAddress),
        ...await getListOfTokenTransferredByAddress(toAddress),
        ...await getListOfTokenTransferredByContractAddress(fromAddress),
        ...await getListOfTokenTransferredByContractAddress(toAddress),
      ]

      const olympusContractAddress = process.env.OLYMPUS_TREASURE_CONTRACT_ADDRESS.toString().toLowerCase()
      // now we filter all the found transfers by our tx hash (and get all token transfers within given tx)
      // and also take those which transfers token to Olympus Treasure address (this address is constant)
      // as a result we have the Olympus profit inside the given tx
      //
      // another way of doing this will be to get ALL the token transfer to Olympus Treasury
      // and filter by this given txHash. But as the Olympus has high traffic, it can be even worse.
      // anyways, there is a room to improve it.
      const revenueEvents = events.filter(e => e.hash == transactionDetails.hash && e.to.toLowerCase() == olympusContractAddress)

      const result = []
      for (const e of revenueEvents) {
        try {
          // for every such en event (profit) we getting the info to return
          // not sure if we need to combine it to one event if Olympus will have
          // a few profits within one transaction. Right now I am considering
          // it CAN have a few profits in one tx, and I return it as an array

          // take the USD and ETH rates
          const symbolRate = await getSymbolRateLatest(e.tokenSymbol)
          const ethRate = await getSymbolRateLatest('ETH')
          const value = parseFloat(e.value) / Math.pow(10, parseInt(e.tokenDecimal))
          const incomeUsd = value * symbolRate
          const incomeEth = incomeUsd / ethRate
          const contractName = await getContractName(olympusContractAddress)

          result.push({
            date: moment(parseInt(e.timeStamp) * 1000).format('DD.MM.yy HH:mm'),
            timestamp: e.timeStamp,
            incomeType: contractName,
            bondName: 'Unknown',
            partner: e.tokenName,
            asset: e.tokenSymbol,
            incomeAmount: value,
            incomeUsd: incomeUsd,
            incomeEth: incomeEth,
            incomeAnnualized: incomeUsd * 365,
          })
        } catch (e) {
          L.e(`getRevenue - ${e.stack}`)
        }
      }

      return result

    } catch (e) {
      L.e(`getRevenue - error: ${e.stack}`)
    }

  }

  /**
   * Util function for the logging
   */
  private short = (address: string): string => {
    if (!address) {
      return ''
    }
    return address.substr(0, 4) + '...' + address.substr(address.length - 4, address.length)
  }

}
