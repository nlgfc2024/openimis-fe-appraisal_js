import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@material-ui/core";
import { useModulesManager, useTranslations } from "@openimis/fe-core";

import { APPRAISAL_MODULE_NAME } from "../constants";
import useAppraisalStyles from "../styles";
import { formatPoints, parseJson, scoreProblem } from "../util/appraisal";

function ScoreDialog({ item, open, saving, error, onCancel, onSave }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const [score, setScore] = useState({ points: "", evidence: "", comment: "" });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open && item) {
      setScore({
        points: formatPoints(item.officerPoints ?? item.systemPoints) ?? "",
        evidence: item.evidence || "",
        comment: item.comment || "",
      });
      setTouched(false);
    }
  }, [open, item]);

  if (!item) return null;
  const basis = parseJson(item.basis);
  const problem = scoreProblem(score, item.maxPoints);
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
            points: formatPoints(item.systemPoints) ?? "0",
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
          type="number"
          inputProps={{ min: 0, max: Number(item.maxPoints), step: 1 }}
          label={formatMessageWithValues("scoreDialog.points", { max: formatPoints(item.maxPoints) })}
          value={score.points}
          error={touched && problem === "points"}
          onChange={(e) => setScore({ ...score, points: e.target.value })}
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
            {formatMessageWithValues(`scoreDialog.required.${problem}`, { max: formatPoints(item.maxPoints) })}
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
