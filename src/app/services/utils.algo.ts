import {environment} from "../../environments/environment";
import algosdk, {Algodv2, ALGORAND_MIN_TX_FEE} from "algosdk";
import AlgodClient from "algosdk/dist/types/src/client/v2/algod/algod";
import * as sha512 from 'js-sha512';
import * as hibase32 from 'hi-base32';

const ALGORAND_ADDRESS_SIZE = 58;
export enum AssetTransactionType {
  Transfer = "asset-transfer",
  OptIn = "asset-opt-in",
  Close = "asset-close",
}

export interface IAlgoTxn {
  txn: algosdk.Transaction;
  signers?: string[];
  authAddr?: string;
  message?: string;
}
export type AlgoTxnReturnType = IAlgoTxn[][];

export const getAlgodClient = () => {
  const tokenHeader = {
    "x-api-key": environment.ALGOD_TOKEN
  };

  return new Algodv2(tokenHeader, environment.ALGOD_URL, 443);
}

export const getTransactionParams = async () => {
  const algod = getAlgodClient();
  const params = await algod.getTransactionParams().do();
  params.fee = ALGORAND_MIN_TX_FEE;
  params.flatFee = true;

  console.log(params);
  return params;
}

export async function submitTransactions(
  client: Algodv2,
  stxns: Uint8Array[],
): Promise<number> {
  const { txId } = await client
    .sendRawTransaction(stxns)
    .do();
  return await waitForTransaction(client, txId);
}

export async function waitForTransaction(
  client: Algodv2,
  txId: string
): Promise<number> {
  let lastStatus = await client.status().do();
  let lastRound = lastStatus["last-round"];
  while (true) {
    const status = await client.pendingTransactionInformation(txId).do();
    if (status["pool-error"]) {
      throw new Error(`Transaction Pool Error: ${status["pool-error"]}`);
    }
    if (status["confirmed-round"]) {
      return status["confirmed-round"];
    }
    lastStatus = await client.statusAfterBlock(lastRound + 1).do();
    lastRound = lastStatus["last-round"];
  }
}

export const singlePayTxn = async (
  from: string,
  to: string,
  amount: number,
  note: string
): Promise<any> => {
  const suggestedParams = await getTransactionParams();
  const enc = new TextEncoder();
  return algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from,
    to,
    amount,
    note: enc.encode(note),
    suggestedParams: {
      ...suggestedParams
    }
  });
};

export const singlePayTxnWithClose = async (
  from: string,
  to: string,
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  console.log('suggestedParams', suggestedParams);

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: from,
    to: to,
    amount: Number(100000),
    note: new Uint8Array([...Buffer.from("example note value")]),
    closeRemainderTo: to,
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singlePayTxnWithRekey = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100000,
    note: new Uint8Array(Buffer.from("example note value")),
    rekeyTo: to,
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singlePayTxnWithRekeyAndClose = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100000,
    note: new Uint8Array(Buffer.from("example note value")),
    rekeyTo: to,
    closeRemainderTo: to,
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singlePayTxnWithInvalidAuthAddress = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100000,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txnsToSign = [
    { txn, message: "This is a transaction message", authAddr: "INVALID_ADDRESS" },
  ];
  return [txnsToSign];
};

