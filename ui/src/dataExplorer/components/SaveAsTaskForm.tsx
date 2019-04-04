// Libraries
import React, {PureComponent, ChangeEvent} from 'react'
import {connect} from 'react-redux'
import {withRouter, WithRouterProps} from 'react-router'
import _ from 'lodash'

// Components
import TaskForm from 'src/tasks/components/TaskForm'

// Actions
import {
  saveNewScript,
  setTaskOption,
  clearTask,
  setNewScript,
} from 'src/tasks/actions'

// Utils
import {getActiveTimeMachine} from 'src/timeMachine/selectors'
import {getTimeRangeVars} from 'src/variables/utils/getTimeRangeVars'
import {getWindowVars} from 'src/variables/utils/getWindowVars'
import {formatVarsOption} from 'src/variables/utils/formatVarsOption'
import {
  taskOptionsToFluxScript,
  addDestinationToFluxScript,
} from 'src/utils/taskOptionsToFluxScript'

// Types
import {AppState, Organization, TimeRange} from 'src/types'
import {
  TaskSchedule,
  TaskOptions,
  TaskOptionKeys,
} from 'src/utils/taskOptionsToFluxScript'
import {DashboardDraftQuery} from 'src/types/dashboards'

interface OwnProps {
  dismiss: () => void
}

interface DispatchProps {
  saveNewScript: typeof saveNewScript
  setTaskOption: typeof setTaskOption
  clearTask: typeof clearTask
  setNewScript: typeof setNewScript
}

interface StateProps {
  orgs: Organization[]
  taskOptions: TaskOptions
  draftQueries: DashboardDraftQuery[]
  activeQueryIndex: number
  newScript: string
  timeRange: TimeRange
}

type Props = StateProps & OwnProps & DispatchProps

class SaveAsTaskForm extends PureComponent<Props & WithRouterProps> {
  public componentDidMount() {
    const {setTaskOption, setNewScript} = this.props

    setTaskOption({
      key: 'taskScheduleType',
      value: TaskSchedule.interval,
    })

    setNewScript(this.activeScript)
  }

  public componentWillUnmount() {
    const {clearTask} = this.props

    clearTask()
  }

  public render() {
    const {taskOptions, dismiss} = this.props

    return (
      <TaskForm
        taskOptions={taskOptions}
        onChangeScheduleType={this.handleChangeScheduleType}
        onChangeInput={this.handleChangeInput}
        onChangeToBucketName={this.handleChangeToBucketName}
        isInOverlay={true}
        onSubmit={this.handleSubmit}
        canSubmit={this.isFormValid}
        dismiss={dismiss}
      />
    )
  }

  private get isFormValid(): boolean {
    const {
      taskOptions: {name, cron, interval},
    } = this.props
    const hasSchedule = !!cron || !!interval

    return hasSchedule && !!name && !!this.activeScript
  }

  private get activeScript(): string {
    const {draftQueries, activeQueryIndex} = this.props

    return _.get(draftQueries, `${activeQueryIndex}.text`)
  }

  private handleSubmit = async () => {
    const {saveNewScript, newScript, taskOptions, timeRange} = this.props

    // When a task runs, it does not have access to variables that we typically
    // inject into the script via the front end. So any variables that are used
    // in the script need to be embedded in the script text itself before
    // saving it as a task
    //
    // TODO(chnn): Embed user-defined variables in the script as well
    const timeRangeVars = getTimeRangeVars(timeRange)
    const windowPeriodVars = await getWindowVars(newScript, timeRangeVars)

    // Don't embed variables that are not used in the script
    const vars = [...timeRangeVars, ...windowPeriodVars].filter(assignment =>
      newScript.includes(assignment.id.name)
    )

    const varOption: string = formatVarsOption(vars) // option v = { ... }
    const taskOption: string = taskOptionsToFluxScript(taskOptions) // option task = { ... }
    const preamble = `${varOption}\n\n${taskOption}`
    const script = addDestinationToFluxScript(newScript, taskOptions)

    saveNewScript(script, preamble)
  }

  private handleChangeToBucketName = (bucketName: string) => {
    const {setTaskOption} = this.props

    setTaskOption({key: 'toBucketName', value: bucketName})
  }

  private handleChangeScheduleType = (taskScheduleType: TaskSchedule) => {
    const {setTaskOption} = this.props

    setTaskOption({key: 'taskScheduleType', value: taskScheduleType})
  }

  private handleChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
    const {setTaskOption} = this.props

    const key = e.target.name as TaskOptionKeys
    const value = e.target.value

    setTaskOption({key, value})
  }
}

const mstp = (state: AppState): StateProps => {
  const {
    orgs: {items},
    tasks: {newScript, taskOptions},
  } = state

  const {draftQueries, activeQueryIndex, timeRange} = getActiveTimeMachine(
    state
  )

  return {
    orgs: items,
    newScript,
    taskOptions,
    timeRange,
    draftQueries,
    activeQueryIndex,
  }
}

const mdtp: DispatchProps = {
  saveNewScript,
  setTaskOption,
  clearTask,
  setNewScript,
}

export default connect<StateProps, DispatchProps>(
  mstp,
  mdtp
)(withRouter(SaveAsTaskForm))
