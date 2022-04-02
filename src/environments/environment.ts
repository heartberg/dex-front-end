// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  baseUrl: 'https://versepad.azurewebsites.net',
  // baseUrl: 'http://localhost:5000',

  ALGOD_TESTNET_URL:"https://testnet-algorand.api.purestake.io/ps2",
  ALGOD_TESTNET_TOKEN:"6QTY6ISUSJICWWUXHBWD5MBKPIXA6L2E454UVTKBH2MB6BRBLNZIJTDTB4",
  ALGOD_TESTNET_INDEXER_ADDRESS:"https://testnet-algorand.api.purestake.io/idx2",

  ALGOD_LOCAL_TESTNET_URL:"http://localhost:4001",
  ALGOD_LOCAL_TESTNET_TOKEN:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  ALGOD_LOCAL_TESTNET_INDEXER_ADDRESS:"http://localhost",

  ALGOD_URL:"http://localhost",
  ALGOD_TOKEN:"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  ALGOD_INDEXER_ADDRESS:"http://localhost",

  TOKEN_APP_ID: 1,
  STORE_APP_ID: 13,
  TRADE_APP_ID: 15,
  BID_APP_ID: 17,
  SWAP_APP_ID: 19,
  AUCTION_APP_ID: 21,
  STAKING_APP_ID: 24,
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