export const singleAssetOptInTxn = async (
  address: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singleAssetOptInTxnToInvalidAsset = async (
  address: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singleAssetTransferTxn = async (
  from: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: from,
    to: to,
    amount: 1000000,
    assetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singleAssetTransferTxnWithClose = async (
  from: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: from,
    to: to,
    amount: 1000000,
    assetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    closeRemainderTo: to,
    suggestedParams,
  });

  const txnsToSign = [{ txn, message: "This is a transaction message" }];
  return [txnsToSign];
};

export const singleInvalidAssetTransferTxn = async (
  from: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const assetIndex = 100; // Invalid asset id

  const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: from,
    to: to,
    amount: 1000000,
    assetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singleAppOptIn = async (
  address: string,
  appIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeApplicationOptInTxnFromObject({
    from: address,
    appIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    appArgs: [Uint8Array.from([0]), Uint8Array.from([0, 1])],
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singleAppCall = async (
  address: string,
  appIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeApplicationNoOpTxnFromObject({
    from: address,
    appIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    appArgs: [new Uint8Array([...Buffer.from("trade")]), algosdk.encodeUint64(8)],
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singleAppCallNoArgs = async (
  address: string,
  appIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeApplicationNoOpTxnFromObject({
    from: address,
    appIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    appArgs: [],
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singleAppCallWithRekey = async (
  address: string,
  rekeyTo: string,
  appIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeApplicationNoOpTxnFromObject({
    from: address,
    appIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    appArgs: [Uint8Array.from([0]), Uint8Array.from([0, 1])],
    rekeyTo: rekeyTo,
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singleAppCloseOut = async (
  address: string,
  appIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeApplicationCloseOutTxnFromObject({
    from: address,
    appIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    appArgs: [Uint8Array.from([0]), Uint8Array.from([0, 1])],
    suggestedParams,
  });

  const txnsToSign = [{ txn, message: "This is a transaction message" }];
  return [txnsToSign];
};

export const singleAppClearState = async (
  address: string,
  appIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeApplicationClearStateTxnFromObject({
    from: address,
    appIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    appArgs: [Uint8Array.from([0]), Uint8Array.from([0, 1])],
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singleAppCreate = async (
  address: string,
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const approvalProgram = Uint8Array.from([4, 129, 1, 67]);
  const clearProgram = Uint8Array.from([3, 129, 1, 67]);

  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: address,
    approvalProgram,
    clearProgram,
    numGlobalInts: 1,
    numGlobalByteSlices: 2,
    numLocalInts: 3,
    numLocalByteSlices: 4,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    note: new Uint8Array(Buffer.from("example note value")),
    appArgs: [Uint8Array.from([0]), Uint8Array.from([0, 1])],
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singleAppCreateExtraPage = async (
  address: string,
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const approvalProgram = Uint8Array.from([4, 129, 1, 67]);
  const clearProgram = Uint8Array.from([3, 129, 1, 67]);

  const txn = algosdk.makeApplicationCreateTxnFromObject({
    from: address,
    approvalProgram,
    clearProgram,
    numGlobalInts: 1,
    numGlobalByteSlices: 2,
    numLocalInts: 3,
    numLocalByteSlices: 4,
    extraPages: 1,
    onComplete: algosdk.OnApplicationComplete.NoOpOC,
    note: new Uint8Array(Buffer.from("example note value")),
    appArgs: [Uint8Array.from([0]), Uint8Array.from([0, 1])],
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singleAppUpdate = async (
  address: string,
  appIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const approvalProgram = Uint8Array.from([4, 129, 1, 67]);
  const clearProgram = Uint8Array.from([3, 129, 1, 67]);

  const txn = algosdk.makeApplicationUpdateTxnFromObject({
    from: address,
    appIndex,
    approvalProgram,
    clearProgram,
    note: new Uint8Array(Buffer.from("example note value")),
    appArgs: [Uint8Array.from([0]), Uint8Array.from([0, 1])],
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const singleAppDelete = async (
  address: string,
  appIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeApplicationDeleteTxnFromObject({
    from: address,
    appIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    appArgs: [Uint8Array.from([0]), Uint8Array.from([0, 1])],
    suggestedParams,
  });

  const txnsToSign = [{ txn }];
  return [txnsToSign];
};

export const sign1FromGroupTxn = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const transferAssetIndex = assetIndex;
  const optInAssetIndex = assetIndex;

  const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex: optInAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 1000000,
    assetIndex: transferAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txnsToSign = [{ txn: txn1 }, { txn: txn2, signers: [] }];

  algosdk.assignGroupID(txnsToSign.map(toSign => toSign.txn));

  return [txnsToSign];
};

export const sign2FromGroupTxn = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const transferAssetIndex = assetIndex;
  const optInAssetIndex = assetIndex;

  const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex: optInAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 1000000,
    assetIndex: transferAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn3 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 500000,
    note: new Uint8Array(Buffer.from("this is a payment txn")),
    suggestedParams,
  });

  const txnsToSign = [
    { txn: txn1 },
    { txn: txn2, signers: [] },
    { txn: txn3, message: "This is a transaction message" },
  ];

  algosdk.assignGroupID(txnsToSign.map(toSign => toSign.txn));

  return [txnsToSign];
};

export const signGroupWithPayOptinTransfer = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const transferAssetIndex = assetIndex;
  const optInAssetIndex = assetIndex;

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 500000,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex: optInAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn3 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 1000000,
    assetIndex: transferAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txnsToSign = [{ txn: txn1 }, { txn: txn2 }, { txn: txn3 }];

  algosdk.assignGroupID(txnsToSign.map(toSign => toSign.txn));

  return [txnsToSign];
};

export const signGroupWithPayRekey = async (
  address: string,
  to: string,
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 500000,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 500000,
    note: new Uint8Array(Buffer.from("example note value")),
    rekeyTo: to,
    suggestedParams,
  });

  const txnsToSign = [{ txn: txn1 }, { txn: txn2, message: "This is a transaction message" }];

  algosdk.assignGroupID(txnsToSign.map(toSign => toSign.txn));

  return [txnsToSign];
};

export const signTxnWithAssetClose = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const closeAssetIndex = assetIndex;

  const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 50,
    assetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 50,
    assetIndex: closeAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    closeRemainderTo: to,
    suggestedParams,
  });

  const txnsToSign = [{ txn: txn1 }, { txn: txn2 }];

  algosdk.assignGroupID(txnsToSign.map(toSign => toSign.txn));

  return [txnsToSign];
};

export const signTxnWithRekey = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 50,
    assetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 50,
    assetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    rekeyTo: to,
    suggestedParams,
  });

  const txnsToSign = [{ txn: txn1, message: "This is a transaction message" }, { txn: txn2 }];

  algosdk.assignGroupID(txnsToSign.map(toSign => toSign.txn));

  return [txnsToSign];
};

export const signTxnWithRekeyAndAssetClose = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const closeAssetIndex = assetIndex;

  const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    assetIndex,
    amount: 10,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 20,
    assetIndex: closeAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    closeRemainderTo: to,
    suggestedParams,
  });

  const txn3 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 30,
    assetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    rekeyTo: to,
    suggestedParams,
  });

  const txn4 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 40,
    assetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    closeRemainderTo: to,
    rekeyTo: to,
    suggestedParams,
  });

  const txnsToSign = [
    { txn: txn1, message: "This is a transaction message" },
    { txn: txn2 },
    { txn: txn3 },
    { txn: txn4, message: "This is a transaction message" },
  ];

  algosdk.assignGroupID(txnsToSign.map(toSign => toSign.txn));

  return [txnsToSign];
};

export const signGroupOf7 = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const transferAssetIndex = assetIndex;
  const optInAssetIndex = assetIndex;
  const closeAssetIndex = assetIndex;

  const optIn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex: optInAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const assetXfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 50,
    assetIndex: transferAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const assetClose = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 50,
    assetIndex: closeAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    closeRemainderTo: to,
    suggestedParams,
  });

  const payment = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 500000,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const accountClose = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 0,
    note: new Uint8Array(Buffer.from("example note value")),
    closeRemainderTo: to,
    suggestedParams,
  });

  const accountRekey = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 1000,
    note: new Uint8Array(Buffer.from("example note value")),
    rekeyTo: to,
    suggestedParams,
  });

  const accountRekeyAndClose = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 50000,
    note: new Uint8Array(Buffer.from("example note value")),
    closeRemainderTo: to,
    rekeyTo: to,
    suggestedParams,
  });

  const txnsToSign = [
    { txn: optIn },
    { txn: assetXfer },
    { txn: assetClose },
    { txn: payment },
    { txn: accountClose },
    { txn: accountRekey },
    { txn: accountRekeyAndClose },
  ];

  algosdk.assignGroupID(txnsToSign.map(toSign => toSign.txn));

  return [txnsToSign];
};

