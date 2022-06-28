import { AuthService } from "./authService.service";

import { Injectable } from '@angular/core';
import { async } from '@angular/core/testing';
import algosdk, { Algodv2, Indexer, IntDecoding, BaseHTTPClient, getApplicationAddress, Transaction, waitForConfirmation, TransactionType } from 'algosdk';
import AccountInformation from 'algosdk/dist/types/src/client/v2/algod/accountInformation';
import GetAssetByID from 'algosdk/dist/types/src/client/v2/algod/getAssetByID';
import { environment } from 'src/environments/environment';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import { getAlgodClient, getAppLocalStateByKey, getTransactionParams, singlePayTxn, waitForTransaction } from './utils.algo';
import MyAlgoConnect from '@randlabs/myalgo-connect';
import { Buffer } from 'buffer';
import { PermissionResult, SessionWallet, SignedTxn, allowedWallets, PermissionCallback } from 'algorand-session-wallet';


const client = getAlgodClient()
const myAlgoConnect = new MyAlgoConnect();


@Injectable()
export class WalletsConnectService {

  public sessionWallet: SessionWallet | undefined;
  public myAlgoAddress: any | undefined;
  public myAlgoName: any | undefined;

  constructor(private userServce: AuthService) {
    if (localStorage.getItem('wallet')) {
      sessionStorage.setItem('acct-list', JSON.stringify([localStorage.getItem('wallet')]));
      setTimeout(() => {
        if (this.sessionWallet === undefined || !this.sessionWallet) {
          this.connectOnDefault('my-algo-connect').then(response => response);
        }
      })
    }
  }


  connect = async (choice: string) => {
    console.log('choice', choice);
    const sw = new SessionWallet("TestNet", undefined, choice);

    if (!await sw.connect()) return alert("Couldnt connect")

    this.myAlgoAddress = sw.accountList()
    console.log("AlgoAddress: " + this.myAlgoAddress)
    let index = localStorage.getItem('walletIndex');
    let finalIndex = +index!;
    localStorage.setItem('wallet', this.myAlgoAddress[finalIndex])
    this.myAlgoName = this.myAlgoAddress.map((value: { name: any; }) => value.name)

    sw.wallet.defaultAccount = finalIndex;
    const finalSw = sw;
    this.sessionWallet = finalSw!;
    localStorage.setItem('sessionWallet', JSON.stringify(this.sessionWallet));
    console.log(this.sessionWallet, 'esaaa');

    localStorage.setItem('reload', 'true');
    if (localStorage.getItem('reload')) {
      location.reload();
      setTimeout(() => {
        localStorage.removeItem('reload');
      }, 300)
    } else {
      return
    }
  }

  connectOnDefault = async (choice: string) => {
    console.log('choice', choice);
    const sw = new SessionWallet("TestNet", undefined, choice);

    if (!await sw.connect()) return alert("Couldnt connect")

    this.myAlgoAddress = sw.accountList()
    console.log("AlgoAddress: " + this.myAlgoAddress)
    let index = localStorage.getItem('walletIndex');
    let finalIndex = +index!;
    localStorage.setItem('wallet', this.myAlgoAddress[finalIndex])
    this.myAlgoName = this.myAlgoAddress.map((value: { name: any; }) => value.name)

    sw.wallet.defaultAccount = finalIndex;
    const finalSw = sw;
    this.sessionWallet = finalSw!;
    localStorage.setItem('sessionWallet', JSON.stringify(this.sessionWallet));
    console.log(this.sessionWallet, 'esaaa');
  }


  disconnect(): void{
    this.sessionWallet!.disconnect()
    this.sessionWallet = undefined;
    //setConnected(false)
    this.myAlgoAddress = []
    localStorage.setItem('reload', 'true');
    if (localStorage.getItem('reload')) {
      location.reload();
      setTimeout(() => {
        localStorage.removeItem('reload');
      }, 300)
    } else {
      return
    }
  }


  payAndSign = async (receiver: string, amount: number) => {
    //const txn = await singlePayTxn(localStorage.getItem('wallet')!, receiver, amount, "Payment for trade setup to opt app into asset");
    const suggestedParams = await getTransactionParams();
    const txn = new Transaction({
      from:localStorage.getItem('wallet')!,
      type:TransactionType.pay,
      to: receiver,
      amount: Number(amount),
      ...suggestedParams
    })
    console.log('txn', txn);

    console.log(this.sessionWallet!.wallet);
    const [s_pay_txn] = await this.sessionWallet!.wallet.signTxn([txn])
    console.log('s_pay_txn', s_pay_txn)

    const {txId} = await client.sendRawTransaction([s_pay_txn.blob]).do()
    console.log(txId)
    const result = await waitForConfirmation(client, txId, 4)
    return result
  }


