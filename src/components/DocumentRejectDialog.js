import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@material-ui/core";
import { useModulesManager, useTranslations } from "@openimis/fe-core";

import { APPRAISAL_MODULE_NAME, DOCUMENT_REJECTED } from "../constants";
import useAppraisalStyles from "../styles";
import { documentReviewProblem } from "../util/appraisal";

function DocumentRejectDialog({ document, saving, error, onCancel, onSave }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const [comment, setComment] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setComment(document?.status === DOCUMENT_REJECTED ? document.comment || "" : "");
    setTouched(false);
  }, [document]);

  if (!document) return null;
  const problem = documentReviewProblem({ status: DOCUMENT_REJECTED, comment });
  const save = () => {
    setTouched(true);
    if (!problem) onSave(comment);
  };

  return (
    <Dialog open onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{formatMessageWithValues("rejectDialog.title", { document: document.label })}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          multiline
          autoFocus
          margin="dense"
          label={formatMessage("rejectDialog.reason")}
          helperText={formatMessage("rejectDialog.help")}
          value={comment}
          error={touched && !!problem}
          onChange={(e) => setComment(e.target.value)}
        />
        {touched && problem && (
          <Typography variant="body2" className={classes.warning}>
            {formatMessage("rejectDialog.required")}
          </Typography>
        )}
        {error && (
          <Typography variant="body2" className={classes.warning}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={save} className={classes.primaryButton} disabled={saving}>
          {formatMessage("action.reject")}
        </Button>
        <Button onClick={onCancel} className={classes.secondaryButton} disabled={saving}>
          {formatMessage("action.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DocumentRejectDialog;
