import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@material-ui/core";
import { useModulesManager, useTranslations } from "@openimis/fe-core";

import { APPRAISAL_MODULE_NAME } from "../constants";
import useAppraisalStyles from "../styles";
import { displayValue, formatPoints, parseJson, scoreProblem } from "../util/appraisal";

function ScoreDialog({ item, open, saving, error, onCancel, onSave }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const [score, setScore] = useState({ value: "", evidence: "", comment: "" });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open && item) {
      setScore({
        value: item.officerValue ?? displayValue(parseJson(item.basis).value),
        evidence: item.evidence || "",
        comment: item.comment || "",
      });
      setTouched(false);
    }
  }, [open, item]);

  if (!item) return null;
  const basis = parseJson(item.basis);
  const problem = scoreProblem(score);
  const save = () => {
    setTouched(true);
    if (!problem) onSave(score);
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{item.label}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {formatMessageWithValues("scoreDialog.system", {
            value: displayValue(basis.value) || formatMessage("scoreDialog.noValue"),
            points: formatPoints(item.systemPoints) ?? formatMessage("scoreDialog.noPoints"),
            max: formatPoints(item.maxPoints),
            note: basis.note || "",
          })}
        </Typography>
        {item.basisChanged && (
          <Typography variant="body2" className={classes.warning} gutterBottom>
            {formatMessage("scoreDialog.basisChanged")}
          </Typography>
        )}
        <TextField
          fullWidth
          margin="dense"
          label={formatMessage("scoreDialog.value")}
          helperText={formatMessage("scoreDialog.valueHelp")}
          value={score.value}
          error={touched && problem === "value"}
          onChange={(e) => setScore({ ...score, value: e.target.value })}
        />
        <TextField
          fullWidth
          multiline
          margin="dense"
          label={formatMessage("answer.evidence")}
          helperText={formatMessage("scoreDialog.evidenceHelp")}
          value={score.evidence}
          error={touched && problem === "evidence"}
          onChange={(e) => setScore({ ...score, evidence: e.target.value })}
        />
        <TextField
          fullWidth
          multiline
          margin="dense"
          label={formatMessage("answer.comment")}
          value={score.comment}
          onChange={(e) => setScore({ ...score, comment: e.target.value })}
        />
        {touched && problem && (
          <Typography variant="body2" className={classes.warning}>
            {formatMessage(`scoreDialog.required.${problem}`)}
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
          {formatMessage("action.save")}
        </Button>
        <Button onClick={onCancel} className={classes.secondaryButton} disabled={saving}>
          {formatMessage("action.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ScoreDialog;
