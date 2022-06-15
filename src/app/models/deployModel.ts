import { SmartProperties } from "./assetViewModel";
import { ProjectPreviewModel } from "./projectPreviewModel";

export interface projectPresaleCreateModel {
  description:string,
  projectName:string,
  projectImage:string,
  creatorWallet:string,
  roadmap?:string,
  roadmapImage?:string,
  twitter?:string,
  telegram?:string,
  discord?:string,
  website?:string,
  teamMembers?: projectCreateTeamModel[],
  presale: projectPresaleCreatePresaleModel,
  asset: projectMintModel,
  initialAlgoLiquidity?: number,
  initialAlgoLiquidityWithFee?: number,
  initialTokenLiquidity?: number,
}

export interface stakingCreateModel {
  assetId: number,
  contractId: number,
  startingTime: number,
  endingTime: number,
  projectId: string | null,
  isDistribution: boolean
}

interface projectCreateTeamModel {
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
    endingTime: number,
    presaleToLiquidity: number,
    contractId?: number
}
// presaleCreate

export interface projectWithoutPresaleCreateModel {
  description:string,
  projectName:string,
  projectImage:string,
  creatorWallet:string,
  roadmap?:string,
  roadmapImage?:string,
  twitter?:string,
  telegram?:string,
  discord?:string,
  website?:string,
  teamMembers?: projectCreateTeamModel[],
  asset: projectMintModel,
  initialAlgoLiquidity?: number,
  initialAlgoLiquidityWithFee?: number,
  initialTokenLiquidity?: number,
}
// withoutPresale

export interface projectMintModel {
  assetId: number;
  projectId: string;
  name: string;
  unitName: string;
  totalSupply: number;
  url: string;
  image: string;
  deployerWallet: string;
  decimals: number;
  smartProperties?: SmartProperties
}
// project mint


