import React from "react";
import { Divider, Grid, Typography } from "@material-ui/core";
import { TextInput, useModulesManager, useTranslations } from "@openimis/fe-core";

import { APPRAISAL_MODULE_NAME, EMPTY_VALUE, RESULT_NO, RESULT_PENDING, RESULT_YES } from "../constants";
import useAppraisalStyles from "../styles";
import { formatPoints, parseJson, previewDecision } from "../util/appraisal";
import StatCard from "./StatCard";

function AppraisalHeadPanel({ edited: appraisal }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  if (!appraisal) return null;
  const items = appraisal.items || [];
  const preview = previewDecision(items);
  const count = (result) => items.filter((item) => item.result === result).length;
  const field = (label, value, xs = 3) => (
    <Grid item xs={12} sm={6} md={xs} className={classes.item}>
      <TextInput
        module={APPRAISAL_MODULE_NAME}
        label={label}
        value={value === null || value === undefined || value === "" ? EMPTY_VALUE : value}
        readOnly
      />
    </Grid>
  );
  const decision = appraisal.eligibility || preview.decision;

  return (
    <>
      <Grid container className={classes.tableTitle}>
        <Grid item>
          <Grid container align="center" justify="center" direction="column" className={classes.fullHeight}>
            <Grid item>
              <Typography>{formatMessage("head.title")}</Typography>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Divider />
      <Grid container className={classes.item}>
        {field(
          "appraisal.applicant",
          `${appraisal.individual?.firstName ?? ""} ${appraisal.individual?.lastName ?? ""}`,
        )}
        {field("appraisal.nationalId", parseJson(appraisal.individual?.jsonExt).national_id)}
        {field("appraisal.programme", appraisal.programme)}
        {field("appraisal.round", appraisal.round)}
        {field("appraisal.stage", formatMessage(`stage.${appraisal.stage}`))}
        {field("appraisal.status", formatMessage(`status.${appraisal.status}`))}
        {field(
          "appraisal.eligibility",
          appraisal.eligibility ? formatMessage(`eligibility.${appraisal.eligibility}`) : "",
        )}
        {field("appraisal.koboId", appraisal.koboId)}
        {field("appraisal.score", appraisal.score === null || appraisal.score === undefined ? "" : formatPoints(appraisal.score))}
        {field("appraisal.rank", appraisal.rank)}
        {field(
          "appraisal.documents",
          appraisal.documentsComplete === null || appraisal.documentsComplete === undefined
            ? ""
            : formatMessage(appraisal.documentsComplete ? "documents.complete" : "documents.incomplete"),
        )}
      </Grid>
      <Divider />
      <Grid container className={classes.item}>
        <StatCard md={3} label={formatMessage("head.met")} value={`${count(RESULT_YES)} / ${items.length}`} text />
        <StatCard md={3} label={formatMessage("head.pending")} value={count(RESULT_PENDING)} />
        <StatCard md={3} label={formatMessage("head.notMet")} value={count(RESULT_NO)} />
        <StatCard
          md={3}
          label={formatMessage(appraisal.eligibility ? "head.decision" : "head.leadsTo")}
          value={decision ? formatMessage(`eligibility.${decision}`) : null}
          text
        />
      </Grid>
    </>
  );
}

export default AppraisalHeadPanel;
