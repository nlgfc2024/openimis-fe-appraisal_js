import React, { useState } from "react";
import { Box, Grid, Paper, Tab, Tabs } from "@material-ui/core";
import { PublishedComponent, useModulesManager, useTranslations } from "@openimis/fe-core";

import {
  APPRAISAL_MODULE_NAME,
  APPRAISAL_TABS,
  REF_APPLICANT_DOCUMENTS,
  REF_KOBO_APPLICATIONS,
  TAB_APPLICATION,
  TAB_CHECKLIST,
  TAB_DOCUMENTS,
  TAB_HISTORY,
} from "../constants";
import useAppraisalStyles from "../styles";
import AppraisalHistory from "./AppraisalHistory";
import DecisionPanel from "./DecisionPanel";
import EligibilityChecklist from "./EligibilityChecklist";

function AppraisalTabPanel({ edited: appraisal, canScreen, onAnswer, onDecide, deciding, decisionError }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const [tab, setTab] = useState(TAB_CHECKLIST);
  if (!appraisal) return null;
  const items = appraisal.items || [];
  const individualId = appraisal.individual?.uuid;

  return (
    <Paper className={classes.paper}>
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
            canDecide={canScreen}
            saving={deciding}
            error={decisionError}
            onDecide={onDecide}
          />
        </>
      )}
      {tab === TAB_APPLICATION && (
        <Box className={classes.section}>
          <PublishedComponent pubRef={REF_KOBO_APPLICATIONS} individualId={individualId} />
        </Box>
      )}
      {tab === TAB_DOCUMENTS && (
        <Box className={classes.section}>
          <PublishedComponent pubRef={REF_APPLICANT_DOCUMENTS} individualId={individualId} />
        </Box>
      )}
      {tab === TAB_HISTORY && <AppraisalHistory history={appraisal.history} items={items} />}
    </Paper>
  );
}

export default AppraisalTabPanel;
