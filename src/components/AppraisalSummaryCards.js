import React from "react";
import { Grid, Paper, Typography } from "@material-ui/core";
import { useGraphqlQuery, useModulesManager, useTranslations } from "@openimis/fe-core";

import { APPRAISAL_SUMMARY_QUERY } from "../actions";
import { APPRAISAL_MODULE_NAME, SUMMARY_CARDS } from "../constants";
import useAppraisalStyles from "../styles";
import StatCard from "./StatCard";

function AppraisalSummaryCards() {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const { data } = useGraphqlQuery(APPRAISAL_SUMMARY_QUERY, {});
  return (
    <Paper className={classes.paper}>
      <Typography className={classes.title}>{formatMessage("summary.title")}</Typography>
      <Grid container className={classes.item}>
        {SUMMARY_CARDS.map((card) => (
          <StatCard key={card} label={formatMessage(`summary.${card}`)} value={data?.[card]?.totalCount} />
        ))}
      </Grid>
    </Paper>
  );
}

export default AppraisalSummaryCards;
