import type { components } from "./generated/auctions-api";

type Schemas = components["schemas"];

export type AuctionListRequest = Schemas["AuctionListRequest"];
export type AuctionListResponse = Schemas["AuctionListResponseBase"];
export type AuctionDetail = Schemas["AuctionShowResponse"];
export type BetListResponse = Schemas["BetListResponse"];
export type SetBetRequest = Schemas["SetBetRequest"];
export type ProblemDetail = Schemas["ProblemDetail"];
export type ValidationProblem = Schemas["ValidationProblem"];
