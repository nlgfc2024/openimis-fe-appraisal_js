import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@material-ui/core";
import {
  Table,
  TextInput,
  formatDateTimeFromISO,
  useGraphqlMutation,
  useModulesManager,
  useTranslations,
} from "@openimis/fe-core";
import { useIntl } from "react-intl";

import { SCORE_APPRAISALS_MUTATION, SHORTLIST_MUTATION } from "../actions";
import { APPRAISAL_MODULE_NAME, RIGHT_APPRAISAL_SCORE, RIGHT_APPRAISAL_SHORTLIST } from "../constants";
import useAppraisalStyles from "../styles";
import { refusalCode, shortlistRun } from "../util/appraisal";

function ShortlistPanel({ programme, round, onChange, onDone }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const intl = useIntl();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  const ranking = useSelector((state) => state.appraisal.ranking);
  const [draft, setDraft] = useState({ programme, round });
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const scoreMutation = useGraphqlMutation(SCORE_APPRAISALS_MUTATION);
  const shortlistMutation = useGraphqlMutation(SHORTLIST_MUTATION);
  const run = shortlistRun((ranking || []).find((appraisal) => shortlistRun(appraisal)));
  const ready = !!programme && !!round;
  useEffect(() => setDraft({ programme, round }), [programme, round]);
  // The round is applied when a field is left, not on every keystroke
  const apply = () => {
    if (draft.programme !== programme || draft.round !== round) onChange(draft);
  };
  const busy = scoreMutation.isLoading || shortlistMutation.isLoading;

  const perform = async (mutation, label) => {
    setError(null);
    try {
      await mutation.mutate({
        programme,
        round,
        clientMutationLabel: formatMessageWithValues(label, { programme, round }),
      });
      onDone();
    } catch (err) {
      const code = refusalCode(err);
      setError(code ? formatMessage(`refusal.${code}`) : String(err?.message || err));
    }
  };

  return (
    <Paper className={classes.paper}>
      <Typography className={classes.title}>{formatMessage("shortlist.title")}</Typography>
      <Grid container alignItems="flex-end" className={classes.item}>
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          <TextInput
            module={APPRAISAL_MODULE_NAME}
            label="appraisal.programme"
            value={draft.programme}
            onChange={(value) => setDraft({ ...draft, programme: value })}
            onBlur={apply}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          <TextInput
            module={APPRAISAL_MODULE_NAME}
            label="appraisal.round"
            value={draft.round}
            onChange={(value) => setDraft({ ...draft, round: value })}
            onBlur={apply}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          {rights.includes(RIGHT_APPRAISAL_SCORE) && (
            <Button
              fullWidth
              color="primary"
              variant="outlined"
              disabled={!ready || busy}
              onClick={() => perform(scoreMutation, "mutation.scoreRound")}
            >
              {formatMessage("action.scoreRound")}
            </Button>
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3} className={classes.item}>
          {rights.includes(RIGHT_APPRAISAL_SHORTLIST) && (
            <Button
              fullWidth
              color="primary"
              variant="contained"
              disabled={!ready || busy}
              onClick={() => setConfirming(true)}
            >
              {formatMessage("action.shortlist")}
            </Button>
          )}
        </Grid>
        {error && (
          <Grid item xs={12} className={classes.item}>
            <Typography variant="body2" className={classes.warning}>
              {error}
            </Typography>
          </Grid>
        )}
      </Grid>
      <Divider />
      {run ? (
        <>
          <Typography variant="body2" className={`${classes.section} ${classes.muted}`}>
            {formatMessageWithValues("shortlist.lastRun", {
              user: run.by,
              date: formatDateTimeFromISO(modulesManager, intl, run.at),
            })}
          </Typography>
          <Table
            module={APPRAISAL_MODULE_NAME}
            headers={["shortlist.group", "shortlist.places", "shortlist.ranked", "shortlist.shortlisted"]}
            items={run.groups}
            itemFormatters={[
              (group) => group.group ?? formatMessage("shortlist.overall"),
              (group) => group.places,
              (group) => group.ranked,
              (group) => group.shortlisted,
            ]}
          />
        </>
      ) : (
        <Typography variant="body2" className={`${classes.section} ${classes.muted}`}>
          {formatMessage("shortlist.notRun")}
        </Typography>
      )}
      <Dialog open={confirming} onClose={() => setConfirming(false)}>
        <DialogTitle>{formatMessageWithValues("shortlist.confirmTitle", { programme, round })}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{formatMessage("shortlist.confirmMessage")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            className={classes.primaryButton}
            autoFocus
            onClick={() => {
              setConfirming(false);
              perform(shortlistMutation, "mutation.shortlist");
            }}
          >
            {formatMessage("action.shortlist")}
          </Button>
          <Button className={classes.secondaryButton} onClick={() => setConfirming(false)}>
            {formatMessage("action.cancel")}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default ShortlistPanel;
