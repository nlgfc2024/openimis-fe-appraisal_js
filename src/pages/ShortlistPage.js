import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Helmet, useGraphqlQuery, useModulesManager, useTranslations } from "@openimis/fe-core";

import { LATEST_ROUND_QUERY } from "../actions";
import RankingSearcher from "../components/RankingSearcher";
import ShortlistPanel from "../components/ShortlistPanel";
import { APPRAISAL_MODULE_NAME, RIGHT_APPRAISAL_VIEW } from "../constants";
import useAppraisalStyles from "../styles";

/** Ranking and shortlist of one programme round, opened on the latest round. */
function ShortlistPage() {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  const allowed = rights.includes(RIGHT_APPRAISAL_VIEW);
  const { data } = useGraphqlQuery(LATEST_ROUND_QUERY, {}, { skip: !allowed });
  const [selection, setSelection] = useState({ programme: "", round: "" });
  // Remounting the list fetches it again after a change of round or a score / shortlist run
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const latest = data?.appraisal?.edges?.[0]?.node;
    if (latest && !selection.programme && !selection.round) {
      setSelection({ programme: latest.programme, round: latest.round });
    }
  }, [data]);

  if (!allowed) return null;
  const ready = !!selection.programme && !!selection.round;
  return (
    <div className={classes.page}>
      <Helmet title={formatMessage("shortlist.title")} />
      <ShortlistPanel
        programme={selection.programme}
        round={selection.round}
        onChange={(next) => {
          setSelection(next);
          setVersion((v) => v + 1);
        }}
        onDone={() => setVersion((v) => v + 1)}
      />
      {ready && (
        <RankingSearcher
          key={`${selection.programme}|${selection.round}|${version}`}
          programme={selection.programme}
          round={selection.round}
        />
      )}
    </div>
  );
}

export default ShortlistPage;
