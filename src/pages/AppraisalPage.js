import React, { useState } from "react";
import { useSelector } from "react-redux";
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

import { ANSWER_ITEM_MUTATION, APPRAISAL_QUERY, DECIDE_ELIGIBILITY_MUTATION } from "../actions";
import AnswerItemDialog from "../components/AnswerItemDialog";
import AppraisalHeadPanel from "../components/AppraisalHeadPanel";
import AppraisalTabPanel from "../components/AppraisalTabPanel";
import { APPRAISAL_MODULE_NAME, RIGHT_APPRAISAL_SCREEN, RIGHT_APPRAISAL_VIEW } from "../constants";
import useAppraisalStyles from "../styles";
import { isScreeningOpen, refusalCode } from "../util/appraisal";

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

  const { isLoading, error, data, refetch } = useGraphqlQuery(
    APPRAISAL_QUERY,
    { id: appraisalUuid },
    { skip: !rights.includes(RIGHT_APPRAISAL_VIEW), keepStale: true },
  );
  const answerMutation = useGraphqlMutation(ANSWER_ITEM_MUTATION);
  const decideMutation = useGraphqlMutation(DECIDE_ELIGIBILITY_MUTATION);

  if (!rights.includes(RIGHT_APPRAISAL_VIEW)) return null;
  const appraisal = data?.appraisal?.edges?.[0]?.node;
  const applicant = `${appraisal?.individual?.firstName ?? ""} ${appraisal?.individual?.lastName ?? ""}`.trim();
  const canScreen = rights.includes(RIGHT_APPRAISAL_SCREEN) && isScreeningOpen(appraisal);
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
          actions={[{ doIt: refetch, icon: <RefreshIcon />, tooltip: formatMessage("action.refresh") }]}
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
    </div>
  );
}

export default AppraisalPage;
