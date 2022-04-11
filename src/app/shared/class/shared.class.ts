export class ProjectViewModel {
    description:string;
    contractAddress:string;
    contractId:number;
    projectName:string;
    projectImage:string;
    creatorWallet:string;
    roadmap:string;
    roadmapImage:string;
    twitter:string;
    telegram:string;
    instagram:string;
    website:string;
    teamMembers: any[];
    presale?: Presale;

    constructor(
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
        teamMembers: any[],
        presale?: Presale
        ){

        this.description = description;
        this.contractAddress = contractAddress;
        this.contractId = contractId;
        this.projectName = projectName;
        this.projectImage = projectImage;
        this.creatorWallet = creatorWallet;
        this.roadmap = roadmap;
        this.roadmapImage = roadmapImage;
        this.twitter = twitter;
        this.telegram = telegram;
        this.instagram = instagram;
        this.website = website;
        this.teamMembers =teamMembers;
        this.presale = presale;
    }
}

export class Presale {
    softCap:number;
    hardCap:number;
    tokenAmount:number;
    walletCap:number;
    startingTime:number;
    endingTime:number;

     constructor(
        softCap:number,
        hardCap:number,
        tokenAmount:number,
        walletCap:number,
        startingTime:number,
        endingTime:number,
     ){

        this.softCap = softCap;
        this.hardCap = hardCap;
        this.tokenAmount = tokenAmount;
        this.walletCap = walletCap;
        this.startingTime = startingTime;
        this.endingTime = endingTime;

     }
}

export class ProjectViewModelForMinit{
    ContractAddress:string
    assetId: number;
    projectId: string;
    smartContractId: number;
    smartContractAddress: string;
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
    additionalFee: null;
    additionalFeeWallet: null;
    image: string;
    deployerWallet: string;


    constructor(
        ContractAddress:string,
        assetId: number,
        projectId: string,
        smartContractId: number,
        smartContractAddress: string,
        name: string,
        unitName: string,
        totalSupply: number,
        url: string,
        maxBuy: number,
        tradingStart: number,
        risingPriceFloor: number,
        backing: number,
        buyBurn: number,
        sellBurn: number,
        sendBurn: number,
        additionalFee: null,
        additionalFeeWallet: null,
        image: string,
        deployerWallet: string
    ){
        this.ContractAddress = ContractAddress;
        this.assetId = assetId;
        this.projectId = projectId;
        this.smartContractId = smartContractId;
        this.smartContractAddress =  smartContractAddress;
        this.name =  name;
        this.unitName =  unitName;
        this.totalSupply =  totalSupply;
        this.url =  url;
        this.maxBuy =  maxBuy;
        this.tradingStart =  tradingStart;
        this.risingPriceFloor =  risingPriceFloor;
        this.backing =  backing;
        this.buyBurn =  buyBurn;
        this.sellBurn =  sellBurn;
        this.sendBurn =  sendBurn;
        this.additionalFee =  additionalFee;
        this.additionalFeeWallet =  additionalFeeWallet;
        this.image = image;
        this.deployerWallet = deployerWallet;
    }
}



