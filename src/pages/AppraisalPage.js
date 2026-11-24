import React, { useState } from "react";
import { useSelector } from "react-redux";
import LockOpenIcon from "@material-ui/icons/LockOpen";
import RefreshIcon from "@material-ui/icons/Refresh";
import {
  Form,
  Helmet,
  ProgressOrError,
  useGraphqlMutation,
  useGraphqlQuery,
  useHistory,
  useModulesManager,
  useParams,
  useTranslations,
} from "@openimis/fe-core";

import {
  ANSWER_ITEM_MUTATION,
  APPRAISAL_QUERY,
  DECIDE_ELIGIBILITY_MUTATION,
  REOPEN_APPRAISAL_MUTATION,
} from "../actions";
import AnswerItemDialog from "../components/AnswerItemDialog";
import AppraisalHeadPanel from "../components/AppraisalHeadPanel";
import AppraisalTabPanel from "../components/AppraisalTabPanel";
import ReopenDialog from "../components/ReopenDialog";
import {
  APPRAISAL_MODULE_NAME,
  RIGHT_APPRAISAL_VIEW,
} from "../constants";
import useAppraisalStyles from "../styles";
import { isAppraisalConfigured } from "../util/configuration";
import { refusalCode } from "../util/appraisal";

function AppraisalPage() {
  const classes = useAppraisalStyles();
  const modulesManager = useModulesManager();
  const history = useHistory();
  const { formatMessage, formatMessageWithValues } = useTranslations(APPRAISAL_MODULE_NAME, modulesManager);
  const { appraisal_uuid: appraisalUuid } = useParams();
  const rights = useSelector((state) => state.core?.user?.i_user?.rights ?? []);
  const [answering, setAnswering] = useState(null);
  const [answerError, setAnswerError] = useState(null);
  const [decisionError, setDecisionError] = useState(null);
  const [reopening, setReopening] = useState(false);
  const [reopenError, setReopenError] = useState(null);

  const { isLoading, error, data, refetch } = useGraphqlQuery(
    APPRAISAL_QUERY,
    { id: appraisalUuid },
    { skip: !rights.includes(RIGHT_APPRAISAL_VIEW), keepStale: true },
  );
  const answerMutation = useGraphqlMutation(ANSWER_ITEM_MUTATION);
  const decideMutation = useGraphqlMutation(DECIDE_ELIGIBILITY_MUTATION);
  const reopenMutation = useGraphqlMutation(REOPEN_APPRAISAL_MUTATION);

  if (!rights.includes(RIGHT_APPRAISAL_VIEW) || !isAppraisalConfigured(modulesManager)) return null;
  const appraisal = data?.appraisal?.edges?.[0]?.node;
  const applicant = `${appraisal?.individual?.firstName ?? ""} ${appraisal?.individual?.lastName ?? ""}`.trim();
  // What the user may do now comes from the backend, worked out by the same rules as the mutations
  const canScreen = !!appraisal?.canScreen;
  const canReopen = !!appraisal?.canReopen;
  const refusal = (err) => {
    const code = refusalCode(err);
    return code ? formatMessage(`refusal.${code}`) : String(err?.message || err);
  };

  const saveAnswer = async (answer) => {
    setAnswerError(null);
    try {
      await answerMutation.mutate({
        id: answering.uuid,
        result: answer.result,
        evidence: answer.evidence,
        comment: answer.comment,
        clientMutationLabel: formatMessageWithValues("mutation.answer", { item: answering.label, applicant }),
      });
      setAnswering(null);
      refetch();
    } catch (err) {
      setAnswerError(refusal(err));
    }
  };

  const decide = async (comment) => {
    setDecisionError(null);
    try {
      await decideMutation.mutate({
        id: appraisal.uuid,
        comment,
        clientMutationLabel: formatMessageWithValues("mutation.decide", { applicant }),
      });
      refetch();
    } catch (err) {
      setDecisionError(refusal(err));
    }
  };

  const reopen = async (reason) => {
    setReopenError(null);
    try {
      await reopenMutation.mutate({
        id: appraisal.uuid,
        reason,
        clientMutationLabel: formatMessageWithValues("mutation.reopen", { applicant }),
      });
      setReopening(false);
      refetch();
    } catch (err) {
      setReopenError(refusal(err));
    }
  };

  const actions = [{ doIt: refetch, icon: <RefreshIcon />, tooltip: formatMessage("action.refresh") }];
  if (canReopen) {
    actions.unshift({
      doIt: () => setReopening(true),
      icon: <LockOpenIcon />,
      tooltip: formatMessage("action.reopen"),
    });
  }

  return (
    <div className={classes.page}>
      <Helmet title={formatMessageWithValues("appraisal.title", { applicant })} />
      <ProgressOrError progress={isLoading && !appraisal} error={error} />
      {appraisal && (
        <Form
          module={APPRAISAL_MODULE_NAME}
          title="appraisal.title"
          titleParams={{ applicant }}
          edited={appraisal}
          readOnly
          back={() => history.goBack()}
          actions={actions}
          HeadPanel={AppraisalHeadPanel}
          Panels={[AppraisalTabPanel]}
          canScreen={canScreen}
          onAnswer={setAnswering}
          onDecide={decide}
          deciding={decideMutation.isLoading}
          decisionError={decisionError}
        />
      )}
      <AnswerItemDialog
        item={answering}
        open={!!answering}
        saving={answerMutation.isLoading}
        error={answerError}
        onCancel={() => {
          setAnswering(null);
          setAnswerError(null);
        }}
        onSave={saveAnswer}
      />
      <ReopenDialog
        open={reopening}
        applicant={applicant}
        decision={appraisal?.eligibility ? formatMessage(`eligibility.${appraisal.eligibility}`) : ""}
        saving={reopenMutation.isLoading}
        error={reopenError}
        onCancel={() => {
          setReopening(false);
          setReopenError(null);
        }}
        onSave={reopen}
      />
    </div>
  );
}

export default AppraisalPage;
