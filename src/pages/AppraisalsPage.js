import React from "react";
import { useSelector } from "react-redux";
import { Helmet, useModulesManager, useTranslations } from "@openimis/fe-core";

import AppraisalFilter from "../components/AppraisalFilter";
import AppraisalSearcher from "../components/AppraisalSearcher";
import AppraisalSummaryCards from "../components/AppraisalSummaryCards";
import { APPRAISAL_MODULE_NAME, RIGHT_APPRAISAL_VIEW } from "../constants";
import useAppraisalStyles from "../styles";
import { isAppraisalConfigured } from "../util/configuration";

function AppraisalsPage() {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  if (!rights.includes(RIGHT_APPRAISAL_VIEW) || !isAppraisalConfigured(modulesManager)) return null;
  const filterClasses = { form: classes.form, item: classes.filterItem };
  return (
    <div className={classes.page}>
      <Helmet title={formatMessage("appraisals.title")} />
      <AppraisalSummaryCards />
      <AppraisalSearcher FilterPane={(props) => <AppraisalFilter {...props} classes={filterClasses} />} />
    </div>
  );
}

export default AppraisalsPage;
