import React, { useState } from "react";
import { Box, Grid, Paper, Tab, Tabs } from "@material-ui/core";
import { PublishedComponent, useModulesManager, useTranslations } from "@openimis/fe-core";

import {
  APPRAISAL_MODULE_NAME,
  APPRAISAL_TABS,
  REF_KOBO_APPLICATIONS,
  TAB_APPLICATION,
  TAB_CHECKLIST,
  TAB_DOCUMENTS,
  TAB_HISTORY,
  TAB_RETURNS,
  TAB_SCORE,
} from "../constants";
import useAppraisalStyles from "../styles";
import AppraisalHistory from "./AppraisalHistory";
import DecisionPanel from "./DecisionPanel";
import DocumentCheck from "./DocumentCheck";
import EligibilityChecklist from "./EligibilityChecklist";
import { ReturnedBanner, ReturnsTable } from "./ReturnsPanel";
import ScoreTable from "./ScoreTable";

function AppraisalTabPanel({
  edited: appraisal,
  canScreen,
  onAnswer,
  onDecide,
  deciding,
  decisionError,
  canScore,
  canRescore,
  onScore,
  onRescore,
  rescoring,
  canReviewDocuments,
  reviewingDocument,
  reviewError,
  onVerifyDocument,
  onRejectDocument,
  canResubmit,
  onResubmit,
}) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const [tab, setTab] = useState(TAB_CHECKLIST);
  if (!appraisal) return null;
  const items = appraisal.items || [];
  const individualId = appraisal.individual?.uuid;

  return (
    <Paper className={classes.paper}>
      <ReturnedBanner appraisal={appraisal} canResubmit={canResubmit} onResubmit={onResubmit} />
      <Grid container className={`${classes.tableTitle} ${classes.tabs}`}>
        <Tabs value={tab} onChange={(e, value) => setTab(value)} TabIndicatorProps={{ style: { display: "none" } }}>
          {APPRAISAL_TABS.map((value) => (
            <Tab
              key={value}
              value={value}
              className={tab === value ? classes.selectedTab : classes.unselectedTab}
              label={formatMessage(`tab.${value}`)}
            />
          ))}
        </Tabs>
      </Grid>
      {tab === TAB_CHECKLIST && (
        <>
          <EligibilityChecklist items={items} canAnswer={canScreen} onAnswer={onAnswer} />
          <DecisionPanel
            items={items}
            documents={appraisal.documents}
            documentsComplete={appraisal.documentsComplete}
            onOpenDocuments={() => setTab(TAB_DOCUMENTS)}
            canDecide={canScreen}
            saving={deciding}
            error={decisionError}
            onDecide={onDecide}
          />
        </>
      )}
      {tab === TAB_SCORE && (
        <ScoreTable
          appraisal={appraisal}
          items={appraisal.scoreItems || []}
          canScore={canScore}
          canRescore={canRescore}
          onScore={onScore}
          onRescore={onRescore}
          rescoring={rescoring}
        />
      )}
      {tab === TAB_APPLICATION && (
        <Box className={classes.section}>
          <PublishedComponent pubRef={REF_KOBO_APPLICATIONS} individualId={individualId} />
        </Box>
      )}
      {tab === TAB_DOCUMENTS && (
        <DocumentCheck
          appraisal={appraisal}
          canReview={canReviewDocuments}
          saving={reviewingDocument}
          error={reviewError}
          onVerify={onVerifyDocument}
          onReject={onRejectDocument}
        />
      )}
      {tab === TAB_RETURNS && <ReturnsTable returns={appraisal.returns} />}
      {tab === TAB_HISTORY && <AppraisalHistory history={appraisal.history} items={items} documents={appraisal.documents} />}
    </Paper>
  );
}

export default AppraisalTabPanel;
