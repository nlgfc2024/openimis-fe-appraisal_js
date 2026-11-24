import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@material-ui/core";
import { useModulesManager, useTranslations } from "@openimis/fe-core";

import { APPRAISAL_MODULE_NAME } from "../constants";
import useAppraisalStyles from "../styles";

/** Reopen a recorded eligibility decision to correct it; the reason is required and kept with the appraisal. */
function ReopenDialog({ open, applicant, decision, saving, error, onCancel, onSave }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setTouched(false);
    }
  }, [open]);

  const missing = !reason.trim();
  const save = () => {
    setTouched(true);
    if (!missing) onSave(reason.trim());
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{formatMessageWithValues("reopen.title", { applicant })}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          {formatMessageWithValues("reopen.help", { decision })}
        </Typography>
        <TextField
          fullWidth
          multiline
          required
          margin="dense"
          label={formatMessage("reopen.reason")}
          helperText={formatMessage("reopen.reasonHelp")}
          value={reason}
          error={touched && missing}
          onChange={(e) => setReason(e.target.value)}
        />
        {touched && missing && (
          <Typography variant="body2" color="error">
            {formatMessage("reopen.required")}
          </Typography>
        )}
        {error && (
          <Typography variant="body2" className={classes.warning}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={save} className={classes.primaryButton} disabled={saving} autoFocus>
          {formatMessage("action.reopen")}
        </Button>
        <Button onClick={onCancel} className={classes.secondaryButton} disabled={saving}>
          {formatMessage("action.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ReopenDialog;
