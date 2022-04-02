import {Injectable} from "@angular/core";
import algosdk from "algosdk";
import MyAlgoConnect from '@randlabs/myalgo-connect';

const algodClient = new algosdk.Algodv2(“”, 'https://api.testnet.algoexplorer.io', '');
const myAlgoConnect = new MyAlgoConnect();
const accountsSharedByUser = await myAlgoConnect.connect()
const algodClient = new algosdk.Algodv2("",'https://api.testnet.algoexplorer.io', '');
const params = await algodClient.getTransactionParams().do();

const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
  suggestedParams: {
    ...params,
  },
  from: sender,
  to: receiver,
  amount: amount
  note: note
});

const signedTxn = await myAlgoConnect.signTransaction(txn.toByte())
const response = await algodClient.sendRawTransaction(signedTxn.blob).do();

@Injectable({
  providedIn: 'root'
})

export class ConnectAlgoService {

}