export const fullTxnGroup = async (
  address: string,
  to: string,
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txnsToSign: Array<{ txn: algosdk.Transaction; signers?: [string] }> = [];

  for (let i = 0; i < 8; i++) {
    const assetIndex = 100 + i;

    const optIn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: address,
      to: address,
      amount: 0,
      assetIndex,
      note: new Uint8Array(Buffer.from("example note value")),
      suggestedParams,
    });

    const closeOut = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: address,
      to: address,
      amount: 0,
      assetIndex,
      note: new Uint8Array(Buffer.from("example note value")),
      closeRemainderTo: to,
      suggestedParams,
    });

    txnsToSign.push({ txn: optIn });
    txnsToSign.push({ txn: closeOut });
  }

  algosdk.assignGroupID(txnsToSign.map(toSign => toSign.txn));

  return [txnsToSign];
};

export const multipleNonAtomicTxns = async (
  address: string,
  to: string,
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100001,
    note: new Uint8Array(Buffer.from("txn 1")),
    suggestedParams,
  });

  const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100002,
    note: new Uint8Array(Buffer.from("txn 2")),
    suggestedParams,
  });

  const txn3 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100003,
    note: new Uint8Array(Buffer.from("txn 3")),
    suggestedParams,
  });

  const group1 = [{ txn: txn1 }];

  const group2 = [{ txn: txn2, message: "This is a transaction message" }];

  const group3 = [{ txn: txn3 }];

  return [group1, group2, group3];
};