  connectToWalletConnect = () => {
    try {
      // Create a connector
      const connector = new WalletConnect({
        bridge: "https://bridge.walletconnect.org", // Required
        qrcodeModal: QRCodeModal,
      });

      // Check if connection is already established
      if (!connector.connected) {
        // create new session
        connector.createSession();
      }

      // Subscribe to connection events
      connector.on("connect", (error, payload) => {
        if (error) {
          console.log(error);
          throw error;
        }

        // Get provided accounts
        const { accounts } = payload.params[0];
        console.log(accounts);
      });

      connector.on("session_update", (error, payload) => {
        if (error) {
          console.log(error);
          throw error;
        }

        // Get updated accounts
        const { accounts } = payload.params[0];
        console.log(accounts);
      });

      connector.on("disconnect", (error, payload) => {
        if (error) {
          console.log(error);
          throw error;
        }
      });
    } catch (err) {
      console.error(err);
    }
  }


  connectToMyAlgo = async () => {
    try {
      const accounts = await myAlgoConnect.connect();

      console.log('accounts', accounts);
      this.myAlgoAddress = accounts.map(value => value.address)
      console.log('addresses', this.myAlgoAddress);
      localStorage.setItem('wallet', this.myAlgoAddress[0])
      // @ts-ignore
      this.myAlgoName = accounts.map(value => value.name)

      if (this.myAlgoAddress.length > 0) {
        // paste here
        this.userServce.getUserByWallet(this.myAlgoAddress[0]).subscribe(
          (result: any) => console.log('profile', result),
          (error: any) => {
            console.log('error', error)
            if (error.status == 404) {
              this.userServce.createUser(this.myAlgoAddress[0]).subscribe(
                (result: any) => console.log('profile', result),
                (error: any) => console.log('error', error),
              );
            }
          }
        );
        setTimeout(() => {

        }, 1000)
      }

    } catch (err) {
      console.error(err);
    }
  }


  getOwnAssets = async () => {
    let result = [];

    try {
      const algod = getAlgodClient();
      const algodIndexer = new Indexer(environment.ALGOD_TOKEN, environment.ALGOD_INDEXER_ADDRESS, 8980);

      if (Array.isArray(this.myAlgoAddress) && this.myAlgoAddress.length > 0) {
        const accountInfo = await algod.accountInformation(this.myAlgoAddress[0]).do();
        console.log('accountInfo', accountInfo);

        if (accountInfo.assets && Array.isArray(accountInfo.assets)) {
          console.log('assets:', accountInfo.assets);
          for (let assetInfo of accountInfo.assets) {
            if (assetInfo.amount > 0) {
              const asset = await algod.getAssetByID(assetInfo['asset-id']).do();
              //console.log('asset-id:' + assetInfo['asset-id'], asset);

              result.push(asset);
            }
          }
        }
      }

    } catch (err) {
      console.error(err);
    }

    return result;
  }

  payToSetUpIndex = async (tradeIndex: string, amount: number): Promise<any> => {
    try {
      const txn = await singlePayTxn(localStorage.getItem('wallet')!, tradeIndex, amount, "Payment for trade setup to opt app into asset");
      console.log('txn', txn);
      const signedTxn = await myAlgoConnect.signTransaction(txn.toByte());
      console.log('txId', signedTxn.txID);
      const result = await client.sendRawTransaction(signedTxn.blob).do();
      console.log('paid result', result);
      await waitForTransaction(client, result.txId);

      return result.txId;

    } catch (err) {
      console.error(err);
    }

    return false;
  }

  createTrade = async (params: any): Promise<number> => {
    try {
      console.log(params);
      const suggestedParams = await getTransactionParams();
      let txns = [];
      let tokens = [Number(params.assetID)];

      const client = getAlgodClient();
      const indexTokenID = await getAppLocalStateByKey(client, environment.TRADE_APP_ID, params.tradeIndex, "TK_ID");
      const indexTokenAmount = await getAppLocalStateByKey(client, environment.TRADE_APP_ID, params.tradeIndex, "TA");
      if (indexTokenID !== 0 && indexTokenID > 0 && indexTokenAmount > 0 && indexTokenID != params.assetID) {
        tokens.push(indexTokenID);
      }

      suggestedParams.fee = 2000;
      if (tokens.length > 1) {
        suggestedParams.fee = 3000;
      }

      const tokenTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: this.myAlgoAddress[0],
        to: getApplicationAddress(environment.TRADE_APP_ID),
        amount: Number(params.amount),
        assetIndex: Number(params.assetID),
        note: new Uint8Array(Buffer.from("Amount to place trade")),
        suggestedParams,
      });
      txns.push(tokenTxn);

