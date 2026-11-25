import { formatGraphQLError, formatServerError, pageInfo, parseData } from "@openimis/fe-core";

import { SEARCH_APPRAISALS, SEARCH_RANKING } from "./actions";

const INITIAL_STATE = {
  fetchingAppraisals: false,
  fetchedAppraisals: false,
  errorAppraisals: null,
  appraisals: [],
  appraisalsPageInfo: {},
  appraisalsTotalCount: 0,
  fetchingRanking: false,
  fetchedRanking: false,
  errorRanking: null,
  ranking: [],
  rankingPageInfo: {},
  rankingTotalCount: 0,
};

function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case `${SEARCH_APPRAISALS}_REQ`:
      return { ...state, fetchingAppraisals: true, fetchedAppraisals: false, appraisals: [], errorAppraisals: null };
    case `${SEARCH_APPRAISALS}_RESP`:
      return {
        ...state,
        fetchingAppraisals: false,
        fetchedAppraisals: true,
        appraisals: parseData(action.payload.data.appraisal),
        appraisalsPageInfo: pageInfo(action.payload.data.appraisal),
        appraisalsTotalCount: action.payload.data.appraisal?.totalCount ?? 0,
        errorAppraisals: formatGraphQLError(action.payload),
      };
    case `${SEARCH_APPRAISALS}_ERR`:
      return { ...state, fetchingAppraisals: false, errorAppraisals: formatServerError(action.payload) };
    case `${SEARCH_RANKING}_REQ`:
      return { ...state, fetchingRanking: true, fetchedRanking: false, ranking: [], errorRanking: null };
    case `${SEARCH_RANKING}_RESP`:
      return {
        ...state,
        fetchingRanking: false,
        fetchedRanking: true,
        ranking: parseData(action.payload.data.appraisal),
        rankingPageInfo: pageInfo(action.payload.data.appraisal),
        rankingTotalCount: action.payload.data.appraisal?.totalCount ?? 0,
        errorRanking: formatGraphQLError(action.payload),
      };
    case `${SEARCH_RANKING}_ERR`:
      return { ...state, fetchingRanking: false, errorRanking: formatServerError(action.payload) };
    default:
      return state;
  }
}

export default reducer;
