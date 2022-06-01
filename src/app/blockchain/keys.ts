export enum verseStateKeys {
    token_liq_key = "s1",
    algo_liq_key = "s2",
    burned_key = "bd",
    total_supply_key = "ts",
    burn_key = "b",
    transfer_burn_key = "trb",
    flat_fee_key = "ff",
    to_lp_key = "lp",
    to_backing_key = "tb",
    max_buy_key = "mb",
    asset_id_key = "asa",
    trading_start_key = "t",
    extra_fee_time_key = "eft",
    distribution_id_key = "di",
    backing_id_key = "bi",
    fee_addr_key = "ta",
    burn_addr_key = "ba"
}


export enum backingStateKeys {
    user_supplied_key = "us",
    user_algo_borrowed_key = "uab",
    user_1_borrowed_key = "ub1",
    user_2_borrowed_key = "ub2",
    user_3_borrowed_key = "ub3",
    user_4_borrowed_key = "ub4",
    user_5_borrowed_key = "ub5",
    user_6_borrowed_key = "ub6",
    user_7_borrowed_key = "ub7",

    total_algo_borrowed_key = "tab",
    total_1_borrowed_key = "tb1",
    total_2_borrowed_key = "tb2",
    total_3_borrowed_key = "tb3",
    total_4_borrowed_key = "tb4",
    total_5_borrowed_key = "tb5",
    total_6_borrowed_key = "tb6",
    total_7_borrowed_key = "tb7",

    asset_1_key = "a1",
    asset_2_key = "a2",
    asset_3_key = "a3",
    asset_4_key = "a4",
    asset_5_key = "a5",
    asset_6_key = "a6",
    asset_7_key = "a7",

    number_of_backing_tokens_key = "nbt",
    verse_app_id_key = "vid",
    verse_token_id_key = "vai",
    burn_addr_key = "ba",
}

export enum smartStakingKeys {
    burn_addr_key = "BA",

    token_id_key = "TK_ID",
    token_app_id_key = "TA",
    verse_token_id_key = "V_TK_ID",
    verse_token_app_id_key = "V_TA",

    current_end_epoch_key = "CE",
    period_dist_amount_key = "PDA",
    distribution_asset_amount_key = "DTA",
    unclaimed_key = "UC",
    period_time_key = "PT",
    next_claimable_time_key = "NCT"
}

export enum standardStakingKeys {
    verse_id_key = "V_TK_ID",
    verse_staking_app_id_key = "V_TA",
    token_id_key = "TK_ID",
    current_end_epoch_key = "CE",

    period_dist_amount_key = "PDA",
    distribution_asset_amount_key = "DTA",
    unclaimed_key = "UC",
    period_time_key = "PT",

    next_claimable_time_key = "NCT"
}

export enum smartDistributionStateKeys {
    burn_addr_key = "BA",

    token_id_key = "TK_ID",
    token_app_id_key = "TA",
    reward_pool_key = "RP",
    current_end_epoch_key = "CE",
    period_dist_amount_key = "PDA",
    distribution_asset_amount_key = "DTA",
    unclaimed_key = "UC",
    period_time_key = "PT",
    total_staked_key = "TS",

    token_amount_key = "TA",
    next_claimable_time_key = "NCT"
}

export enum standardDistributionKeys {
    token_id_key = "TK_ID",

    reward_pool_key = "RP",
    current_end_epoch_key = "CE",
    period_dist_amount_key = "PDA",
    distribution_asset_amount_key = "DTA",
    unclaimed_key = "UC",
    period_time_key = "PT",
    total_staked_key = "TS",

    next_claimable_time_key = "NCT",
    user_staked_key = "TA"
}

export enum stakingStateKeys {
    burn_addr_key = "BA",

    token_id_key = "TK_ID",
    token_app_id_key = "TA",
    current_end_epoch_key = "CE",
    week_total_stake_key = "WTA",
    week_total_added_stake_key = "WTAA",
    weekly_dist_amount_key = "WDA",
    distribution_asset_amount_key = "DTA",
    unclaimed_key = "UC",
    total_staked_key = "TS",

    token_amount_key = "TA",
    next_claimable_time_key = "NCT",
    week_stake_amount_key = "WSA"
}

export enum Method {
    Transfer = "transfer",
    Buy = "buy",
    Sell = "sell",
    GetBacking = "get_backing",
    Borrow = "borrow",
    Algo = "algo",
    RepayAssets = "repay_assets",
    RepayAlgo = "repay_algo",
    Supply = "supply",
    Stake = "stake",
    Withdraw = "withdraw",
    Claim = "claim"
}