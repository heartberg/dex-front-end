export interface projectPresaleCreateModel {
  description:string,
  contractAddress:string,
  contractId:number,
  projectName:string,
  projectImage:string,
  creatorWallet:string,
  roadmap:string,
  roadmapImage:string,
  twitter:string,
  telegram:string,
  instagram:string,
  website:string,
  teamMembers: projectrPresaleCreateTeamModel[],
  presale: projectPresaleCreatePresaleModel,
  asset: projectMintModel
}

interface projectrPresaleCreateTeamModel {
  name: string,
  image: string,
  role: string,
  social: string
}

interface projectPresaleCreatePresaleModel {
    softCap: number,
    hardCap: number,
    tokenAmount: number,
    walletCap: number,
    startingTime: number,
    endingTime: number
}
// presaleCreate

export interface projectWithoutPresaleCreateModel {
  description:string,
  contractAddress:string,
  contractId:number,
  projectName:string,
  projectImage:string,
  creatorWallet:string,
  roadmap:string,
  roadmapImage:string,
  twitter:string,
  telegram:string,
  instagram:string,
  website:string,
  teamMembers: projectrPresaleCreateTeamModel[],
  asset: projectMintModel
}
// withoutPresale

export interface projectMintModel {
  assetId: number;
  projectId: string;
  contractId: number;
  contractAddress: string;
  name: string;
  unitName: string;
  totalSupply: number;
  url: string;
  maxBuy: number;
  tradingStart: number;
  risingPriceFloor: number;
  backing: number;
  buyBurn: number;
  sellBurn: number;
  sendBurn: number;
  image: string;
  deployerWallet: string;
  decimals: number;
  extraFeeTime: number;
}
// project mint