export const multipleNonAtomicTxnsForOnlyAssets = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const optInAssetIndex = assetIndex;
  const transferAssetIndex = assetIndex;

  const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex: optInAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 10000,
    assetIndex: transferAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn3 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 30000,
    assetIndex: transferAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const group1 = [{ txn: txn1 }];

  const group2 = [{ txn: txn2 }];

  const group3 = [{ txn: txn3, message: "This is a transaction message" }];

  return [group1, group2, group3];
};

export const multipleNonAtomicTxnsMixed = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const optInAssetIndex = assetIndex;
  const transferAssetIndex = assetIndex;

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100001,
    note: new Uint8Array(Buffer.from("txn 1")),
    suggestedParams,
  });

  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex: optInAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn3 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 10000,
    assetIndex: transferAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const group1 = [{ txn: txn1 }];

  const group2 = [{ txn: txn2 }];

  const group3 = [{ txn: txn3 }];

  return [group1, group2, group3];
};

export const atomicGroupAndNonAtomicTxnsForOnlyPayment = async (
  address: string,
  to: string,
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100001,
    note: new Uint8Array(Buffer.from("atomic group 1 txn 1")),
    suggestedParams,
  });

  const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100002,
    note: new Uint8Array(Buffer.from("atomic group 2 txn 2")),
    suggestedParams,
  });

  const txn3 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100003,
    note: new Uint8Array(Buffer.from("txn 3")),
    suggestedParams,
  });

  const txn4 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100004,
    note: new Uint8Array(Buffer.from("txn 4")),
    suggestedParams,
  });

  const group1 = [
    { txn: txn1, message: "This is a transaction message" },
    { txn: txn2, message: "This is a transaction message" },
  ];
  algosdk.assignGroupID(group1.map(toSign => toSign.txn));

  const group2 = [{ txn: txn3 }];

  const group3 = [{ txn: txn4 }];

  return [group1, group2, group3];
};

export const atomicGroupAndNonAtomicTxnsMixed = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const optInAssetIndex = assetIndex;
  const transferAssetIndex = assetIndex;

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100001,
    note: new Uint8Array(Buffer.from("atomic group 1 txn 1")),
    suggestedParams,
  });

  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex: optInAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn3 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 10000,
    assetIndex: transferAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn4 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100004,
    note: new Uint8Array(Buffer.from("txn 4")),
    suggestedParams,
  });

  const group1 = [{ txn: txn1 }, { txn: txn2 }];
  algosdk.assignGroupID(group1.map(toSign => toSign.txn));

  const group2 = [{ txn: txn3, message: "This is a transaction message" }];

  const group3 = [{ txn: txn4 }];

  return [group1, group2, group3];
};

export const multipleAtomicGroupsForOnlyPayment = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100001,
    note: new Uint8Array(Buffer.from("atomic group 1 txn 1")),
    suggestedParams,
  });

  const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100002,
    note: new Uint8Array(Buffer.from("atomic group 1 txn 2")),
    suggestedParams,
  });

  const txn3 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100003,
    note: new Uint8Array(Buffer.from("atomic group 2 txn 1")),
    suggestedParams,
  });

  const txn4 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100004,
    note: new Uint8Array(Buffer.from("atomic group 2 txn 2")),
    suggestedParams,
  });

  const group1 = [{ txn: txn1 }, { txn: txn2 }];
  algosdk.assignGroupID(group1.map(toSign => toSign.txn));

  const group2 = [{ txn: txn3 }, { txn: txn4 }];
  algosdk.assignGroupID(group2.map(toSign => toSign.txn));

  return [group1, group2];
};

export const multipleAtomicGroupsForOnlyAssets = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const optInAssetIndex = assetIndex;
  const transferAssetIndex = assetIndex;

  const txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex: optInAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 10000,
    assetIndex: transferAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn3 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex: optInAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn4 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 2000,
    assetIndex: transferAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const group1 = [{ txn: txn1 }, { txn: txn2, signers: [] }];
  algosdk.assignGroupID(group1.map(toSign => toSign.txn));

  const group2 = [{ txn: txn3 }, { txn: txn4, signers: [] }];
  algosdk.assignGroupID(group2.map(toSign => toSign.txn));

  return [group1, group2];
};