      suggestedParams.fee = 0;
      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: this.myAlgoAddress[0],
        appIndex: environment.TRADE_APP_ID,
        note: new Uint8Array(Buffer.from("Place trade")),
        appArgs: [new Uint8Array([...Buffer.from("trade")]), algosdk.encodeUint64(Number(params.price))],
        accounts: [params.tradeIndex],
        foreignAssets: tokens,
        suggestedParams,
      });
      txns.push(appCallTxn);

      const txnGroup = algosdk.assignGroupID(txns);
      const signedTxns = await myAlgoConnect.signTransaction(txns.map(txn => txn.toByte()));

      const results = await client.sendRawTransaction(signedTxns.map(txn => txn.blob)).do();
      console.log("Transaction : " + results[1].txId);
      await waitForTransaction(client, results[1].txId);

      return results[1].txId;

    } catch (err) {
      console.error(err);
    }

    return 0;
  }

  createBid = async (params: any): Promise<number> => {
    try {
      const suggestedParams = await getTransactionParams();
      let txns = [];
      let tokens = [params.assetID];

      const client = getAlgodClient();

      const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: this.myAlgoAddress[0],
        to: getApplicationAddress(environment.BID_APP_ID),
        amount: params.price,
        note: new Uint8Array(Buffer.from("Amount to place bid")),
        suggestedParams,
      });
      txns.push(payTxn);

      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: this.myAlgoAddress[0],
        appIndex: environment.BID_APP_ID,
        note: new Uint8Array(Buffer.from("Place bid")),
        appArgs: [new Uint8Array(Buffer.from("bid")), algosdk.encodeUint64(params.amount)],
        accounts: [params.bidIndex],
        foreignAssets: tokens,
        suggestedParams,
      });
      txns.push(appCallTxn);

      const txnGroup = algosdk.assignGroupID(txns);
      const signedTxns = await myAlgoConnect.signTransaction(txns.map(txn => txn.toByte()));

      const results = await client.sendRawTransaction(signedTxns.map(txn => txn.blob)).do();
      console.log("Transaction : " + results[1].txId);
      await waitForTransaction(client, results[1].txId);

      return results[1].txId;

    } catch (err) {
      console.error(err);
    }

    return 0;
  }

  createSwap = async (params: any) => {
    try {
      const suggestedParams = await getTransactionParams();
      let txns = [];

      const tokenTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: this.myAlgoAddress[0],
        to: getApplicationAddress(environment.BID_APP_ID),
        amount: params.amount,
        assetIndex: params.assetID,
        note: new Uint8Array(Buffer.from("Amount to place swap")),
        suggestedParams: { ...suggestedParams },
      });
      txns.push(tokenTxn);

      const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
        from: this.myAlgoAddress[0],
        appIndex: environment.BID_APP_ID,
        note: new Uint8Array(Buffer.from("Place swap")),
        appArgs: [new Uint8Array(Buffer.from("swap")), algosdk.encodeUint64(params.acceptAssetAmount)],
        accounts: [params.swapIndex],
        suggestedParams: { ...suggestedParams },
      });
      txns.push(appCallTxn);

      const txnGroup = algosdk.assignGroupID(txns);
      const signedTxns = await myAlgoConnect.signTransaction(txns.map(txn => txn.toByte()));

      const results = await client.sendRawTransaction(signedTxns.map(txn => txn.blob)).do();
      console.log("Transaction : " + results[1].txId);
      await waitForTransaction(client, results[1].txId);

      return results[1].txId;

    } catch (err) {
      console.error(err);
    }

    return 0;
  }

  createAuction = async (params: any) => {
    let result = [];

    try {
      const algod = getAlgodClient();
      const algodIndexer = new Indexer(environment.ALGOD_TOKEN, environment.ALGOD_INDEXER_ADDRESS, 8980);

      if (Array.isArray(this.myAlgoAddress) && this.myAlgoAddress.length > 0) {
        const accountInfo = await algod.accountInformation(this.myAlgoAddress[0]).do();
        console.log('accountInfo', accountInfo);

        if (accountInfo.assets && Array.isArray(accountInfo.assets)) {
          for (let assetInfo of accountInfo.assets) {
            const asset = await algod.getAssetByID(assetInfo['asset-id']).do();
            console.log('asset-id:' + assetInfo['asset-id'], asset);
            result.push(asset);
          }
        }

        // const accountInfo = algodIndexer.lookupAccountByID(this.myAlgoAddress[0]);
        // console.log('accountInfo', accountInfo);
        // const accounts = await algodIndexer.searchAccounts().do();
        // console.log('accounts', accounts);
        // const assets = await algodIndexer.searchForAssets().do();
        // console.log('assets', assets);
      }

    } catch (err) {
      console.error(err);
    }

    return result;
  }

}


