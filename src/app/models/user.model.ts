export interface User {
  wallet: string,
  name: string,
  verified: boolean,
  bio: string,
  profileImage: string | null,
  bannerImage: string | null,
  featuredImage: string | null,
  customURL: string | any,
  twitter: string | any,
  telegram: string | any,
  instagram: string | any,
  website: string | any,
  featuredArtist: boolean,
  wonVotingPeriods: any[]
}