export const multipleAtomicGroupsWithInvalidAsset = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const invalidAssetIndex = 100;

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100001,
    note: new Uint8Array(Buffer.from("atomic group 1 txn 1")),
    suggestedParams,
  });

  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 2000,
    assetIndex: invalidAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });
  const txn3 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100003,
    note: new Uint8Array(Buffer.from("atomic group 2 txn 1")),
    suggestedParams,
  });

  const txn4 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100004,
    note: new Uint8Array(Buffer.from("atomic group 2 txn 2")),
    suggestedParams,
  });

  const group1 = [{ txn: txn1 }, { txn: txn2 }];
  algosdk.assignGroupID(group1.map(toSign => toSign.txn));

  const group2 = [{ txn: txn3 }, { txn: txn4 }];
  algosdk.assignGroupID(group2.map(toSign => toSign.txn));

  return [group1, group2];
};

export const multipleAtomicGroupsMixed1 = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const optInAssetIndex = assetIndex;
  const transferAssetIndex = assetIndex;

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100001,
    note: new Uint8Array(Buffer.from("atomic group 1 txn 1")),
    suggestedParams,
  });

  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 10000,
    assetIndex: transferAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn3 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex: optInAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn4 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100004,
    note: new Uint8Array(Buffer.from("atomic group 2 txn 2")),
    suggestedParams,
  });

  const group1 = [{ txn: txn1 }, { txn: txn2, signers: [] }];
  algosdk.assignGroupID(group1.map(toSign => toSign.txn));

  const group2 = [{ txn: txn3 }, { txn: txn4 }];
  algosdk.assignGroupID(group2.map(toSign => toSign.txn));

  return [group1, group2];
};

export const multipleAtomicGroupsMixed2 = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();
  const optInAssetIndex = assetIndex;
  const transferAssetIndex = assetIndex;

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100001,
    note: new Uint8Array(Buffer.from("atomic group 1 txn 1")),
    suggestedParams,
  });

  const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100002,
    note: new Uint8Array(Buffer.from("atomic group 1 txn 2")),
    suggestedParams,
  });

  const txn3 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 2000,
    assetIndex: transferAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txn4 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: address,
    to: address,
    amount: 0,
    assetIndex: optInAssetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const group1 = [{ txn: txn1 }, { txn: txn2 }];
  algosdk.assignGroupID(group1.map(toSign => toSign.txn));

  const group2 = [{ txn: txn3, signers: [] }, { txn: txn4 }];
  algosdk.assignGroupID(group2.map(toSign => toSign.txn));

  return [group1, group2];
};

export const multipleAtomicGroupSignOnly2 = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 100001,
    note: new Uint8Array(Buffer.from("atomic group 1 txn 1")),
    suggestedParams,
  });

  const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100002,
    note: new Uint8Array(Buffer.from("atomic group 2 txn 2")),
    suggestedParams,
  });

  const txn3 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 100003,
    note: new Uint8Array(Buffer.from("txn 3")),
    suggestedParams,
  });

  const txn4 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100004,
    note: new Uint8Array(Buffer.from("txn 4")),
    suggestedParams,
  });

  const group1 = [{ txn: txn1, signers: [] }, { txn: txn2 }];
  algosdk.assignGroupID(group1.map(toSign => toSign.txn));

  const group2 = [{ txn: txn3, signers: [] }, { txn: txn4 }];
  algosdk.assignGroupID(group2.map(toSign => toSign.txn));

  return [group1, group2];
};

export const atomicGroupAndNonAtomicTxnsSignOnly2 = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 100001,
    note: new Uint8Array(Buffer.from("atomic group 1 txn 1")),
    suggestedParams,
  });

  const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100002,
    note: new Uint8Array(Buffer.from("atomic group 2 txn 2")),
    suggestedParams,
  });

  const txn3 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100003,
    note: new Uint8Array(Buffer.from("txn 3")),
    suggestedParams,
  });

  const group1 = [{ txn: txn1, signers: [] }, { txn: txn2 }];
  algosdk.assignGroupID(group1.map(toSign => toSign.txn));

  const group2 = [{ txn: txn3 }];

  return [group1, group2];
};

export const atomicNoSignTxn = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 100001,
    note: new Uint8Array(Buffer.from("txn 1")),
    suggestedParams,
  });

  const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 100002,
    note: new Uint8Array(Buffer.from("txn 2")),
    suggestedParams,
  });

  const txn3 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 100003,
    note: new Uint8Array(Buffer.from("txn 3")),
    suggestedParams,
  });

  const group1 = [
    { txn: txn1, signers: [] },
    { txn: txn2, signers: [] },
    { txn: txn3, signers: [] },
  ];
  algosdk.assignGroupID(group1.map(toSign => toSign.txn));

  return [group1];
};

