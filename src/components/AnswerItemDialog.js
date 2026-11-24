import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@material-ui/core";
import { useModulesManager, useTranslations } from "@openimis/fe-core";

import { APPRAISAL_MODULE_NAME, EMPTY_VALUE, RESULTS } from "../constants";
import useAppraisalStyles from "../styles";
import { answerProblem, parseJson, proposal } from "../util/appraisal";

function AnswerItemDialog({ item, open, saving, error, onCancel, onSave }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const [answer, setAnswer] = useState({ result: null, evidence: "", comment: "" });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open && item) {
      setAnswer({
        result: item.officerResult || proposal(item) || null,
        evidence: item.evidence || "",
        comment: item.comment || "",
      });
      setTouched(false);
    }
  }, [open, item]);

  if (!item) return null;
  const basis = parseJson(item.basis);
  const problem = answerProblem(answer);
  const save = () => {
    setTouched(true);
    if (!problem) onSave(answer);
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{item.label}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {formatMessageWithValues("answer.system", {
            result: item.systemResult ? formatMessage(`result.${item.systemResult}`) : EMPTY_VALUE,
            note: basis.note || "",
          })}
        </Typography>
        {proposal(item) && (
          <Typography variant="body2" gutterBottom>
            {formatMessageWithValues("answer.proposed", { result: formatMessage(`result.${proposal(item)}`) })}
          </Typography>
        )}
        {item.basisChanged && (
          <Typography variant="body2" color="error" gutterBottom>
            {formatMessage("answer.basisChanged")}
          </Typography>
        )}
        <RadioGroup row value={answer.result || ""} onChange={(e) => setAnswer({ ...answer, result: e.target.value })}>
          {RESULTS.map((result) => (
            <FormControlLabel
              key={result}
              value={result}
              control={<Radio color="primary" />}
              label={formatMessage(`result.${result}`)}
            />
          ))}
        </RadioGroup>
        <TextField
          fullWidth
          multiline
          margin="dense"
          label={formatMessage("answer.evidence")}
          helperText={formatMessage("answer.evidenceHelp")}
          value={answer.evidence}
          error={touched && problem === "evidence"}
          onChange={(e) => setAnswer({ ...answer, evidence: e.target.value })}
        />
        <TextField
          fullWidth
          multiline
          margin="dense"
          label={formatMessage("answer.comment")}
          helperText={formatMessage("answer.commentHelp")}
          value={answer.comment}
          error={touched && problem === "comment"}
          onChange={(e) => setAnswer({ ...answer, comment: e.target.value })}
        />
        {touched && problem && (
          <Typography variant="body2" color="error">
            {formatMessage(`answer.required.${problem}`)}
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

export default AnswerItemDialog;
