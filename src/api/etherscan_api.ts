import axios from 'axios';
import Logger from "../util/logger";
import {TokenTransferEvent, TransactionDetails} from "./models";

const L = new Logger('EtherscanApi')

export const getTransactionDetails = async (txHash: string): Promise<TransactionDetails> => {
  const response = await get('', {
    module: 'proxy',
    action: 'eth_getTransactionByHash',
    txhash: txHash,

  })
  return response.data.result
}

export const getListOfTokenTransferredByAddress = async (address: string): Promise<TokenTransferEvent[]> => {
  const response = await get('', {
    module: 'account',
    action: 'tokentx',
    address: address,
    startblock: '0',
    endblock: '27025780',
    sort: 'asc',
  })
  return response.data.result
}

export const getListOfTokenTransferredByContractAddress = async (contractAddress: string): Promise<TokenTransferEvent[]> => {
  const response = await get('', {
    module: 'account',
    action: 'tokentx',
    contractaddress: contractAddress,
    startblock: '0',
    endblock: '27025780',
    sort: 'asc',
  })
  return response.data.result
}

export const getContractName = async (contractAddress: string): Promise<string> => {

  const response = await get('', {
    module: 'contract',
    action: 'getsourcecode',
    address: contractAddress,
  })

  const info = response.data.result ?? []

  if (info.length == 0) {
    return ''
  }

  return info[0].ContractName
}

/**
 * Implemented it, but turns out this a PRO endpoint
 * https://docs.etherscan.io/api-pro/etherscan-api-pro
 */
export const getTokenInfo = async (contractAddress: string): Promise<any> => {
  const result = await get('', {
    module: 'token',
    action: 'tokeninfo',
    contractaddress: contractAddress
  })
  return (result.data.result ?? [{}])[0]
}

// ----------

const get = async (endpoint: string, params?: any): Promise<any> => {
  return await axios.create().get(`${apiHost()}/${endpoint}`, {
    params: {
      ...params,
      apikey: process.env.ETHERSCAN_API_KEY,
    }
  })
}

const post = async (endpoint: string, params?: any): Promise<any> => {
  return await axios.create().post(`${apiHost()}/${endpoint}`, {params})
}

const apiHost = () => {
  return process.env.ETHERSCAN_API_URL
}

