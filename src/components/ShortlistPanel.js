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

import { CLOSE_SHORTLIST_MUTATION, SCORE_APPRAISALS_MUTATION, SHORTLIST_MUTATION } from "../actions";
import { APPRAISAL_MODULE_NAME, RIGHT_APPRAISAL_SCORE, RIGHT_APPRAISAL_SHORTLIST } from "../constants";
import useAppraisalStyles from "../styles";
import { refusalCode, shortlistClosed, shortlistRun } from "../util/appraisal";

function ShortlistPanel({ programme, round, onChange, onDone }) {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const intl = useIntl();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  const ranking = useSelector((state) => state.appraisal.ranking);
  const [draft, setDraft] = useState({ programme, round });
  const [confirming, setConfirming] = useState(null);
  const [error, setError] = useState(null);
  const scoreMutation = useGraphqlMutation(SCORE_APPRAISALS_MUTATION);
  const shortlistMutation = useGraphqlMutation(SHORTLIST_MUTATION);
  const closeMutation = useGraphqlMutation(CLOSE_SHORTLIST_MUTATION);
  const run = shortlistRun((ranking || []).find((appraisal) => shortlistRun(appraisal)));
  const closed = shortlistClosed(run);
  const ready = !!programme && !!round;
  const canShortlist = rights.includes(RIGHT_APPRAISAL_SHORTLIST);
  useEffect(() => setDraft({ programme, round }), [programme, round]);
  // The round is applied when a field is left, not on every keystroke
  const apply = () => {
    if (draft.programme !== programme || draft.round !== round) onChange(draft);
  };
  const busy = scoreMutation.isLoading || shortlistMutation.isLoading || closeMutation.isLoading;
  const date = (value) => formatDateTimeFromISO(modulesManager, intl, value);
  // The confirmation shown for each action: its mutation, translation keys and button label
  const confirmations = {
    shortlist: {
      mutation: shortlistMutation,
      label: "mutation.shortlist",
      text: "shortlist.confirm",
      action: "action.shortlist",
    },
    close: {
      mutation: closeMutation,
      label: "mutation.closeShortlist",
      text: "shortlist.closeConfirm",
      action: "action.closeShortlist",
    },
  };
  const confirmation = confirmations[confirming];

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
          {canShortlist && (
            <Button
              fullWidth
              color="primary"
              variant="contained"
              disabled={!ready || busy || !!closed}
              onClick={() => setConfirming("shortlist")}
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
            {formatMessageWithValues("shortlist.lastRun", { user: run.by, date: date(run.at) })}
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
          <Divider />
          {closed ? (
            <Typography variant="body2" className={classes.section}>
              {formatMessageWithValues("shortlist.closed", { user: closed.by, date: date(closed.at) })}
            </Typography>
          ) : (
            canShortlist && (
              <Grid container alignItems="center" className={classes.item}>
                <Grid item xs={12} md={9} className={classes.item}>
                  <Typography variant="body2" className={classes.muted}>
                    {formatMessage("shortlist.closeHelp")}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3} className={classes.item}>
                  <Button
                    fullWidth
                    color="primary"
                    variant="outlined"
                    disabled={!ready || busy}
                    onClick={() => setConfirming("close")}
                  >
                    {formatMessage("action.closeShortlist")}
                  </Button>
                </Grid>
              </Grid>
            )
          )}
        </>
      ) : (
        <Typography variant="body2" className={`${classes.section} ${classes.muted}`}>
          {formatMessage("shortlist.notRun")}
        </Typography>
      )}
      <Dialog open={!!confirmation} onClose={() => setConfirming(null)}>
        <DialogTitle>
          {confirmation && formatMessageWithValues(`${confirmation.text}Title`, { programme, round })}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2">{confirmation && formatMessage(`${confirmation.text}Message`)}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            className={classes.primaryButton}
            autoFocus
            onClick={() => {
              setConfirming(null);
              perform(confirmation.mutation, confirmation.label);
            }}
          >
            {confirmation && formatMessage(confirmation.action)}
          </Button>
          <Button className={classes.secondaryButton} onClick={() => setConfirming(null)}>
            {formatMessage("action.cancel")}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default ShortlistPanel;