export const atomicAndSingleNoSignTxn = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100001,
    note: new Uint8Array(Buffer.from("txn 1")),
    suggestedParams,
  });

  const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100002,
    note: new Uint8Array(Buffer.from("txn 2")),
    suggestedParams,
  });

  const txn3 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 100003,
    note: new Uint8Array(Buffer.from("txn 3")),
    suggestedParams,
  });

  const group1 = [{ txn: txn1 }];

  const group2 = [{ txn: txn2, message: "This is a transaction message" }];

  const group3 = [{ txn: txn3, signers: [] }];

  return [group1, group2, group3];
};

export const txnWithLargeNote = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100000,
    note: new Uint8Array(Buffer.from("max length note (512)" + "!".repeat(491))),
    suggestedParams,
  });

  const txnsToSign = [{ txn, message: "This is a transaction message" }];
  return [txnsToSign];
};

export const assetCreateTxnMaxInfoAndRekey = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: address,
    decimals: 2,
    defaultFrozen: false,
    total: BigInt("0xffffffffffffffff"),
    assetName: "Example asset",
    unitName: "EX",
    assetURL: "https://example.com",
    assetMetadataHash: new Uint8Array(
      Buffer.from("59fc007607ccc82d96f016857aaa697c545002d18045e49324696f12b7be8f45", "hex"),
    ),
    manager: address,
    reserve: to,
    clawback: to,
    freeze: to,
    note: new Uint8Array(Buffer.from("example note value")),
    rekeyTo: to,
    suggestedParams,
  });

  const txnsToSign = [{ txn, message: "This is a transaction message" }];
  return [txnsToSign];
};

export const assetCreateTxnMinInfo = async (
  address: string,
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: address,
    decimals: 0,
    defaultFrozen: false,
    total: 1,
    suggestedParams,
  });

  const txnsToSign = [{ txn, message: "This is a transaction message" }];
  return [txnsToSign];
};

export const assetReconfigTxnResetAll = async (
  address: string,
  to: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
    from: address,
    assetIndex,
    clawback: address,
    freeze: to,
    manager: to,
    reserve: to,
    strictEmptyAddressChecking: true,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txnsToSign = [{ txn, message: "This is a transaction message" }];
  return [txnsToSign];
};

export const assetReconfigTxnClearAll = async (
  address: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
    from: address,
    assetIndex,
    strictEmptyAddressChecking: false,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txnsToSign = [{ txn, message: "This is a transaction message" }];
  return [txnsToSign];
};

export const assetDeleteTxn = async (
  address: string,
  assetIndex: number
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn = algosdk.makeAssetDestroyTxnWithSuggestedParamsFromObject({
    from: address,
    assetIndex,
    note: new Uint8Array(Buffer.from("example note value")),
    suggestedParams,
  });

  const txnsToSign = [{ txn, message: "This is a transaction message" }];
  return [txnsToSign];
};

export const zeroFeeTxnGroup = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const txn1 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: to,
    to: address,
    amount: 100001,
    note: new Uint8Array(Buffer.from("txn with 0 fee")),
    suggestedParams,
  });

  const txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: to,
    amount: 100001,
    note: new Uint8Array(Buffer.from("txn with double fee")),
    suggestedParams,
  });

  txn2.fee += txn1.fee;
  txn1.fee = 0;

  const group1 = [{ txn: txn1, signers: [] }, { txn: txn2 }];
  algosdk.assignGroupID(group1.map(toSign => toSign.txn));

  return [group1];
};

export const maxNumberOfTxns = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const groups: Array<Array<{ txn: algosdk.Transaction }>> = [];

  const numGroups = 4; // 64 / 16
  for (let i = 0; i < numGroups; i++) {
    const group: Array<{ txn: algosdk.Transaction }> = [];
    for (let j = 0; j < 16; j++) {
      group.push({
        txn: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from: address,
          to: to,
          amount: 0,
          note: new Uint8Array(Buffer.from(`No ${i * 16 + j + 1} of 64`)),
          suggestedParams,
        }),
      });
    }

    algosdk.assignGroupID(group.map(toSign => toSign.txn));
    groups.push(group);
  }

  return groups;
};

