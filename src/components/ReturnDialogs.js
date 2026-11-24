import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@material-ui/core";
import { useModulesManager, useTranslations } from "@openimis/fe-core";

import { ANSWER_FIELD_ACTION, ANSWER_FIELD_REASON, APPRAISAL_MODULE_NAME } from "../constants";
import useAppraisalStyles from "../styles";
import { returnProblem } from "../util/appraisal";

function DialogFrame({ open, title, saving, error, onCancel, onSave, saveLabel, children }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {children}
        {error && (
          <Typography variant="body2" className={classes.warning}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onSave} className={classes.primaryButton} disabled={saving} autoFocus>
          {saveLabel}
        </Button>
        <Button onClick={onCancel} className={classes.secondaryButton} disabled={saving}>
          {formatMessage("action.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ReturnDialog({ open, applicant, saving, error, onCancel, onSave }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const [details, setDetails] = useState({ reason: "", actionRequired: "" });
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (open) {
      setDetails({ reason: "", actionRequired: "" });
      setTouched(false);
    }
  }, [open]);
  const problem = returnProblem(details);
  return (
    <DialogFrame
      open={open}
      title={formatMessageWithValues("returnDialog.title", { applicant })}
      saving={saving}
      error={error}
      onCancel={onCancel}
      saveLabel={formatMessage("action.return")}
      onSave={() => {
        setTouched(true);
        if (!problem) onSave(details);
      }}
    >
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {formatMessage("returnDialog.help")}
      </Typography>
      <TextField
        fullWidth
        multiline
        margin="dense"
        label={formatMessage("returns.reason")}
        value={details.reason}
        error={touched && problem === ANSWER_FIELD_REASON}
        onChange={(e) => setDetails({ ...details, reason: e.target.value })}
      />
      <TextField
        fullWidth
        multiline
        margin="dense"
        label={formatMessage("returns.actionRequired")}
        value={details.actionRequired}
        error={touched && problem === ANSWER_FIELD_ACTION}
        onChange={(e) => setDetails({ ...details, actionRequired: e.target.value })}
      />
      {touched && problem && (
        <Typography variant="body2" className={classes.warning}>
          {formatMessage(`returnDialog.required.${problem}`)}
        </Typography>
      )}
    </DialogFrame>
  );
}

/** Resubmission of a returned appraisal, with a note of what was received. */
export function ResubmitDialog({ open, saving, error, onCancel, onSave }) {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const [note, setNote] = useState("");
  useEffect(() => {
    if (open) setNote("");
  }, [open]);
  return (
    <DialogFrame
      open={open}
      title={formatMessage("resubmitDialog.title")}
      saving={saving}
      error={error}
      onCancel={onCancel}
      saveLabel={formatMessage("action.resubmit")}
      onSave={() => onSave(note)}
    >
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {formatMessage("resubmitDialog.help")}
      </Typography>
      <TextField
        fullWidth
        multiline
        margin="dense"
        label={formatMessage("returns.note")}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
    </DialogFrame>
  );
}
