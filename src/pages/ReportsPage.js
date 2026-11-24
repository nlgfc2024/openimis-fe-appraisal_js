import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Grid, IconButton, Paper, Tooltip, Typography } from "@material-ui/core";
import RefreshIcon from "@material-ui/icons/Refresh";
import {
  Helmet,
  ProgressOrError,
  Table,
  TextInput,
  useGraphqlQuery,
  useModulesManager,
  useTranslations,
} from "@openimis/fe-core";

import { LATEST_ROUND_QUERY, REPORT_QUERY } from "../actions";
import StatCard from "../components/StatCard";
import {
  APPRAISAL_MODULE_NAME,
  EMPTY_VALUE,
  REPORT_AWAITING,
  REPORT_CITY_COLUMNS,
  REPORT_DOCUMENTS,
  RIGHT_APPRAISAL_VIEW,
} from "../constants";
import useAppraisalStyles from "../styles";
import { isAppraisalConfigured } from "../util/configuration";
import { groupLabel, humanize } from "../util/appraisal";

function Section({ title, children, md = 6 }) {
  const classes = useAppraisalStyles();
  return (
    <Grid item xs={12} md={md} className={classes.item}>
      <Paper className={`${classes.paper} ${classes.fullHeight}`}>
        <Typography className={classes.title}>{title}</Typography>
        {children}
      </Paper>
    </Grid>
  );
}

function CountTable({ rows, label }) {
  return (
    <Table
      module={APPRAISAL_MODULE_NAME}
      headers={["emptyLabel", "report.count"]}
      items={rows}
      itemFormatters={[(row) => label(row.key), (row) => row.count]}
    />
  );
}

/** The desk appraisal report of a programme round (Operations Manual 8.12), opened on the latest round. */
function ReportsPage() {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  const allowed = rights.includes(RIGHT_APPRAISAL_VIEW) && isAppraisalConfigured(modulesManager);
  const latest = useGraphqlQuery(LATEST_ROUND_QUERY, {}, { skip: !allowed });
  const [selection, setSelection] = useState({ programme: "", round: "" });
  const [draft, setDraft] = useState(selection);

  useEffect(() => {
    const node = latest.data?.appraisal?.edges?.[0]?.node;
    if (node && !selection.programme) {
      setSelection({ programme: node.programme, round: node.round });
      setDraft({ programme: node.programme, round: node.round });
    }
  }, [latest.data]);

  const { isLoading, error, data, refetch } = useGraphqlQuery(
    REPORT_QUERY,
    { programme: selection.programme, round: selection.round || null },
    { skip: !allowed || !selection.programme, keepStale: true },
  );
  if (!allowed) return null;
  const report = data?.appraisalReport;
  // The round is applied when a field is left, not on every keystroke
  const apply = () => {
    if (draft.programme !== selection.programme || draft.round !== selection.round) setSelection(draft);
  };
  const sum = (key) => (report?.byCity || []).reduce((total, city) => total + (city[key] || 0), 0);
  const awaiting = REPORT_AWAITING.map((key) => ({ key, count: report?.awaiting?.[key] ?? 0 }));
  const notGiven = (value) => humanize(value) || formatMessage("report.notGiven");

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage("report.title")} />
      <Paper className={classes.paper}>
        <Grid container alignItems="center" justify="space-between" className={classes.tableTitle}>
          <Typography>{formatMessage("report.title")}</Typography>
          <Tooltip title={formatMessage("action.refresh")}>
            <IconButton size="small" onClick={refetch} disabled={!selection.programme}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Grid>
        <Grid container className={classes.item}>
          {["programme", "round"].map((field) => (
            <Grid key={field} item xs={12} sm={6} md={3} className={classes.item}>
              <TextInput
                module={APPRAISAL_MODULE_NAME}
                label={`appraisal.${field}`}
                value={draft[field]}
                onChange={(value) => setDraft({ ...draft, [field]: value })}
                onBlur={apply}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>
      <ProgressOrError progress={isLoading && !report} error={error} />
      {!isLoading && selection.programme && !report && (
        <Typography variant="body2" className={`${classes.section} ${classes.muted}`}>
          {formatMessageWithValues("report.none", selection)}
        </Typography>
      )}
      {report && (
        <Grid container>
          <Grid item xs={12}>
            <Grid container className={classes.item}>
              <StatCard md={3} label={formatMessage("report.applications")} value={report.total} />
              <StatCard md={3} label={formatMessage("report.eligible")} value={sum("eligible")} />
              <StatCard md={3} label={formatMessage("report.shortlisted")} value={sum("shortlisted")} />
              <StatCard
                md={3}
                label={formatMessage("report.awaitingTotal")}
                value={awaiting.reduce((total, row) => total + row.count, 0)}
              />
            </Grid>
          </Grid>
          <Section title={formatMessage("report.byCity")} md={12}>
            <Table
              module={APPRAISAL_MODULE_NAME}
              headers={["report.city", "report.places", ...REPORT_CITY_COLUMNS.map((key) => `report.${key}`)]}
              items={report.byCity}
              itemFormatters={[
                (city) => groupLabel(city.city) || formatMessage("report.outsideCities"),
                (city) => city.places ?? EMPTY_VALUE,
                ...REPORT_CITY_COLUMNS.map((key) => (city) => city[key]),
              ]}
            />
          </Section>
          <Section title={formatMessage("report.byStatus")}>
            <CountTable rows={report.byStatus} label={(key) => formatMessage(`status.${key}`)} />
          </Section>
          <Section title={formatMessage("report.awaiting")}>
            <CountTable rows={awaiting} label={(key) => formatMessage(`report.awaitingItems.${key}`)} />
          </Section>
          <Section title={formatMessage("report.documents")}>
            <CountTable
              rows={REPORT_DOCUMENTS.map((key) => ({ key, count: report.documents?.[key] ?? 0 }))}
              label={(key) => formatMessage(`report.documentItems.${key}`)}
            />
          </Section>
          {report.breakdowns.map((breakdown) => (
            <Section key={breakdown.key} title={formatMessageWithValues("report.by", { label: breakdown.label })}>
              <CountTable rows={breakdown.counts} label={notGiven} />
            </Section>
          ))}
        </Grid>
      )}
    </div>
  );
}

export default ReportsPage;
