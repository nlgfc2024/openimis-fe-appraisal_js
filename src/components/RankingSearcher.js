import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Searcher, historyPush, useHistory, useModulesManager, useTranslations } from "@openimis/fe-core";

import { fetchRanking } from "../actions";
import { APPRAISAL_MODULE_NAME, RANKED_STATUSES, RANKING_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS } from "../constants";
import { cityOf, formatPoints, parseJson } from "../util/appraisal";

function RankingSearcher({
  programme,
  round,
  fetchRanking,
  fetchingRanking,
  fetchedRanking,
  errorRanking,
  ranking,
  rankingPageInfo,
  rankingTotalCount,
}) {
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);

  const defaultFilters = {
    programme: { value: programme, filter: `programme: ${JSON.stringify(programme)}` },
    round: { value: round, filter: `round: ${JSON.stringify(round)}` },
    ranked: { value: true, filter: `status_In: [${RANKED_STATUSES.join(", ")}]` },
  };
  const headers = () => [
    "ranking.rank",
    "appraisal.applicant",
    "appraisal.nationalId",
    "ranking.city",
    "appraisal.score",
    "appraisal.status",
  ];
  const itemFormatters = () => [
    (a) => a.rank ?? "",
    (a) => `${a.individual?.firstName ?? ""} ${a.individual?.lastName ?? ""}`.trim(),
    (a) => parseJson(a.individual?.jsonExt).national_id ?? "",
    (a) => cityOf(a.individual?.location) ?? "",
    (a) => formatPoints(a.score) ?? "",
    (a) => formatMessage(`status.${a.status}`),
  ];
  const sorts = () => [
    ["rank", true],
    ["individual__last_name", true],
    ["individual__json_ext__national_id", true],
    null,
    ["score", false],
    ["status", true],
  ];
  const open = (appraisal, newTab = false) =>
    historyPush(modulesManager, history, `${APPRAISAL_MODULE_NAME}.route.appraisal`, [appraisal.uuid], newTab);

  return (
    <Searcher
      module={APPRAISAL_MODULE_NAME}
      fetch={(params) => fetchRanking(params)}
      items={ranking}
      itemsPageInfo={rankingPageInfo}
      fetchingItems={fetchingRanking}
      fetchedItems={fetchedRanking}
      errorItems={errorRanking}
      tableTitle={formatMessageWithValues("ranking.searcherResultsTitle", { count: rankingTotalCount })}
      headers={headers}
      itemFormatters={itemFormatters}
      sorts={sorts}
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      defaultPageSize={RANKING_PAGE_SIZE}
      defaultOrderBy="-score"
      defaultFilters={defaultFilters}
      rowIdentifier={(appraisal) => appraisal.id}
      onDoubleClick={open}
    />
  );
}

const mapStateToProps = (state) => ({
  fetchingRanking: state.appraisal.fetchingRanking,
  fetchedRanking: state.appraisal.fetchedRanking,
  errorRanking: state.appraisal.errorRanking,
  ranking: state.appraisal.ranking,
  rankingPageInfo: state.appraisal.rankingPageInfo,
  rankingTotalCount: state.appraisal.rankingTotalCount,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ fetchRanking }, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(RankingSearcher);
