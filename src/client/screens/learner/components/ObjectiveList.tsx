/**
 * The skills the learner is working on, with the state the API reported.
 *
 * A child sees the state word, not the evidence counts — those belong to the
 * parent. The pill's glyph keeps the state readable without colour.
 */

import type { LearnerHomeResponse } from "../../../../shared/api-contract";
import { competencyClass, competencyGlyph, competencyLabel } from "../../../lib/format";

type Objective = LearnerHomeResponse["currentObjectives"][number];

export function ObjectiveList({
  objectives,
}: {
  objectives: Objective[];
}): React.JSX.Element {
  return (
    <ul className="rows">
      {objectives.map((objective) => (
        <li key={objective.skillId} className="row">
          <span className="row__main">
            <span className="row__title">{objective.skillNameVi}</span>
            <br />
            <span className={`pill ${competencyClass(objective.state)}`}>
              <span aria-hidden="true">{competencyGlyph(objective.state)}</span>
              {competencyLabel(objective.state)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
