import React from "react";
import { Button, Divider, Grid, Typography } from "@material-ui/core";
import { Table, WarningBox, formatDateTimeFromISO, useModulesManager, useTranslations } from "@openimis/fe-core";
import { useIntl } from "react-intl";

import { APPRAISAL_MODULE_NAME, EMPTY_VALUE } from "../constants";
import useAppraisalStyles from "../styles";
import { awaitingPoints, formatPoints, parseJson } from "../util/appraisal";
import StatCard from "./StatCard";

function shownValue(value, formatMessage) {
  if (value === null || value === undefined || value === "") return EMPTY_VALUE;
  if (value === true) return formatMessage("score.yes");
  if (value === false) return formatMessage("score.no");
  // Amounts read better grouped (5,000,000); other answers as given
  const number = Number(value);
  return typeof value !== "boolean" && String(value).trim() !== "" && !Number.isNaN(number)
    ? number.toLocaleString()
    : String(value);
}

function ScoreTable({ appraisal, items, canScore, canRescore, onScore, onRescore, rescoring }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const intl = useIntl();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const points = (value, max) => (
    <Typography variant="body2" noWrap>
      {value === null || value === undefined ? EMPTY_VALUE : `${formatPoints(value)} / ${formatPoints(max)}`}
    </Typography>
  );

  const headers = [
    "score.indicator",
    "score.value",
    "score.system",
    "score.officer",
    "score.evidence",
    "score.decided",
  ];
  const itemFormatters = [
    (item) => (
      <>
        <Typography variant="body2">{item.label}</Typography>
        {item.basisChanged && (
          <Typography variant="caption" className={classes.warning}>
            {formatMessage("score.basisChanged")}
          </Typography>
        )}
      </>
    ),
    (item) => {
      const basis = parseJson(item.basis);
      return (
        <>
          <Typography variant="body2">{shownValue(basis.value, formatMessage)}</Typography>
          {basis.note && (
            <Typography variant="caption" className={classes.muted}>
              {basis.note}
            </Typography>
          )}
        </>
      );
    },
    (item) => points(item.systemPoints, item.maxPoints),
    (item) =>
      item.points === null || item.points === undefined ? (
        <Typography variant="caption" className={classes.warning}>
          {formatMessage("score.awaitingOfficer")}
        </Typography>
      ) : item.officerValue !== null && item.officerValue !== undefined ? (
        <>
          <Typography variant="body2">{shownValue(item.officerValue, formatMessage)}</Typography>
          {points(item.officerPoints, item.maxPoints)}
        </>
      ) : (
        points(item.officerPoints, item.maxPoints)
      ),
    (item) => (
      <>
        {item.evidence && <Typography variant="body2">{item.evidence}</Typography>}
        {item.comment && (
          <Typography variant="caption" className={classes.muted}>
            {item.comment}
          </Typography>
        )}
      </>
    ),
    (item) =>
      item.decidedBy ? (
        <Typography variant="caption">
          {item.decidedBy}
          <br />
          {formatDateTimeFromISO(modulesManager, intl, item.decidedAt)}
        </Typography>
      ) : (
        ""
      ),
  ];
  if (canScore) {
    headers.push("emptyLabel");
    itemFormatters.push((item) => (
      <Button size="small" color="primary" variant="outlined" onClick={() => onScore(item)}>
        {formatMessage(
          item.officerPoints === null || item.officerPoints === undefined ? "action.score" : "action.change",
        )}
      </Button>
    ));
  }

  const changed = items.filter((item) => item.basisChanged).length;
  const awaiting = awaitingPoints(items);
  const total = formatPoints(appraisal.score) ?? (awaiting.length ? formatMessage("score.awaiting") : null);
  return (
    <>
      <Grid container className={classes.item}>
        <StatCard md={3} label={formatMessage("score.total")} value={total} text />
        <StatCard md={3} label={formatMessage("score.rank")} value={appraisal.rank} text />
        <StatCard md={3} label={formatMessage("score.overridden")} value={items.filter((i) => i.isOverridden).length} />
        <StatCard md={3} label={formatMessage("score.changed")} value={changed} />
      </Grid>
      {!!awaiting.length && (
        <Grid container className={classes.item}>
          <WarningBox
            xs={12}
            title={formatMessage("score.awaitingTitle")}
            description={formatMessageWithValues("score.awaitingItems", {
              items: awaiting.map((item) => item.label).join(", "),
            })}
          />
        </Grid>
      )}
      <Divider />
      {items.length ? (
        <Table
          module={APPRAISAL_MODULE_NAME}
          headers={headers}
          itemFormatters={itemFormatters}
          items={items}
          rowHighlighted={(item) => item.basisChanged}
        />
      ) : (
        <Typography variant="body2" className={classes.section}>
          {formatMessage("score.none")}
        </Typography>
      )}
      {canRescore && (
        <>
          <Divider />
          <Grid container alignItems="center" className={classes.item}>
            <Grid item xs={12} md={9} className={classes.item}>
              <Typography variant="body2" className={classes.muted}>
                {formatMessage("score.rescoreHelp")}
              </Typography>
            </Grid>
            <Grid item xs={12} md={3} className={classes.item}>
              <Button fullWidth color="primary" variant="contained" disabled={rescoring} onClick={onRescore}>
                {formatMessage(items.length ? "action.rescore" : "action.scoreNow")}
              </Button>
            </Grid>
          </Grid>
        </>
      )}
    </>
  );
}

export default ScoreTable;
