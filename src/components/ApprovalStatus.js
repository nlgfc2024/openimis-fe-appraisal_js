import React from "react";
import { Button, Grid, Typography } from "@material-ui/core";
import {
  WarningBox,
  formatDateTimeFromISO,
  historyPush,
  useHistory,
  useModulesManager,
  useTranslations,
} from "@openimis/fe-core";
import { useIntl } from "react-intl";

import { APPRAISAL_MODULE_NAME, APPROVAL_FAILED, APPROVAL_PENDING, TASK_ROUTE_REF } from "../constants";
import useAppraisalStyles from "../styles";

function ApprovalStatus({ approval, description }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const history = useHistory();
  const intl = useIntl();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  if (!approval) return null;
  const date = (value) => formatDateTimeFromISO(modulesManager, intl, value);
  const openTask = () => historyPush(modulesManager, history, TASK_ROUTE_REF, [approval.taskId]);

  if (approval.status === APPROVAL_PENDING) {
    return (
      <Grid container alignItems="center" className={classes.item}>
        <WarningBox
          xs={approval.taskId ? 9 : 12}
          title={formatMessageWithValues("approval.pending", {
            user: approval.requestedBy,
            date: date(approval.requestedAt),
          })}
          description={description || formatMessage("approval.pendingHelp")}
        />
        {approval.taskId && (
          <Grid item xs={3} className={classes.item}>
            <Button fullWidth color="primary" variant="outlined" onClick={openTask}>
              {formatMessage("action.openTask")}
            </Button>
          </Grid>
        )}
      </Grid>
    );
  }
  return (
    <Typography
      variant="body2"
      className={`${classes.section} ${approval.status === APPROVAL_FAILED ? classes.warning : classes.muted}`}
    >
      {formatMessageWithValues(`approval.${approval.status}`, {
        user: approval.decidedBy,
        date: date(approval.decidedAt),
        outcome: approval.outcome,
      })}
    </Typography>
  );
}

export default ApprovalStatus;