export const tooManyTxns = async (
  address: string,
  to: string
): Promise<AlgoTxnReturnType> => {
  const suggestedParams = await getTransactionParams();

  const groups: Array<Array<{ txn: algosdk.Transaction }>> = [];

  const numGroups = 4; // 64 / 16
  for (let i = 0; i < numGroups; i++) {
    const group: Array<{ txn: algosdk.Transaction }> = [];
    for (let j = 0; j < 16; j++) {
      group.push({
        txn: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from: address,
          to: to,
          amount: 0,
          note: new Uint8Array(Buffer.from(`No ${i * 16 + j + 1} of 65`)),
          suggestedParams,
        }),
      });
    }

    algosdk.assignGroupID(group.map(toSign => toSign.txn));
    groups.push(group);
  }

  // one more!
  groups.push([
    {
      txn: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: address,
        to: to,
        amount: 0,
        note: new Uint8Array(Buffer.from(`No 65 of 65`)),
        suggestedParams,
      }),
    },
  ]);

  return groups;
};

export const scenarios: Array<{ name: string; scenario: any }> = [
  {
    name: "1. Sign single pay txn",
    scenario: singlePayTxn,
  },
  {
    name: "2. Sign single pay txn with close",
    scenario: singlePayTxnWithClose,
  },
  {
    name: "3. Sign single pay txn with rekey",
    scenario: singlePayTxnWithRekey,
  },
  {
    name: "4. Sign single pay txn with rekey and close",
    scenario: singlePayTxnWithRekeyAndClose,
  },
  {
    name: "5. Single pay txn with invalid auth address",
    scenario: singlePayTxnWithInvalidAuthAddress,
  },
  {
    name: "6. Sign single asset opt-in txn",
    scenario: singleAssetOptInTxn,
  },
  {
    name: "7. Sign single asset opt-in txn with invalid asset id",
    scenario: singleAssetOptInTxnToInvalidAsset,
  },
  {
    name: "8. Sign single asset transfer txn",
    scenario: singleAssetTransferTxn,
  },
  {
    name: "9. Sign single asset transfer txn with close",
    scenario: singleAssetTransferTxnWithClose,
  },
  {
    name: "10. Sign single asset transfer txn with invalid asset id",
    scenario: singleInvalidAssetTransferTxn,
  },
  {
    name: "11. Sign single app opt-in txn",
    scenario: singleAppOptIn,
  },
  {
    name: "12. Sign single app call txn",
    scenario: singleAppCall,
  },
  {
    name: "13. Sign single app call txn with rekey",
    scenario: singleAppCallWithRekey,
  },
  {
    name: "14. Sign single app close out txn",
    scenario: singleAppCloseOut,
  },
  {
    name: "15. Sign 1 of 2 txns from a group",
    scenario: sign1FromGroupTxn,
  },
  {
    name: "16. Sign 2 of 3 txns from a group",
    scenario: sign2FromGroupTxn,
  },
  {
    name: "17. Sign txn group with pay, asset opt-in, and asset transfer",
    scenario: signGroupWithPayOptinTransfer,
  },
  {
    name: "18. Sign txn group with pay and rekey",
    scenario: signGroupWithPayRekey,
  },
  {
    name: "19. Sign txn group with asset close",
    scenario: signTxnWithAssetClose,
  },
  {
    name: "20. Sign txn group with rekey",
    scenario: signTxnWithRekey,
  },
  {
    name: "21. Sign txn group with rekey and asset close",
    scenario: signTxnWithRekeyAndAssetClose,
  },
  {
    name: "22. Sign group of 7",
    scenario: signGroupOf7,
  },
  {
    name: "23. Full txn group",
    scenario: fullTxnGroup,
  },
  {
    name: "24. Sign multiple non-atomic txns",
    scenario: multipleNonAtomicTxns,
  },
  {
    name: "25. Sign multiple non-atomic txns for only assets",
    scenario: multipleNonAtomicTxnsForOnlyAssets,
  },
  {
    name: "26. Sign mixed multiple non-atomic txns",
    scenario: multipleNonAtomicTxnsMixed,
  },
  {
    name: "27. Sign atomic txn group and non-atomic txns for only payment",
    scenario: atomicGroupAndNonAtomicTxnsForOnlyPayment,
  },
  {
    name: "28. Sign mixed atomic txn group and non-atomic txns",
    scenario: atomicGroupAndNonAtomicTxnsMixed,
  },
  {
    name: "29. Sign multiple atomic txn groups for only payment",
    scenario: multipleAtomicGroupsForOnlyPayment,
  },
  {
    name: "30. Sign multiple atomic txn groups for only assets",
    scenario: multipleAtomicGroupsForOnlyAssets,
  },
  {
    name: "31. Sign multiple atomic txn groups with invalid asset",
    scenario: multipleAtomicGroupsWithInvalidAsset,
  },
  {
    name: "32. Sign first mixed 2 atomic txn groups",
    scenario: multipleAtomicGroupsMixed1,
  },
  {
    name: "33. Sign second mixed 2 atomic txn groups",
    scenario: multipleAtomicGroupsMixed2,
  },
  {
    name: "34. Sign only 2 txns in multiple atomic txn groups",
    scenario: multipleAtomicGroupSignOnly2,
  },
  {
    name: "35. Sign only 2 txns in atomic txn group and non-atomic txns",
    scenario: atomicGroupAndNonAtomicTxnsSignOnly2,
  },
  {
    name: "36. Atomic group with no sig needed (invalid)",
    scenario: atomicNoSignTxn,
  },
  {
    name: "37. Atomic group and single txn with no sig needed (invalid)",
    scenario: atomicAndSingleNoSignTxn,
  },
  {
    name: "38. Txn with large note",
    scenario: txnWithLargeNote,
  },
  {
    name: "39. Sign single app clear state txn",
    scenario: singleAppClearState,
  },
  {
    name: "40. Sign single app create txn",
    scenario: singleAppCreate,
  },
  {
    name: "41. Sign single app update txn",
    scenario: singleAppUpdate,
  },
  {
    name: "42. Sign single app delete txn",
    scenario: singleAppDelete,
  },
  {
    name: "43. Sign single app call with no args",
    scenario: singleAppCallNoArgs,
  },
  {
    name: "44. Sign single app create txn with extra page (not working with ledger app v1.2.15)",
    scenario: singleAppCreateExtraPage,
  },
  {
    name: "45. Sign asset create + rekey txn",
    scenario: assetCreateTxnMaxInfoAndRekey,
  },
  {
    name: "46. Sign asset create txn with minimal info",
    scenario: assetCreateTxnMinInfo,
  },
  {
    name: "47. Sign asset reconfig txn",
    scenario: assetReconfigTxnResetAll,
  },
  {
    name: "48. Sign asset reconfig txn clear all",
    scenario: assetReconfigTxnClearAll,
  },
  {
    name: "49. Sign asset delete txn",
    scenario: assetDeleteTxn,
  },
  {
    name: "50. Sign txn group with 0 fee",
    scenario: zeroFeeTxnGroup,
  },
  {
    name: "51. Sign 64 transactions",
    scenario: maxNumberOfTxns,
  },
  {
    name: "52. Sign 65 transactions",
    scenario: tooManyTxns,
  },
];

