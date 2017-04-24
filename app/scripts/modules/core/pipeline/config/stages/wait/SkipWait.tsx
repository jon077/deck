import * as React from 'react';

import {IExecution, IExecutionStage} from 'core/domain';
import {Application} from 'core/application/application.model';
import {confirmationModalService} from 'core/confirmationModal/confirmationModal.service';
import {executionService} from 'core/delivery/service/execution.service';
import {duration} from 'core/utils/timeFormatters';
import {OrchestratedItemRunningTime} from 'core/delivery/executionGroup/execution/OrchestratedItemRunningTime';

interface IProps {
  execution: IExecution;
  stage: IExecutionStage;
  application: Application;
}

interface IState {
  remainingWait?: string;
}

export class SkipWait extends React.Component<IProps, IState> {
  private runningTime: OrchestratedItemRunningTime;

  constructor(props: IProps) {
    super(props);
    this.state = {
      remainingWait: null
    };
    this.runningTime = new OrchestratedItemRunningTime(props.stage, (time: number) => this.setRemainingWait(time));
  }

  private setRemainingWait = (time: number): void => {
    this.setState({remainingWait: duration(this.props.stage.context.waitTime * 1000 - time) });
  };

  private skipRemainingWait = (e: React.MouseEvent<HTMLElement>): void => {
    (e.target as HTMLElement).blur(); // forces closing of the popover when the modal opens
    const stage = this.props.stage;
    const matcher = (execution: IExecution) => {
      const match = execution.stages.find((test) => test.id === stage.id);
      return match.status !== 'RUNNING';
    };

    const data = { skipRemainingWait: true };
    confirmationModalService.confirm({
      header: 'Really skip wait?',
      buttonText: 'Skip',
      body: '<p>The pipeline will proceed immediately, marking this stage completed.</p>',
      submitMethod: () => {
        return executionService.patchExecution(this.props.execution.id, stage.id, data)
          .then(() => executionService.waitUntilExecutionMatches(this.props.execution.id, matcher));
      }
    });
  };

  public componentWillReceiveProps() {
    this.runningTime.checkStatus();
  }

  public componentWillUnmount() {
    this.runningTime.reset();
  }

  public render() {
    const stage = this.props.stage;
    return (
      <div>
        <div>
          <b>Wait time: </b>
          {stage.context.waitTime} seconds
          { stage.context.skipRemainingWait && (
            <span>(skipped after {duration(stage.runningTimeInMs)})</span>
          )}
        </div>
        { stage.isRunning && (
          <div>
            <div>
              <b>Remaining: </b>
              {this.state.remainingWait}
            </div>
            <div className="action-buttons">
              <button className="btn btn-xs btn-primary" onClick={this.skipRemainingWait}>
                <span style={{marginRight: '5px'}} className="small glyphicon glyphicon-fast-forward"/>
                Skip remaining wait
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
}