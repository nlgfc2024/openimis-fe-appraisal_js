import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Searcher, formatDateTimeFromISO, historyPush, useHistory, useModulesManager, useTranslations } from "@openimis/fe-core";
import { injectIntl } from "react-intl";
import FormatListNumberedIcon from "@material-ui/icons/FormatListNumbered";

import { fetchAppraisals } from "../actions";
import { parseJson } from "../util/appraisal";
import { APPRAISAL_MODULE_NAME, DEFAULT_PAGE_SIZE, ROWS_PER_PAGE_OPTIONS } from "../constants";

function AppraisalSearcher({
  intl,
  fetchAppraisals,
  fetchingAppraisals,
  fetchedAppraisals,
  errorAppraisals,
  appraisals,
  appraisalsPageInfo,
  appraisalsTotalCount,
  FilterPane,
}) {
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);

  const headers = () => [
    "appraisal.applicant",
    "appraisal.nationalId",
    "appraisal.stage",
    "appraisal.status",
    "appraisal.decision",
    "appraisal.score",
    "appraisal.dateUpdated",
  ];
  const itemFormatters = () => [
    (a) => `${a.individual?.firstName ?? ""} ${a.individual?.lastName ?? ""}`.trim(),
    (a) => parseJson(a.individual?.jsonExt).national_id ?? "",
    (a) => formatMessage(`stage.${a.stage}`),
    (a) => formatMessage(`status.${a.status}`),
    (a) => (a.eligibility ? formatMessage(`eligibility.${a.eligibility}`) : ""),
    (a) => a.score ?? "",
    (a) => formatDateTimeFromISO(modulesManager, intl, a.dateUpdated),
  ];
  const sorts = () => [
    ["individual__last_name", true],
    ["individual__json_ext__national_id", true],
    ["stage", true],
    ["status", true],
    ["eligibility", true],
    ["score", false],
    ["date_updated", false],
  ];
  const searcherActions = [
    {
      label: formatMessage("action.ranking"),
      icon: <FormatListNumberedIcon />,
      authorized: true,
      onClick: () => historyPush(modulesManager, history, `${APPRAISAL_MODULE_NAME}.route.shortlist`),
      variant: "outlined",
    },
  ];
  const open = (appraisal, newTab = false) =>
    historyPush(modulesManager, history, `${APPRAISAL_MODULE_NAME}.route.appraisal`, [appraisal.uuid], newTab);

  return (
    <Searcher
      module={APPRAISAL_MODULE_NAME}
      FilterPane={FilterPane}
      fetch={(params) => fetchAppraisals(params)}
      items={appraisals}
      itemsPageInfo={appraisalsPageInfo}
      fetchingItems={fetchingAppraisals}
      fetchedItems={fetchedAppraisals}
      errorItems={errorAppraisals}
      tableTitle={formatMessageWithValues("appraisal.searcherResultsTitle", { count: appraisalsTotalCount })}
      headers={headers}
      itemFormatters={itemFormatters}
      sorts={sorts}
      rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
      defaultPageSize={DEFAULT_PAGE_SIZE}
      defaultOrderBy="-date_updated"
      rowIdentifier={(appraisal) => appraisal.id}
      onDoubleClick={open}
      enableHeaderActionButtons
      searcherActions={searcherActions}
    />
  );
}

const mapStateToProps = (state) => ({
  fetchingAppraisals: state.appraisal.fetchingAppraisals,
  fetchedAppraisals: state.appraisal.fetchedAppraisals,
  errorAppraisals: state.appraisal.errorAppraisals,
  appraisals: state.appraisal.appraisals,
  appraisalsPageInfo: state.appraisal.appraisalsPageInfo,
  appraisalsTotalCount: state.appraisal.appraisalsTotalCount,
});

const mapDispatchToProps = (dispatch) => bindActionCreators({ fetchAppraisals }, dispatch);

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(AppraisalSearcher));