function addressFromByteBuffer(addr: string) {
  const bytes = Buffer.from(addr, "base64");

  //compute checksum
  const checksum = sha512.sha512_256.array(bytes).slice(28, 32);

  const c = new Uint8Array(bytes.length + checksum.length);
  c.set(bytes);
  c.set(checksum, bytes.length);

  const v = hibase32.encode(c);

  return v.toString().slice(0, ALGORAND_ADDRESS_SIZE);
}

export const appValueState = (stateValue: any): any => {
  let text = "";

  if (stateValue.type == 1) {
    let addr = addressFromByteBuffer(stateValue.bytes);
    if (addr.length == ALGORAND_ADDRESS_SIZE) {
      text += addr;
    } else {
      text += stateValue.bytes;
    }
  } else if (stateValue.type == 2) {
    text = stateValue.uint;
  } else {
    text += stateValue.bytes;
  }

  return text;
}

export const getAppLocalStateByKey = async (algodClient: AlgodClient, appId: number, accountAddr: string, key: string): Promise<any> => {
  const accountInfoResponse = await algodClient
    .accountInformation(accountAddr)
    .do();

  for (let i = 0; i < accountInfoResponse["apps-local-state"].length; i++) {
    if (accountInfoResponse["apps-local-state"][i].id === appId) {
      const stateArray =
        accountInfoResponse["apps-local-state"][i]["key-value"];

      if (!stateArray) {
        return null;
      }
      for (let j = 0; j < stateArray.length; j++) {
        const text = Buffer.from(stateArray[j].key, "base64").toString();

        if (key === text) {
          return appValueState(stateArray[j].value);
        }
      }
      // not found assume 0
      return 0;
    }
  }
}

export const isOptinAsset = async (assetIndex: number, address: string) => {
  try {
    const algod = getAlgodClient();
    const accountInfo = await algod.accountInformation(address).do();
    console.log('accountInfo - ' + address, accountInfo);

    if (accountInfo.assets && Array.isArray(accountInfo.assets)) {
      console.log(address + 'assets:', accountInfo.assets);
      for (let assetInfo of accountInfo.assets) {
        if (assetInfo['asset-id'] == assetIndex) {
          return true;
        }
      }
    }

  } catch (err) {
    console.error(err);
  }

  return false;
}
