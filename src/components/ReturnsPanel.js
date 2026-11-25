import React from "react";
import { Button, Grid, Typography } from "@material-ui/core";
import { Table, WarningBox, formatDateTimeFromISO, useModulesManager, useTranslations } from "@openimis/fe-core";
import { useIntl } from "react-intl";

import { APPRAISAL_MODULE_NAME, EMPTY_VALUE } from "../constants";
import useAppraisalStyles from "../styles";
import { openReturn } from "../util/appraisal";

export function ReturnedBanner({ appraisal, canResubmit, onResubmit }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const intl = useIntl();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const current = openReturn(appraisal);
  if (!current) return null;
  return (
    <Grid container alignItems="center" className={classes.item}>
      <WarningBox
        xs={canResubmit ? 9 : 12}
        title={formatMessageWithValues("returns.banner", {
          user: current.requestedBy,
          date: formatDateTimeFromISO(modulesManager, intl, current.returnedAt),
        })}
        description={formatMessageWithValues("returns.bannerDetails", {
          reason: current.reason,
          action: current.actionRequired,
        })}
      />
      {canResubmit && (
        <Grid item xs={3} className={classes.item}>
          <Button fullWidth color="primary" variant="contained" onClick={onResubmit}>
            {formatMessage("action.resubmit")}
          </Button>
        </Grid>
      )}
    </Grid>
  );
}

export function ReturnsTable({ returns }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const intl = useIntl();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const when = (user, date) =>
    user ? (
      <Typography variant="caption">
        {user}
        <br />
        {formatDateTimeFromISO(modulesManager, intl, date)}
      </Typography>
    ) : (
      EMPTY_VALUE
    );
  if (!returns?.length) {
    return (
      <Typography variant="body2" className={classes.section}>
        {formatMessage("returns.none")}
      </Typography>
    );
  }
  return (
    <Table
      module={APPRAISAL_MODULE_NAME}
      headers={[
        "returns.returned",
        "returns.stage",
        "returns.reason",
        "returns.actionRequired",
        "returns.resubmitted",
        "returns.note",
      ]}
      items={returns}
      itemFormatters={[
        (item) => when(item.requestedBy, item.returnedAt),
        (item) => formatMessage(`stage.${item.stage}`),
        (item) => item.reason,
        (item) => item.actionRequired,
        (item) => (item.isOpen ? formatMessage("returns.open") : when(item.resubmittedBy, item.resubmittedAt)),
        (item) => item.resubmissionNote || "",
      ]}
      rowHighlighted={(item) => item.isOpen}
    />
  );
}
